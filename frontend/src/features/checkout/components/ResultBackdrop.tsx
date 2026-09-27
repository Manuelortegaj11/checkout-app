import { CreditCard, RotateCw, Store } from 'lucide-react';
import { useEffect } from 'react';
import {
  fetchTransaction,
  selectCurrentTransaction,
  selectTransactionRequestStatus,
  TransactionResult,
} from '@features/transaction';
import { Backdrop } from '@shared/ui/Backdrop';
import { Button } from '@shared/ui/Button';
import { Notice } from '@shared/ui/Notice';
import { Skeleton } from '@shared/ui/Skeleton';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { CHECKOUT_STEP } from '../checkout-step';
import {
  selectCheckoutCard,
  selectCheckoutStep,
  selectCheckoutTransactionId,
} from '../checkout.selectors';
import { paymentFormReopened } from '../checkout.slice';
import { finishCheckout } from '../finish-checkout';

/**
 * Pantalla 5: resultado detallado del pago. "Volver a la tienda" regresa al
 * catálogo con el inventario actualizado; si el pago no se aprobó, también
 * se puede intentar de nuevo con otra tarjeta. Tras un refresh, la
 * transacción se vuelve a pedir al backend con el id guardado.
 */
export function ResultBackdrop() {
  const dispatch = useAppDispatch();
  const step = useAppSelector(selectCheckoutStep);
  const transactionId = useAppSelector(selectCheckoutTransactionId);
  const transaction = useAppSelector(selectCurrentTransaction);
  const requestStatus = useAppSelector(selectTransactionRequestStatus);
  const card = useAppSelector(selectCheckoutCard);

  const current = transaction?.id === transactionId ? transaction : null;
  const missing = current === null;

  useEffect(() => {
    // Solo mientras esta es la pantalla activa: al salir de ella el id se descarta.
    if (step !== CHECKOUT_STEP.RESULT) {
      return;
    }
    if (transactionId === null) {
      dispatch(finishCheckout());
      return;
    }
    if (missing) {
      void dispatch(fetchTransaction(transactionId));
    }
  }, [dispatch, missing, step, transactionId]);

  const backToStore = () => dispatch(finishCheckout());

  return (
    <Backdrop
      title="Resultado del pago"
      onClose={backToStore}
      footer={
        <div className="flex flex-col gap-3">
          <Button className="w-full" onClick={backToStore}>
            <Store aria-hidden="true" className="size-4" />
            Volver a la tienda
          </Button>
          {current && current.status !== 'APPROVED' && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => dispatch(paymentFormReopened())}
            >
              <CreditCard aria-hidden="true" className="size-4" />
              Intentar de nuevo
            </Button>
          )}
        </div>
      }
    >
      {current ? (
        <TransactionResult transaction={current} card={card} />
      ) : requestStatus === 'failed' && transactionId !== null ? (
        <Notice
          tone="danger"
          title="No pudimos cargar el resultado"
          action={
            <Button
              variant="secondary"
              onClick={() => void dispatch(fetchTransaction(transactionId))}
            >
              <RotateCw aria-hidden="true" className="size-4" />
              Reintentar
            </Button>
          }
        >
          Revisa tu conexión e inténtalo de nuevo. El pago ya terminó: consultar
          no lo repite.
        </Notice>
      ) : (
        <div className="flex flex-col gap-4" aria-hidden="true">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}
    </Backdrop>
  );
}
