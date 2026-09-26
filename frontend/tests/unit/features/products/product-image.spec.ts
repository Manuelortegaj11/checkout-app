import { productImageSources } from '@features/products/product-image';

describe('productImageSources', () => {
  it('ofrece la versión de 480 px y la de 960 px de una foto WebP', () => {
    expect(
      productImageSources('/images/products/wireless-headphones.webp'),
    ).toEqual({
      src: '/images/products/wireless-headphones.webp',
      srcSet:
        '/images/products/wireless-headphones-480.webp 480w, /images/products/wireless-headphones.webp 960w',
    });
  });

  it('una imagen que no es WebP se usa tal cual, sin variantes', () => {
    expect(productImageSources('/images/products/legacy.png')).toEqual({
      src: '/images/products/legacy.png',
    });
  });
});
