import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  createTransaction,
  isFinalStatus,
  pollTransaction,
} from '@features/transaction';
import { CLIENT_ERROR_CODE } from '@shared/api/api-error';
import type { CheckoutConfig } from '@shared/api/checkout.api';
import type { TokenizedCard } from '@shared/api/payment-gateway.api';
import type { AddressForm, ContactForm } from './checkout-form.validation';
import {
  CHECKOUT_STEP,
  MAX_QUANTITY_PER_PURCHASE,
  type CheckoutStep,
} from './checkout-step';
import { fetchCheckoutConfig, placeOrder } from './checkout.thunks';

/** El cobro no llegó a enviarse (por ejemplo, un refresh a mitad del pago). */
export const PAYMENT_INTERRUPTED = 'PAYMENT_INTERRUPTED';

export interface CheckoutConfigState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  data: CheckoutConfig | null;
  errorCode: string | null;
}

/**
 * Pago en curso: `placing` mientras se crea y se cobra la transacción,
 * `confirming` mientras se consulta un pago pendiente, `unconfirmed` si la
 * pasarela no decidió a tiempo y `failed` si el cobro no pudo enviarse.
 */
export interface OrderState {
  status: 'idle' | 'placing' | 'confirming' | 'unconfirmed' | 'failed';
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
  /** Transacción abierta en el backend: con ella se retoma el pago tras un refresh. */
  transactionId: string | null;
  config: CheckoutConfigState;
  order: OrderState;
}

const initialConfig: CheckoutConfigState = {
  status: 'idle',
  data: null,
  errorCode: null,
};

const idleOrder: OrderState = { status: 'idle', errorCode: null };

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
  transactionId: null,
  config: initialConfig,
  order: idleOrder,
};

const clampQuantity = (quantity: number): number =>
  Math.min(Math.max(1, Math.trunc(quantity)), MAX_QUANTITY_PER_PURCHASE);

/** Deja la compra lista para empezar de nuevo; los borradores se conservan. */
const discardPurchase = (state: CheckoutState) => {
  state.card = null;
  state.transactionId = null;
  state.order = idleOrder;
};

/**
 * El cobro no se hizo: vuelve al resumen con el motivo. Los tokens de
 * aceptación pudieron consumirse, así que se pide una configuración nueva.
 */
const backToSummary = (state: CheckoutState, errorCode: string) => {
  state.step = CHECKOUT_STEP.SUMMARY;
  state.order = { status: 'failed', errorCode };
  state.config = initialConfig;
};

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState: initialCheckoutState,
  reducers: {
    /** "Pagar con tarjeta de crédito": abre el formulario para ese producto. */
    checkoutStarted: (state, action: PayloadAction<{ productId: string }>) => {
      state.step = CHECKOUT_STEP.PAYMENT_FORM;
      state.productId = action.payload.productId;
      state.quantity = 1;
      discardPurchase(state);
    },
    /** Cancela la compra antes de pagar. Los borradores se conservan. */
    checkoutClosed: (state) => {
      state.step = CHECKOUT_STEP.PRODUCT;
      state.productId = null;
      discardPurchase(state);
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
      state.order = idleOrder;
    },
    /**
     * Vuelve al formulario para cambiar los datos o probar otra tarjeta. La
     * transacción anterior se descarta: la siguiente se abre con los datos nuevos.
     */
    paymentFormReopened: (state) => {
      state.step = CHECKOUT_STEP.PAYMENT_FORM;
      discardPurchase(state);
    },
    /** Tras un refresh en PROCESSING sin transacción: el cobro nunca se envió. */
    paymentInterrupted: (state) => {
      backToSummary(state, PAYMENT_INTERRUPTED);
    },
    /** El cliente vio el resultado y vuelve a la tienda. */
    checkoutFinished: (state) => {
      state.step = CHECKOUT_STEP.PRODUCT;
      state.productId = null;
      state.quantity = 1;
      discardPurchase(state);
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
      })
      .addCase(placeOrder.pending, (state) => {
        state.step = CHECKOUT_STEP.PROCESSING;
        state.order = { status: 'placing', errorCode: null };
      })
      // El id se guarda apenas existe: si hay un refresh durante el cobro, se retoma.
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.transactionId = action.payload.id;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.order = idleOrder;
        if (isFinalStatus(action.payload.status)) {
          state.step = CHECKOUT_STEP.RESULT;
        }
      })
      .addCase(placeOrder.rejected, (state, action) => {
        backToSummary(
          state,
          action.payload ?? CLIENT_ERROR_CODE.UNEXPECTED_ERROR,
        );
      })
      .addCase(pollTransaction.pending, (state) => {
        state.order = { status: 'confirming', errorCode: null };
      })
      .addCase(pollTransaction.fulfilled, (state, action) => {
        if (state.step !== CHECKOUT_STEP.PROCESSING) {
          return;
        }
        if (isFinalStatus(action.payload.status)) {
          state.step = CHECKOUT_STEP.RESULT;
          state.order = idleOrder;
        } else {
          backToSummary(state, PAYMENT_INTERRUPTED);
        }
      })
      .addCase(pollTransaction.rejected, (state, action) => {
        // Cancelada al desmontar la pantalla: otra consulta toma su lugar.
        if (action.meta.aborted) {
          return;
        }
        state.order = {
          status: 'unconfirmed',
          errorCode: action.payload ?? CLIENT_ERROR_CODE.UNEXPECTED_ERROR,
        };
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
  paymentFormReopened,
  paymentInterrupted,
  checkoutFinished,
} = checkoutSlice.actions;

export const checkoutReducer = checkoutSlice.reducer;
