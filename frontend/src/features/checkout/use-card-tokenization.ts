import { useState } from 'react';
import { CLIENT_ERROR_CODE, errorCodeOf } from '@shared/api/api-error';
import {
  paymentGatewayApi,
  type TokenizedCard,
} from '@shared/api/payment-gateway.api';
import { digitsOnly } from '@shared/lib/card/card-number';
import { useAppSelector } from '@store/hooks';
import type { CardForm } from './checkout-form.validation';
import { selectPaymentGatewaySettings } from './checkout.selectors';

export type TokenizationStatus = 'idle' | 'tokenizing' | 'failed';

export function useCardTokenization() {
  const settings = useAppSelector(selectPaymentGatewaySettings);
  const [status, setStatus] = useState<TokenizationStatus>('idle');
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const fail = (code: string): null => {
    setErrorCode(code);
    setStatus('failed');
    return null;
  };

  const tokenize = async (card: CardForm): Promise<TokenizedCard | null> => {
    if (settings === null) {
      return fail(CLIENT_ERROR_CODE.UNEXPECTED_ERROR);
    }

    setStatus('tokenizing');
    setErrorCode(null);
    const [expMonth, expYear] = card.expiry.split('/');

    try {
      const tokenized = await paymentGatewayApi.tokenizeCard(
        {
          number: digitsOnly(card.number),
          cvc: card.cvc,
          expMonth,
          expYear,
          holder: card.holder.trim(),
        },
        settings,
      );
      setStatus('idle');
      return tokenized;
    } catch (error) {
      return fail(errorCodeOf(error));
    }
  };

  return { tokenize, status, errorCode };
}
