// Simple logger compatible with Vercel/serverless environments
// Replaces winston to avoid dependency issues

interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  service: string;
  [key: string]: any;
}

class SimpleLogger {
  private service: string;
  private logLevel: string;

  constructor(service: string = 'misiones-arrienda-backend') {
    this.service = service;
    this.logLevel = process.env.LOG_LEVEL || 'info';
  }

  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      level,
      message,
      timestamp,
      service: this.service,
      ...meta
    };

    // In development, use colored output
    if (process.env.NODE_ENV === 'development') {
      const colors = {
        error: '\x1b[31m', // red
        warn: '\x1b[33m',  // yellow
        info: '\x1b[36m',  // cyan
        debug: '\x1b[35m'  // magenta
      };
      const reset = '\x1b[0m';
      const color = colors[level as keyof typeof colors] || colors.info;

      return `${color}[${timestamp}] ${level.toUpperCase()}: ${message}${reset} ${JSON.stringify(meta || {})}`;
    }

    // In production, use JSON format for better parsing
    return JSON.stringify(logEntry);
  }

  error(message: string, meta?: any): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, meta));
    }
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }
}

// Create logger instance
const logger = new SimpleLogger();

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
