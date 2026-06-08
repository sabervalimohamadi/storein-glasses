import { Injectable, Inject, Scope } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER }   from 'nest-winston';
import { Logger }                    from 'winston';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService {
  private context = 'App';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  setContext(context: string): this {
    this.context = context;
    return this;
  }

  log(message: string, meta?: Record<string, any>): void {
    this.logger.info(message, { context: this.context, ...meta });
  }

  info(message: string, meta?: Record<string, any>): void {
    this.logger.info(message, { context: this.context, ...meta });
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.logger.warn(message, { context: this.context, ...meta });
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, any>): void {
    this.logger.error(message, {
      context:      this.context,
      errorMessage: error instanceof Error ? error.message : String(error ?? ''),
      stack:        error instanceof Error ? error.stack   : undefined,
      ...meta,
    });
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.logger.debug(message, { context: this.context, ...meta });
  }
}
