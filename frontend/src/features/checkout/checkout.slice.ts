import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { CLIENT_ERROR_CODE } from '@shared/api/api-error';
import type { CheckoutConfig } from '@shared/api/checkout.api';
import type { TokenizedCard } from '@shared/api/payment-gateway.api';
import type { AddressForm, ContactForm } from './checkout-form.validation';
import {
  CHECKOUT_STEP,
  MAX_QUANTITY_PER_PURCHASE,
  type CheckoutStep,
} from './checkout-step';
import { fetchCheckoutConfig } from './checkout.thunks';

export interface CheckoutConfigState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  data: CheckoutConfig | null;
  errorCode: string | null;
}

export interface CheckoutState {
  step: CheckoutStep;
  productId: string | null;
  quantity: number;
  /** Borradores del formulario: sobreviven a un refresh y a una compra siguiente. */
  contact: ContactForm;
  address: AddressForm;
  /** Resultado de tokenizar la tarjeta. El número y el CVC nunca llegan al store. */
  card: TokenizedCard | null;
  config: CheckoutConfigState;
}

export const initialCheckoutState: CheckoutState = {
  step: CHECKOUT_STEP.PRODUCT,
  productId: null,
  quantity: 1,
  contact: { fullName: '', email: '', phone: '' },
  address: {
    addressLine1: '',
    addressLine2: '',
    city: '',
    region: '',
    postalCode: '',
  },
  card: null,
  config: { status: 'idle', data: null, errorCode: null },
};

const clampQuantity = (quantity: number): number =>
  Math.min(Math.max(1, Math.trunc(quantity)), MAX_QUANTITY_PER_PURCHASE);

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState: initialCheckoutState,
  reducers: {
    /** "Pagar con tarjeta de crédito": abre el formulario para ese producto. */
    checkoutStarted: (state, action: PayloadAction<{ productId: string }>) => {
      state.step = CHECKOUT_STEP.PAYMENT_FORM;
      state.productId = action.payload.productId;
      state.quantity = 1;
      state.card = null;
    },
    /** Cierra el formulario sin comprar. Los borradores se conservan. */
    checkoutClosed: (state) => {
      state.step = CHECKOUT_STEP.PRODUCT;
      state.productId = null;
      state.card = null;
    },
    quantityChanged: (state, action: PayloadAction<number>) => {
      state.quantity = clampQuantity(action.payload);
    },
    contactChanged: (state, action: PayloadAction<Partial<ContactForm>>) => {
      state.contact = { ...state.contact, ...action.payload };
    },
    addressChanged: (state, action: PayloadAction<Partial<AddressForm>>) => {
      state.address = { ...state.address, ...action.payload };
    },
    /** Tarjeta tokenizada y datos válidos: sigue el resumen del pago. */
    paymentDetailsSubmitted: (state, action: PayloadAction<TokenizedCard>) => {
      state.card = action.payload;
      state.step = CHECKOUT_STEP.SUMMARY;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCheckoutConfig.pending, (state) => {
        state.config.status = 'loading';
        state.config.errorCode = null;
      })
      .addCase(fetchCheckoutConfig.fulfilled, (state, action) => {
        state.config = {
          status: 'succeeded',
          data: action.payload,
          errorCode: null,
        };
      })
      .addCase(fetchCheckoutConfig.rejected, (state, action) => {
        state.config.status = 'failed';
        state.config.errorCode =
          action.payload ?? CLIENT_ERROR_CODE.UNEXPECTED_ERROR;
      });
  },
});

export const {
  checkoutStarted,
  checkoutClosed,
  quantityChanged,
  contactChanged,
  addressChanged,
  paymentDetailsSubmitted,
} = checkoutSlice.actions;

export const checkoutReducer = checkoutSlice.reducer;
