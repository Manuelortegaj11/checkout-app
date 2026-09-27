import { RotateCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  pollTransaction,
  selectCurrentTransaction,
} from '@features/transaction';
import { Backdrop } from '@shared/ui/Backdrop';
import { Button } from '@shared/ui/Button';
import { Notice } from '@shared/ui/Notice';
import { Spinner } from '@shared/ui/Spinner';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  selectCheckoutTransactionId,
  selectOrderStatus,
} from '../checkout.selectors';
import { paymentInterrupted } from '../checkout.slice';
import { PaymentProgress } from './PaymentProgress';

/**
 * Pantalla 4: el pago en curso. No se puede cerrar: un cobro enviado no se
 * abandona. Mientras el pago se envía no hace nada más; después consulta su
 * estado hasta tener un resultado. Tras un refresh retoma la consulta con el
 * id guardado, sin volver a cobrar; si la transacción ni siquiera se creó,
 * vuelve al resumen.
 */
export function ProcessingBackdrop() {
  const dispatch = useAppDispatch();
  const transactionId = useAppSelector(selectCheckoutTransactionId);
  const transaction = useAppSelector(selectCurrentTransaction);
  const orderStatus = useAppSelector(selectOrderStatus);
  const [attempt, setAttempt] = useState(0);
  const placing = orderStatus === 'placing';

  useEffect(() => {
    if (placing) {
      return;
    }
    if (transactionId === null) {
      dispatch(paymentInterrupted());
      return;
    }
    const polling = dispatch(pollTransaction(transactionId));
    return () => polling.abort();
  }, [attempt, dispatch, placing, transactionId]);

  const current = transaction?.id === transactionId ? transaction : null;
  const unconfirmed = orderStatus === 'unconfirmed';

  return (
    <Backdrop
      title="Procesando tu pago"
      description="Esto toma unos segundos. Si recargas la página, retomamos el pago donde iba: nunca se cobra dos veces."
    >
      <div className="flex flex-col gap-6">
        {unconfirmed ? (
          <Notice
            tone="warning"
            title="Tu pago sigue en proceso"
            action={
              <Button
                variant="secondary"
                onClick={() => setAttempt((value) => value + 1)}
              >
                <RotateCw aria-hidden="true" className="size-4" />
                Consultar de nuevo
              </Button>
            }
          >
            La pasarela aún no confirma el resultado. No pagues otra vez:
            consulta de nuevo en unos minutos.
          </Notice>
        ) : (
          <Spinner label="Procesando tu pago" />
        )}
        <PaymentProgress
          registered={transactionId !== null}
          submitted={current?.paymentSubmitted ?? false}
        />
        {current && (
          <p className="text-center text-xs text-ink-subtle">
            Referencia{' '}
            <span className="font-medium break-all text-ink-muted">
              {current.reference}
            </span>
          </p>
        )}
      </div>
    </Backdrop>
  );
}
