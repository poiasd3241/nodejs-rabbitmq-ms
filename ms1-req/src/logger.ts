import winston from "winston";
const { combine, json, timestamp, errors } = winston.format;

const logger = winston.createLogger({
  level: "info",
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

if (process.env.NODE_ENV != "production") {
  logger.add(new winston.transports.Console());
}

export default logger;
