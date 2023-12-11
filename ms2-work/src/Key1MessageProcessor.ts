import { Message } from "amqplib";
import { setTimeout as sleep } from "node:timers/promises";
import { ErrorOpResult, OkOpResult, OpResult } from "./OpResult.js";
import logger from "./logger.js";

const INPUT_KEY1 = "key1";
const ERR_MISSING_OR_INVALID_INPUT = (inputName: string) => `Missing or invalid ${inputName} input`;

export default async function Key1MessageProcessor(message: Message): Promise<OpResult> {
  let input: string;
  try {
    input = JSON.parse(message.content.toString())[INPUT_KEY1];
    if (!input || typeof input != "string") {
      return ErrorOpResult(ERR_MISSING_OR_INVALID_INPUT(INPUT_KEY1));
    }
  } catch (e) {
    return ErrorOpResult(ERR_MISSING_OR_INVALID_INPUT(INPUT_KEY1));
  }

  const randomTimeoutMs = Math.round((Math.random() + 1) * 1500);
  await sleep(randomTimeoutMs); // synthetic delay.
  let result: { [k: string]: any } = {};
  result[INPUT_KEY1] = `${input}_${randomTimeoutMs}`;
  logger.info("Key1MessageProcessor - finished processing", {
    data: {
      key: INPUT_KEY1,
      input,
      result: result[INPUT_KEY1],
    },
  });
  return OkOpResult(result);
}
