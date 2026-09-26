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

/**
 * Tokeniza la tarjeta en la pasarela sin pasar por Redux. createAsyncThunk
 * guarda su argumento en `meta.arg` de cada acción, así que el número y el CVC
 * quedarían en el historial de Redux DevTools; aquí solo existen en el
 * formulario y en la petición a la pasarela. Al store llega el resultado:
 * token, marca y últimos 4 dígitos.
 */
export function useCardTokenization() {
  const settings = useAppSelector(selectPaymentGatewaySettings);
  const [status, setStatus] = useState<TokenizationStatus>('idle');
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const fail = (code: string): null => {
    setErrorCode(code);
    setStatus('failed');
    return null;
  };

  /** Devuelve la tarjeta tokenizada, o `null` si falló (el motivo queda en `errorCode`). */
  const tokenize = async (card: CardForm): Promise<TokenizedCard | null> => {
    if (settings === null) {
      return fail(CLIENT_ERROR_CODE.UNEXPECTED_ERROR);
    }

    setStatus('tokenizing');
    setErrorCode(null);
    // El formulario ya validó el formato MM/AA.
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
