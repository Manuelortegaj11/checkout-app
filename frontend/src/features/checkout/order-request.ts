import type { CheckoutConfig } from '@shared/api/checkout.api';
import type { TokenizedCard } from '@shared/api/payment-gateway.api';
import type {
  CreateTransactionRequest,
  SubmitPaymentRequest,
} from '@shared/api/transactions.api';
import type { AddressForm, ContactForm } from './checkout-form.validation';

export const INSTALLMENTS = 1;

export interface OrderDraft {
  productId: string;
  quantity: number;
  contact: ContactForm;
  address: AddressForm;
}

const optional = (value: string): string | undefined =>
  value.trim() === '' ? undefined : value.trim();

export const toCreateTransactionRequest = ({
  productId,
  quantity,
  contact,
  address,
}: OrderDraft): CreateTransactionRequest => {
  const fullName = contact.fullName.trim();
  const phone = contact.phone.replace(/\s/g, '');

  return {
    productId,
    quantity,
    customer: { fullName, email: contact.email.trim(), phone },
    delivery: {
      recipientName: fullName,
      phone,
      addressLine1: address.addressLine1.trim(),
      addressLine2: optional(address.addressLine2),
      city: address.city.trim(),
      region: address.region.trim(),
      postalCode: optional(address.postalCode),
    },
  };
};

export const toSubmitPaymentRequest = (
  card: TokenizedCard,
  acceptance: CheckoutConfig['acceptance'],
): SubmitPaymentRequest => ({
  cardToken: card.token,
  installments: INSTALLMENTS,
  acceptanceToken: acceptance.endUserPolicy.token,
  personalDataAuthToken: acceptance.personalDataAuth.token,
});
