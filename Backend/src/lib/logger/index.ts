import winston from 'winston';
import path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} ${level}: ${message} ${metaStr}`;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'misiones-arrienda-backend' },
  transports: [
    // Console logging with colors
    new winston.transports.Console({
      format: consoleFormat
    }),

    // Error log file
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: logFormat
    }),

    // Combined log file
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: logFormat
    })
  ],

  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
      format: logFormat
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log'),
      format: logFormat
    })
  ]
});

// Create logs directory if it doesn't exist
import fs from 'fs';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export default logger;

// Helper functions for different log levels
export const logRequest = (req: any, message: string = 'Request received') => {
  logger.info(message, {
    method: req.method,
    url: req.url,
    userAgent: req.headers?.['user-agent'],
    ip: req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || req.ip
  });
};

export const logError = (error: Error, context?: any) => {
  logger.error(error.message, {
    stack: error.stack,
    ...context
  });
};

export const logDatabase = (operation: string, table: string, duration?: number) => {
  logger.info('Database operation', {
    operation,
    table,
    duration: duration ? `${duration}ms` : undefined
  });
};
