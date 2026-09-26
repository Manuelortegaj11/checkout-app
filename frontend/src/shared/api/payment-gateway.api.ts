import { ApiError, CLIENT_ERROR_CODE } from './api-error';
import { requestJson } from './http-client';

/** Datos públicos de la pasarela; los entrega el backend en la configuración del checkout. */
export interface PaymentGatewaySettings {
  baseUrl: string;
  publicKey: string;
}

/** Tarjeta tal como la escribió el cliente. Solo viaja a la pasarela, nunca al backend. */
export interface CardDetails {
  /** Solo dígitos. */
  number: string;
  cvc: string;
  /** Dos dígitos: `09`. */
  expMonth: string;
  /** Dos dígitos: `29`. */
  expYear: string;
  holder: string;
}

/** Lo único que la app guarda de la tarjeta. */
export interface TokenizedCard {
  token: string;
  brand: string;
  last4: string;
}

/** La pasarela respondió 422: no acepta los datos de la tarjeta. */
export const CARD_REJECTED = 'CARD_REJECTED';

interface GatewayTokenResponse {
  data?: { id?: unknown; brand?: unknown; last_four?: unknown };
}

const isTokenResponse = (
  body: GatewayTokenResponse,
): body is { data: { id: string; brand: string; last_four: string } } =>
  typeof body.data?.id === 'string' &&
  typeof body.data.brand === 'string' &&
  typeof body.data.last_four === 'string';

export const paymentGatewayApi = {
  /**
   * Tokeniza la tarjeta directamente en la pasarela con la llave pública.
   * Devuelve el token de un solo uso con la marca y los últimos 4 dígitos.
   */
  tokenizeCard: async (
    card: CardDetails,
    { baseUrl, publicKey }: PaymentGatewaySettings,
  ): Promise<TokenizedCard> => {
    let body: GatewayTokenResponse;
    try {
      body = await requestJson<GatewayTokenResponse>(
        `${baseUrl}/tokens/cards`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${publicKey}` },
          body: {
            number: card.number,
            cvc: card.cvc,
            exp_month: card.expMonth,
            exp_year: card.expYear,
            card_holder: card.holder,
          },
        },
      );
    } catch (error) {
      throw error instanceof ApiError && error.status === 422
        ? new ApiError(CARD_REJECTED, 422, 'The gateway rejected the card')
        : error;
    }

    if (!isTokenResponse(body)) {
      throw new ApiError(
        CLIENT_ERROR_CODE.UNEXPECTED_ERROR,
        null,
        'The gateway answered without a card token',
      );
    }

    return {
      token: body.data.id,
      brand: body.data.brand,
      last4: body.data.last_four,
    };
  },
};
