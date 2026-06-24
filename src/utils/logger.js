/**
 * Structured Logger — Winston
 * 
 * Provides structured, leveled logging for production debugging.
 * - Production: JSON format (machine-parseable for log aggregators)
 * - Development: Colorized, human-readable console output
 * - Test: Silent (no noise in test output)
 */

const winston = require('winston');

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom format for development — colorized and concise
const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

// JSON format for production — structured for log aggregators (Render, Datadog, etc.)
const prodFormat = combine(
  timestamp(),
  json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  defaultMeta: { service: 'codevector-api' },
  transports: [
    new winston.transports.Console({
      // Silence logs during tests to keep test output clean
      silent: process.env.NODE_ENV === 'test',
    }),
  ],
});

module.exports = logger;
