export const productImageSources = (
  imageUrl: string,
): { src: string; srcSet?: string } => {
  if (!imageUrl.endsWith('.webp')) {
    return { src: imageUrl };
  }

  const small = imageUrl.replace(/\.webp$/, '-480.webp');
  return { src: imageUrl, srcSet: `${small} 480w, ${imageUrl} 960w` };
};

export const PRODUCT_IMAGE_SIZES =
  '(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw';
