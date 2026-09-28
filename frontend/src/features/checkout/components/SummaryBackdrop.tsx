import { Lock, RotateCw, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatCurrency } from '@shared/lib/format/currency';
import { Backdrop } from '@shared/ui/Backdrop';
import { Button } from '@shared/ui/Button';
import { Notice } from '@shared/ui/Notice';
import { PriceSummary } from '@shared/ui/PriceSummary';
import { Skeleton } from '@shared/ui/Skeleton';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  selectAcceptanceContracts,
  selectAddressDraft,
  selectCheckoutCard,
  selectCheckoutConfigErrorCode,
  selectCheckoutConfigStatus,
  selectCheckoutProduct,
  selectCheckoutQuantity,
  selectContactDraft,
  selectOrderAmounts,
  selectOrderErrorCode,
  selectOrderStatus,
} from '../checkout.selectors';
import { checkoutClosed, paymentFormReopened } from '../checkout.slice';
import { fetchCheckoutConfig, placeOrder } from '../checkout.thunks';
import { finishCheckout } from '../finish-checkout';
import {
  isUnrecoverableOrderError,
  orderErrorMessage,
} from '../order-error-message';
import { configErrorMessage } from '../payment-error-message';
import { AcceptanceChecks, type Acceptance } from './AcceptanceChecks';
import { OrderOverview } from './OrderOverview';

const NOT_ACCEPTED: Acceptance = {
  endUserPolicy: false,
  personalDataAuth: false,
};

export function SummaryBackdrop() {
  const dispatch = useAppDispatch();
  const product = useAppSelector(selectCheckoutProduct);
  const quantity = useAppSelector(selectCheckoutQuantity);
  const card = useAppSelector(selectCheckoutCard);
  const contact = useAppSelector(selectContactDraft);
  const address = useAppSelector(selectAddressDraft);
  const amounts = useAppSelector(selectOrderAmounts);
  const contracts = useAppSelector(selectAcceptanceContracts);
  const configStatus = useAppSelector(selectCheckoutConfigStatus);
  const configErrorCode = useAppSelector(selectCheckoutConfigErrorCode);
  const orderStatus = useAppSelector(selectOrderStatus);
  const orderErrorCode = useAppSelector(selectOrderErrorCode);
  const [accepted, setAccepted] = useState(NOT_ACCEPTED);

  useEffect(() => {
    if (configStatus === 'idle') {
      void dispatch(fetchCheckoutConfig());
    }
  }, [configStatus, dispatch]);

  const canPay =
    product !== null &&
    card !== null &&
    amounts !== null &&
    contracts !== null &&
    accepted.endUserPolicy &&
    accepted.personalDataAuth;

  return (
    <Backdrop
      title="Resumen del pago"
      description="Revisa tu pedido antes de pagar."
      onBack={() => dispatch(paymentFormReopened())}
      onClose={() => dispatch(checkoutClosed())}
      footer={
        <div className="flex flex-col gap-3">
          <Button
            className="w-full"
            disabled={!canPay}
            onClick={() => void dispatch(placeOrder())}
          >
            <Lock aria-hidden="true" className="size-4" />
            {product && amounts
              ? `Pagar ${formatCurrency(amounts.totalInCents, product.currency)}`
              : 'Pagar'}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => dispatch(paymentFormReopened())}
          >
            Editar mis datos
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {orderStatus === 'failed' && (
          <Notice
            tone="danger"
            title="No pudimos completar el pago"
            action={
              isUnrecoverableOrderError(orderErrorCode) && (
                <Button
                  variant="secondary"
                  onClick={() => dispatch(finishCheckout())}
                >
                  <Store aria-hidden="true" className="size-4" />
                  Volver a la tienda
                </Button>
              )
            }
          >
            {orderErrorMessage(orderErrorCode)}
          </Notice>
        )}

        {product && card ? (
          <OrderOverview
            product={product}
            quantity={quantity}
            card={card}
            recipientName={contact.fullName}
            address={address}
          />
        ) : (
          <Skeleton className="h-44 w-full" />
        )}

        {product && amounts ? (
          <PriceSummary
            currency={product.currency}
            lines={[
              {
                label: 'Producto',
                hint: `${quantity} × ${formatCurrency(product.priceInCents, product.currency)}`,
                amountInCents: amounts.productAmountInCents,
              },
              { label: 'Tarifa base', amountInCents: amounts.baseFeeInCents },
              { label: 'Envío', amountInCents: amounts.deliveryFeeInCents },
            ]}
            totalLabel="Total a pagar"
            totalInCents={amounts.totalInCents}
          />
        ) : configStatus === 'failed' ? (
          <Notice
            tone="danger"
            title="No pudimos preparar el pago"
            action={
              <Button
                variant="secondary"
                onClick={() => void dispatch(fetchCheckoutConfig())}
              >
                <RotateCw aria-hidden="true" className="size-4" />
                Reintentar
              </Button>
            }
          >
            {configErrorMessage(configErrorCode)}
          </Notice>
        ) : (
          <Skeleton className="h-32 w-full" />
        )}

        {contracts && (
          <AcceptanceChecks
            contracts={contracts}
            accepted={accepted}
            onChange={setAccepted}
          />
        )}
      </div>
    </Backdrop>
  );
}
