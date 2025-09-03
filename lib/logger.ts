// Simple logger implementation to avoid worker thread issues
const isDevelopment = process.env.NODE_ENV !== 'production';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerInterface {
  debug: (message: any, ...args: any[]) => void;
  info: (message: any, ...args: any[]) => void;
  warn: (message: any, ...args: any[]) => void;
  error: (message: any, ...args: any[]) => void;
  child: (bindings: Record<string, any>) => LoggerInterface;
}

class SimpleLogger implements LoggerInterface {
  private bindings: Record<string, any>;

  constructor(bindings: Record<string, any> = {}) {
    this.bindings = bindings;
  }

  private log(level: LogLevel, message: any, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (typeof message === 'object') {
      // console.log(prefix, { ...this.bindings, ...message }, ...args);
    } else {
      // console.log(prefix, this.bindings, message, ...args);
    }
  }

  debug(message: any, ...args: any[]) {
    if (isDevelopment) {
      this.log('debug', message, ...args);
    }
  }

  info(message: any, ...args: any[]) {
    this.log('info', message, ...args);
  }

  warn(message: any, ...args: any[]) {
    this.log('warn', message, ...args);
  }

  error(message: any, ...args: any[]) {
    this.log('error', message, ...args);
  }

  child(bindings: Record<string, any>): LoggerInterface {
    return new SimpleLogger({ ...this.bindings, ...bindings });
  }
}

export const logger = new SimpleLogger();

export function createChildLogger(bindings: Record<string, any>) {
  return logger.child(bindings);
}
