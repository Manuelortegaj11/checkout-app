import { CreditCard } from 'lucide-react';
import type { Product } from '@shared/api/products.api';
import { Button } from '@shared/ui/Button';
import { useAppDispatch } from '@store/hooks';
import { checkoutStarted } from '../checkout.slice';

export interface PayWithCardButtonProps {
  product: Product;
}

/** Botón del enunciado: abre el formulario de pago para el producto. */
export function PayWithCardButton({ product }: PayWithCardButtonProps) {
  const dispatch = useAppDispatch();
  const soldOut = product.stock <= 0;

  return (
    <Button
      className="w-full"
      disabled={soldOut}
      onClick={() => dispatch(checkoutStarted({ productId: product.id }))}
    >
      <CreditCard aria-hidden="true" className="size-4" />
      {soldOut ? 'Agotado' : 'Pagar con tarjeta de crédito'}
    </Button>
  );
}
