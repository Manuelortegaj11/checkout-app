import { Body, Controller, Get, Post } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { Type } from 'class-transformer';
import { IsEmail, IsInt, Min, ValidateNested } from 'class-validator';
import request from 'supertest';
import { appError } from '@shared/errors/app-error';
import { errAsync } from '@shared/result';
import { configureApp } from './configure-app';
import { unwrapOrThrowHttp } from './errors/app-error.http-mapper';

class CustomerBody {
  @IsEmail()
  email!: string;
}

class OrderBody {
  @IsInt()
  @Min(1)
  quantity!: number;

  @ValidateNested()
  @Type(() => CustomerBody)
  customer!: CustomerBody;
}

@Controller('probe')
class ProbeController {
  @Post()
  create(@Body() body: OrderBody): OrderBody {
    return body;
  }

  @Get('conflict')
  conflict(): Promise<never> {
    return unwrapOrThrowHttp(
      errAsync(appError('CONFLICT', 'OUT_OF_STOCK', 'No units')),
    );
  }
}

describe('configureApp', () => {
  let app: NestExpressApplication;
  const corsOrigin = 'https://shop.example.com';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({
      logger: false,
    });
    configureApp(app, { corsOrigin });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  it('expone las rutas bajo el prefijo /api', async () => {
    await http()
      .post('/api/probe')
      .send({ quantity: 2, customer: { email: 'ana@example.com' } })
      .expect(201, { quantity: 2, customer: { email: 'ana@example.com' } });
  });

  it('añade las cabeceras de seguridad de helmet', async () => {
    const response = await http().get('/api/probe/conflict');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('permite CORS solo al origen configurado', async () => {
    const response = await http()
      .get('/api/probe/conflict')
      .set('Origin', corsOrigin);

    expect(response.headers['access-control-allow-origin']).toBe(corsOrigin);
  });

  it('responde los errores de validación con INVALID_REQUEST y los campos', async () => {
    const response = await http()
      .post('/api/probe')
      .send({ quantity: 0, customer: { email: 'not-an-email' } })
      .expect(400);

    expect(response.body).toEqual({
      code: 'INVALID_REQUEST',
      message: 'Request validation failed',
      details: [
        { field: 'quantity', message: 'quantity must not be less than 1' },
        { field: 'customer.email', message: 'email must be an email' },
      ],
    });
  });

  it('rechaza campos que no están en el DTO', async () => {
    const response = await http()
      .post('/api/probe')
      .send({
        quantity: 1,
        customer: { email: 'ana@example.com' },
        isAdmin: true,
      })
      .expect(400);

    expect(response.body).toMatchObject({
      details: [
        { field: 'isAdmin', message: 'property isAdmin should not exist' },
      ],
    });
  });

  it('traduce los AppError del riel a su código HTTP', async () => {
    await http()
      .get('/api/probe/conflict')
      .expect(409, { code: 'OUT_OF_STOCK', message: 'No units' });
  });

  it('responde NOT_FOUND en rutas inexistentes', async () => {
    const response = await http().get('/api/nope').expect(404);

    expect(response.body).toMatchObject({ code: 'NOT_FOUND' });
  });

  it('publica la especificación OpenAPI en /api/docs-json', async () => {
    const response = await http().get('/api/docs-json').expect(200);

    expect(response.body).toMatchObject({
      info: { title: 'Checkout API' },
      paths: { '/api/probe': expect.any(Object) as unknown },
    });
  });
});
