// API pública de la feature: el resto de la app importa solo desde aquí.
export { CHECKOUT_STEP, MAX_QUANTITY_PER_PURCHASE } from './checkout-step';
export type { CheckoutStep } from './checkout-step';
export {
  selectAddressDraft,
  selectCheckoutCard,
  selectCheckoutConfigErrorCode,
  selectCheckoutConfigStatus,
  selectCheckoutProduct,
  selectCheckoutQuantity,
  selectCheckoutStep,
  selectContactDraft,
  selectPaymentGatewaySettings,
} from './checkout.selectors';
export {
  addressChanged,
  checkoutClosed,
  checkoutReducer,
  checkoutStarted,
  contactChanged,
  paymentDetailsSubmitted,
  quantityChanged,
} from './checkout.slice';
export type { CheckoutState } from './checkout.slice';
export { fetchCheckoutConfig } from './checkout.thunks';
