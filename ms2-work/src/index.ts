import dotenv from "dotenv";
import RabbitmqRpcWorker from "./RabbitmqRpcWorker.js";
import Key1MessageProcessor from "./Key1MessageProcessor.js";
import logger from "./logger.js";
import { logAndThrow } from "./util.js";
dotenv.config();

const rabbitmqHost = process.env.RABBITMQ_HOST;
const rabbitmqPort = process.env.RABBITMQ_PORT;
const rabbitmqWorkQueue = process.env.RABBITMQ_QUEUE_WORK!;
if (!rabbitmqHost || !rabbitmqPort || !rabbitmqWorkQueue) {
  logAndThrow("Missing some RabbitMQ env vars");
}

const rabbitmqUrl = `amqp://${rabbitmqHost}:${rabbitmqPort}`;

const _: RabbitmqRpcWorker = await RabbitmqRpcWorker.create(
  rabbitmqUrl,
  rabbitmqWorkQueue,
  Key1MessageProcessor
);

logger.info("ms2-work started.");
