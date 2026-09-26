import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { validationExceptionFactory } from './errors/validation-exception.factory';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { setupSwagger } from './swagger';

export const API_PREFIX = 'api';

export interface HttpSettings {
  corsOrigin: string;
}

/**
 * Configuración HTTP común a la aplicación real y a los tests:
 * prefijo, cabeceras de seguridad, CORS, validación, formato de errores y Swagger.
 */
export const configureApp = (
  app: NestExpressApplication,
  settings: HttpSettings,
): void => {
  // Detrás de Nginx: el rate limiting usa la IP real del cliente.
  app.set('trust proxy', 'loopback');
  app.setGlobalPrefix(API_PREFIX);
  app.use(helmet());
  app.enableCors({ origin: settings.corsOrigin });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  setupSwagger(app);
  app.enableShutdownHooks();
};
