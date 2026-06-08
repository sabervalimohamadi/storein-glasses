import { Module, Global } from '@nestjs/common';
import { WinstonModule }  from 'nest-winston';
import { ConfigService }  from '@nestjs/config';
import * as winston       from 'winston';
import 'winston-daily-rotate-file';
import { AppLoggerService } from './app-logger.service';

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const isProduction = config.get('app.nodeEnv') === 'production';
        const isDev        = !isProduction;

        const logFormat = winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        );

        const consoleFormat = winston.format.combine(
          winston.format.timestamp({ format: 'HH:mm:ss' }),
          winston.format.errors({ stack: true }),
          winston.format.colorize({ all: true }),
          winston.format.printf(({ timestamp, level, message, context, requestId, ...meta }) => {
            const ctx   = context   ? `[${context}]`             : '';
            const rid   = requestId ? `(${String(requestId).slice(0, 8)})` : '';
            const extra = Object.keys(meta).length
              ? '\n' + JSON.stringify(meta, null, 2)
              : '';
            return `${timestamp} ${level} ${ctx}${rid} ${message}${extra}`;
          }),
        );

        const transports: winston.transport[] = [];

        transports.push(
          new winston.transports.Console({
            level:  isDev ? 'debug' : 'info',
            format: consoleFormat,
          }),
        );

        transports.push(
          new (winston.transports as any).DailyRotateFile({
            filename:      'logs/error-%DATE%.log',
            datePattern:   'YYYY-MM-DD',
            level:         'error',
            format:        logFormat,
            maxSize:       '20m',
            maxFiles:      '30d',
            zippedArchive: true,
          }),
        );

        transports.push(
          new (winston.transports as any).DailyRotateFile({
            filename:      'logs/combined-%DATE%.log',
            datePattern:   'YYYY-MM-DD',
            level:         isDev ? 'debug' : 'info',
            format:        logFormat,
            maxSize:       '50m',
            maxFiles:      '14d',
            zippedArchive: true,
          }),
        );

        return { transports };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AppLoggerService],
  exports:   [WinstonModule, AppLoggerService],
})
export class LoggerModule {}
