/**
 * Cada foto de producto se publica en dos anchos: `<nombre>.webp` (960 px, la
 * ruta que guarda el backend) y `<nombre>-480.webp`. El navegador elige la que
 * necesita según el ancho en pantalla y la densidad de píxeles.
 */
export const productImageSources = (
  imageUrl: string,
): { src: string; srcSet?: string } => {
  if (!imageUrl.endsWith('.webp')) {
    return { src: imageUrl };
  }

  const small = imageUrl.replace(/\.webp$/, '-480.webp');
  return { src: imageUrl, srcSet: `${small} 480w, ${imageUrl} 960w` };
};

/** Ancho que ocupa la foto: una columna en móvil, dos desde `sm` y tres desde `lg`. */
export const PRODUCT_IMAGE_SIZES =
  '(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw';
