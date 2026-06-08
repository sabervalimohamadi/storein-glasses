import { NestFactory }          from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe }        from '@nestjs/common';
import { ConfigService }         from '@nestjs/config';
import * as path                 from 'path';
import { AppModule }             from './app.module';
import { AllExceptionsFilter }   from './common/filters/http-exception.filter';
import { ResponseInterceptor }   from './common/interceptors/response.interceptor';
import { LoggingInterceptor }    from './common/interceptors/logging.interceptor';
import {
  WINSTON_MODULE_NEST_PROVIDER,
  WINSTON_MODULE_PROVIDER,
} from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Use Winston as NestJS built-in logger (replaces console.log in framework output)
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const configService = app.get(ConfigService);
  const port          = configService.get<number>('app.port') ?? 3000;
  const uploadDest    = configService.get<string>('upload.dest') ?? './uploads';

  app.useStaticAssets(path.resolve(uploadDest), { prefix: '/uploads' });
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:            true,
      forbidNonWhitelisted: true,
      transform:            true,
    }),
  );

  // Retrieve logger instance and wire into global filter + interceptors
  const winstonLogger = app.get(WINSTON_MODULE_PROVIDER) as any;
  app.useGlobalFilters(new AllExceptionsFilter(winstonLogger));
  app.useGlobalInterceptors(
    new LoggingInterceptor(winstonLogger),
    new ResponseInterceptor(),
  );

  app.enableCors();

  await app.listen(port);
  winstonLogger.info(`🚀 Storein API running on http://localhost:${port}/api/v1`, {
    context: 'Bootstrap',
  });
  winstonLogger.info(`📁 Uploads served at http://localhost:${port}/uploads`, {
    context: 'Bootstrap',
  });
}

bootstrap();
