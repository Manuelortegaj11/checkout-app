import { Logger } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { ProductOutput } from '@application/dtos/product/product.output';
import { GetProductUseCase } from '@application/use-cases/product/get-product.use-case';
import { ListProductsUseCase } from '@application/use-cases/product/list-products.use-case';
import { productNotFound } from '@domain/errors/product.errors';
import { databaseError } from '@infrastructure/persistence/database.errors';
import { errAsync, okAsync } from '@shared/result';
import {
  MISSING_PRODUCT_ID,
  PRODUCT_ID,
} from '@testing/fixtures/product.fixture';
import { configureApp } from '../configure-app';
import { ProductController } from './product.controller';

const productOutput: ProductOutput = {
  id: PRODUCT_ID,
  name: 'Audífonos inalámbricos',
  description: 'Cancelación activa de ruido y 30 horas de batería.',
  priceInCents: 18_990_000,
  currency: 'COP',
  stock: 12,
  imageUrl: '/images/products/wireless-headphones.webp',
};

describe('ProductController', () => {
  let app: NestExpressApplication;
  const listProducts = { execute: jest.fn() };
  const getProduct = { execute: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        { provide: ListProductsUseCase, useValue: listProducts },
        { provide: GetProductUseCase, useValue: getProduct },
      ],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({
      logger: false,
    });
    configureApp(app, { corsOrigin: 'http://localhost:3000' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  describe('GET /api/products', () => {
    it('responde 200 con el inventario', async () => {
      listProducts.execute.mockReturnValue(okAsync([productOutput]));

      await http().get('/api/products').expect(200, [productOutput]);
    });

    it('responde 500 DB_QUERY_FAILED sin exponer la causa', async () => {
      jest.spyOn(Logger.prototype, 'error').mockImplementation();
      listProducts.execute.mockReturnValue(
        errAsync(databaseError(new Error('password authentication failed'))),
      );

      await http().get('/api/products').expect(500, {
        code: 'DB_QUERY_FAILED',
        message: 'Database query failed',
      });
    });
  });

  describe('GET /api/products/:id', () => {
    it('responde 200 con el producto', async () => {
      getProduct.execute.mockReturnValue(okAsync(productOutput));

      await http()
        .get(`/api/products/${PRODUCT_ID}`)
        .expect(200, productOutput);
      expect(getProduct.execute).toHaveBeenCalledWith({
        productId: PRODUCT_ID,
      });
    });

    it('responde 404 PRODUCT_NOT_FOUND si no existe', async () => {
      getProduct.execute.mockReturnValue(
        errAsync(productNotFound(MISSING_PRODUCT_ID)),
      );

      await http()
        .get(`/api/products/${MISSING_PRODUCT_ID}`)
        .expect(404, {
          code: 'PRODUCT_NOT_FOUND',
          message: `Product ${MISSING_PRODUCT_ID} not found`,
        });
    });

    it('responde 400 INVALID_REQUEST si el id no es un UUID, sin llegar al caso de uso', async () => {
      await http()
        .get('/api/products/not-a-uuid')
        .expect(400, {
          code: 'INVALID_REQUEST',
          message: 'Request validation failed',
          details: [{ field: 'id', message: 'id must be a UUID' }],
        });
      expect(getProduct.execute).not.toHaveBeenCalled();
    });
  });
});
