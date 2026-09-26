import { HttpStatus } from '@nestjs/common';
import type { GetProductUseCase } from '@application/use-cases/product/get-product.use-case';
import type { ListProductsUseCase } from '@application/use-cases/product/list-products.use-case';
import { productNotFound } from '@domain/errors/product.errors';
import { errAsync, okAsync } from '@shared/result';
import {
  aProductOutput,
  MISSING_PRODUCT_ID,
  PRODUCT_ID,
} from '@testing/fixtures/product.fixture';
import { mockUseCase } from '@testing/mocks/use-case.mock';
import { ProductController } from '@infrastructure/http/controllers/product.controller';

describe('ProductController', () => {
  const listProducts = mockUseCase<ListProductsUseCase>();
  const getProduct = mockUseCase<GetProductUseCase>();
  const controller = new ProductController(listProducts, getProduct);

  describe('list', () => {
    it('devuelve el inventario del caso de uso', async () => {
      const inventory = [aProductOutput(), aProductOutput({ stock: 0 })];
      listProducts.execute.mockReturnValue(okAsync(inventory));

      await expect(controller.list()).resolves.toEqual(inventory);
    });
  });

  describe('get', () => {
    it('pide el producto por el id de la ruta', async () => {
      getProduct.execute.mockReturnValue(okAsync(aProductOutput()));

      await expect(controller.get(PRODUCT_ID)).resolves.toEqual(
        aProductOutput(),
      );
      expect(getProduct.execute).toHaveBeenCalledWith({
        productId: PRODUCT_ID,
      });
    });

    it('sale del riel con 404 PRODUCT_NOT_FOUND si no existe', async () => {
      getProduct.execute.mockReturnValue(
        errAsync(productNotFound(MISSING_PRODUCT_ID)),
      );

      await expect(controller.get(MISSING_PRODUCT_ID)).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
        response: {
          code: 'PRODUCT_NOT_FOUND',
          message: `Product ${MISSING_PRODUCT_ID} not found`,
        },
      });
    });
  });
});
