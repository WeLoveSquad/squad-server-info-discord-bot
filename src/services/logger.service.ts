import config from "config";
import { singleton } from "tsyringe";
import type { Logger as WinstonLogger } from "winston";
import * as winston from "winston";

@singleton()
export class Logger {
  private readonly logger: WinstonLogger;

  public readonly error: winston.LeveledLogMethod;
  public readonly warn: winston.LeveledLogMethod;
  public readonly info: winston.LeveledLogMethod;
  public readonly verbose: winston.LeveledLogMethod;
  public readonly debug: winston.LeveledLogMethod;

  constructor() {
    let consoleFormat: winston.Logform.Format;
    if (config.get<string>("logging.format") === "json") {
      consoleFormat = winston.format.combine(
        winston.format.splat(),
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ level, message, timestamp }) => {
          return JSON.stringify({
            winston_timestamp: timestamp,
            winston_message: message,
            winston_level: level,
          });
        })
      );
    } else {
      consoleFormat = winston.format.combine(
        winston.format.splat(),
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp }) => {
          const padding = " ".repeat(Math.max(1, 18 - level.length));
          return `[${timestamp}] ${level}:${padding}${message}`;
        })
      );
    }

    this.logger = winston.createLogger({
      format: consoleFormat,
      transports: [
        new winston.transports.Console({
          level: config.get<string>("logging.level"),
        }),
      ],
      exitOnError: false,
      silent: false,
    });

    this.error = this.logger.error.bind(this.logger);
    this.warn = this.logger.warn.bind(this.logger);
    this.info = this.logger.info.bind(this.logger);
    this.verbose = this.logger.verbose.bind(this.logger);
    this.debug = this.logger.debug.bind(this.logger);
  }
}
