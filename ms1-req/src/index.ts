import express, { Request, Response, Application } from "express";
import dotenv from "dotenv";
import RabbitmqRpcDispatcher from "./RabbitmqRpcDispatcher.js";
import bodyParser from "body-parser";
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
const dispatcher: RabbitmqRpcDispatcher = await RabbitmqRpcDispatcher.create(
  rabbitmqUrl,
  rabbitmqWorkQueue!
);

const app: Application = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 8001;

app.post("/work/key1", async (req: Request, res: Response) => {
  try {
    logger.info("[api] /work/key1 - req", { body: req.body });
    const result = await dispatcher.dispatch(req.body);
    res.send(result);
  } catch (e) {
    logger.error(e);
    return res.status(500).send();
  }
});

app.listen(port, () => {
  logger.info(`ms1-req listening at :::${port}`);
});
