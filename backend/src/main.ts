import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import type { EnvironmentVariables } from './config/env.validation';
import { configureApp } from './infrastructure/http/configure-app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService<EnvironmentVariables, true>);

  configureApp(app, { corsOrigin: config.get('CORS_ORIGIN', { infer: true }) });

  await app.listen(config.get('PORT', { infer: true }));
}

void bootstrap();
