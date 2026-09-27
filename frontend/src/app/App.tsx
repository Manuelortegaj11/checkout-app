import {
  CHECKOUT_STEP,
  PayWithCardButton,
  PaymentModal,
  ProcessingBackdrop,
  ResultBackdrop,
  selectCheckoutStep,
  SummaryBackdrop,
} from '@features/checkout';
import { ProductCatalog } from '@features/products';
import { useAppSelector } from '@store/hooks';
import { AppLayout } from './AppLayout';

/**
 * Raíz de la SPA: la pantalla visible sale solo del paso del checkout
 * guardado en el store, así un refresh vuelve exactamente al mismo punto.
 */
export function App() {
  const step = useAppSelector(selectCheckoutStep);

  return (
    <AppLayout>
      <ProductCatalog
        renderProductAction={(product) => (
          <PayWithCardButton product={product} />
        )}
      />
      {step === CHECKOUT_STEP.PAYMENT_FORM && <PaymentModal />}
      {step === CHECKOUT_STEP.SUMMARY && <SummaryBackdrop />}
      {step === CHECKOUT_STEP.PROCESSING && <ProcessingBackdrop />}
      {step === CHECKOUT_STEP.RESULT && <ResultBackdrop />}
    </AppLayout>
  );
}
