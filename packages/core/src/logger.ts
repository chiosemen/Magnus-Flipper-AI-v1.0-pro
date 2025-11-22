import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

export const createLogger = (service: string) => {
  return winston.createLogger({
    level: logLevel,
    defaultMeta: { service },
    format: logFormat,
    transports: [
      new winston.transports.Console({
        format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat
      })
    ]
  });
};

// Default logger instances for different services
export const apiLogger = createLogger('api');
export const schedulerLogger = createLogger('scheduler');
export const crawlerLogger = createLogger('worker-crawler');
export const analyzerLogger = createLogger('worker-analyzer');
export const alertsLogger = createLogger('worker-alerts');
export const botLogger = createLogger('bot-telegram');
