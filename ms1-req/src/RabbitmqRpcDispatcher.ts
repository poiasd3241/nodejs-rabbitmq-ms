import { nanoid } from "nanoid";
import { EventEmitter } from "events";
import { Channel, ConsumeMessage, connect } from "amqplib";
import logger from "./logger.js";
import { ErrorOpResult, OkOpResult, OpResult } from "./OpResult.js";
import { logAndThrowWrapped } from "./util.js";

export default class RabbitmqRpcDispatcher {
  private constructor(
    private inChannel: Channel,
    private outChannel: Channel,
    private outQueue: string,
    private inQueue: string
  ) {}
  private responseEvent: EventEmitter = new EventEmitter();

  public static async create(
    rabbitmqUrl: string,
    outQueue: string
  ): Promise<RabbitmqRpcDispatcher> {
    try {
      const connection = await connect(rabbitmqUrl);
      const inChannel = await connection.createChannel();
      const outChannel = await connection.createChannel();
      const inQueue = `${outQueue}_response_${nanoid()}`;
      let obj: RabbitmqRpcDispatcher = new RabbitmqRpcDispatcher(
        inChannel,
        outChannel,
        outQueue,
        inQueue
      );
      await inChannel.assertQueue(obj.inQueue, { exclusive: true });
      obj.listenForResponses();
      return obj;
    } catch (e) {
      return logAndThrowWrapped("Failed to create RabbitmqRpcDispatcher", JSON.stringify(e));
    }
  }

  async listenForResponses() {
    this.inChannel.consume(this.inQueue, (message: ConsumeMessage | null) => {
      if (!message) {
        logger.warn("Recieved null response");
        return;
      }

      logger.info("Recieved response", {
        response: {
          content: JSON.parse(message.content.toString()),
          properties: message.properties,
        },
      });
      this.inChannel.ack(message);
      this.responseEvent.emit(message.properties.correlationId.toString(), message);
    });
    logger.info(`RabbitmqRpcDispatcher listening on queue ${this.inQueue}`);
  }

  public async dispatch(data: any): Promise<OpResult> {
    const taskId = nanoid();
    logger.info(`Dispatching task to ${this.outQueue} queue`, {
      task: { data, replyTo: this.inQueue, correlationId: taskId },
    });
    this.outChannel.sendToQueue(this.outQueue, Buffer.from(JSON.stringify(data)), {
      replyTo: this.inQueue,
      correlationId: taskId,
    });

    // Wait for response.
    return new Promise((resolve, _reject) => {
      this.responseEvent.once(taskId, async (res: ConsumeMessage) => {
        const result = JSON.parse(res.content.toString());
        if (typeof result.isError != "boolean") {
          logger.error("Unexpected response", result);
          resolve(ErrorOpResult("Processing error"));
        }
        resolve(result.isError ? ErrorOpResult(result.errorMessage) : OkOpResult(result.data));
      });
    });
  }
}
