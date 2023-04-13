import config from "config";
import type { Logger as WinstonLogger } from "winston";
import * as winston from "winston";

const LOG_FORMAT = config.get<string>("logging.format");
const LOG_LEVEL = config.get<string>("logging.level");

export class Logger {
  private readonly logger: WinstonLogger;

  public readonly error: winston.LeveledLogMethod;
  public readonly warn: winston.LeveledLogMethod;
  public readonly info: winston.LeveledLogMethod;
  public readonly verbose: winston.LeveledLogMethod;
  public readonly debug: winston.LeveledLogMethod;

  constructor(context: string) {
    const consoleFormat =
      LOG_FORMAT === "json" ? this.getJsonFormat(context) : this.getDefaultFormat(context);

    this.logger = winston.createLogger({
      format: consoleFormat,
      transports: [
        new winston.transports.Console({
          level: LOG_LEVEL,
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

  private getJsonFormat(context: string): winston.Logform.Format {
    return winston.format.combine(
      winston.format.splat(),
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ level, message, timestamp }) => {
        return JSON.stringify({
          winston_timestamp: timestamp,
          winston_message: `[${context}] ${message}`,
          winston_level: level,
        });
      })
    );
  }

  private getDefaultFormat(context: string): winston.Logform.Format {
    return winston.format.combine(
      winston.format.splat(),
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.colorize(),
      winston.format.printf(({ level, message, timestamp }) => {
        const padding = " ".repeat(Math.max(1, 18 - level.length));
        return `[${timestamp}] ${level}:${padding}[${context}] ${message}`;
      })
    );
  }
}
