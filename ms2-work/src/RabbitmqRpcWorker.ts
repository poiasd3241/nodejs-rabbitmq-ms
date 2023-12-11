import { Channel, ConsumeMessage, Message, connect } from "amqplib";
import logger from "./logger.js";
import { ErrorOpResult, OpResult } from "./OpResult.js";
import { logAndThrowWrapped } from "./util.js";

export default class RabbitmqRpcWorker {
  private constructor(
    private inChannel: Channel,
    private outChannel: Channel,
    private inQueue: string,
    private messageProcessor: (msg: Message) => Promise<OpResult>
  ) {}

  public static async create(
    rabbitmqUrl: string,
    inQueue: string,
    messageProcessor: (msg: Message) => Promise<OpResult>
  ): Promise<RabbitmqRpcWorker> {
    try {
      const connection = await connect(rabbitmqUrl);
      const inChannel = await connection.createChannel();
      const outChannel = await connection.createChannel();
      let obj: RabbitmqRpcWorker = new RabbitmqRpcWorker(
        inChannel,
        outChannel,
        inQueue,
        messageProcessor
      );
      await inChannel.assertQueue(inQueue, { exclusive: true });
      obj.listenForRequests();
      return obj;
    } catch (e) {
      return logAndThrowWrapped("Failed to create RabbitmqRpcWorker", JSON.stringify(e));
    }
  }

  private async listenForRequests() {
    this.inChannel.consume(this.inQueue, async (message: ConsumeMessage | null) => {
      if (!message) {
        logger.warn("Recieved null request");
        return;
      }

      logger.info("Recieved request", {
        response: {
          content: JSON.parse(message.content.toString()),
          properties: message.properties,
        },
      });
      let result: OpResult;
      const { correlationId, replyTo } = message.properties;
      if (!correlationId || !replyTo) {
        result = ErrorOpResult("Missing `correlationId` or `replyTo` request props");
      } else {
        result = await this.messageProcessor(message);
      }
      logger.info(`Responding to ${replyTo} queue`, {
        data: { content: JSON.stringify(result), correlationId },
      });

      this.inChannel.ack(message);
      this.outChannel.sendToQueue(replyTo, Buffer.from(JSON.stringify(result)), { correlationId });
    });
    logger.info(`RabbitmqRpcWorker listening on queue ${this.inQueue}`);
  }
}
