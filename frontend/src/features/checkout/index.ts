// API pública de la feature: el resto de la app importa solo desde aquí.
export { PayWithCardButton } from './components/PayWithCardButton';
export { PaymentModal } from './components/PaymentModal';
export { CHECKOUT_STEP, MAX_QUANTITY_PER_PURCHASE } from './checkout-step';
export type { CheckoutStep } from './checkout-step';
export {
  selectAcceptanceContracts,
  selectAddressDraft,
  selectCheckoutCard,
  selectCheckoutConfigErrorCode,
  selectCheckoutConfigStatus,
  selectCheckoutProduct,
  selectCheckoutQuantity,
  selectCheckoutStep,
  selectCheckoutTransactionId,
  selectContactDraft,
  selectOrderAmounts,
  selectOrderErrorCode,
  selectOrderStatus,
  selectPaymentGatewaySettings,
} from './checkout.selectors';
export {
  addressChanged,
  checkoutClosed,
  checkoutFinished,
  checkoutReducer,
  checkoutStarted,
  contactChanged,
  PAYMENT_INTERRUPTED,
  paymentDetailsSubmitted,
  paymentFormReopened,
  paymentInterrupted,
  quantityChanged,
} from './checkout.slice';
export type { CheckoutState, OrderState } from './checkout.slice';
export { fetchCheckoutConfig, placeOrder } from './checkout.thunks';
export { finishCheckout } from './finish-checkout';
