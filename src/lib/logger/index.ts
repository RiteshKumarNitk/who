import winston from "winston";

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "ISO" }),
  winston.format.errors({ stack: true }),
  process.env.NODE_ENV === "development"
    ? winston.format.prettyPrint({ colorize: true })
    : winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  defaultMeta: { service: "who-gis-surveillance" },
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === "development"
          ? winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
          : winston.format.json(),
    }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880,
      maxFiles: 10,
    }),
  ],
});

export default logger;
