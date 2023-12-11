import logger from "./logger.js";

export const logAndThrow = (errorMessage: string) => {
  const e = new Error(errorMessage);
  logger.error(e);
  throw e;
};
export const logAndThrowWrapped = (logErrorMessage: string, originalErrorContent: string) => {
  const e = new Error(originalErrorContent);
  logger.error(logErrorMessage, e);
  throw e;
};
