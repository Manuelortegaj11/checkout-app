import { ApiError, CLIENT_ERROR_CODE } from './api-error';
import { requestJson } from './http-client';

export interface PaymentGatewaySettings {
  baseUrl: string;
  publicKey: string;
}

export interface CardDetails {
  number: string;
  cvc: string;

  expMonth: string;

  expYear: string;
  holder: string;
}

export interface TokenizedCard {
  token: string;
  brand: string;
  last4: string;
}

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
