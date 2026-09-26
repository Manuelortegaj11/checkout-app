import { GATEWAY_TRANSACTION_ID } from './transaction.fixture';

/**
 * Respuesta de la pasarela al crear o consultar un cobro, con la forma real
 * del Sandbox (solo los campos relevantes).
 */
export const aGatewayTransactionResponse = (
  data: Record<string, unknown> = {},
) => ({
  data: {
    id: GATEWAY_TRANSACTION_ID,
    reference: 'TX-019200000000700080000000000000A1',
    amount_in_cents: 20_040_000,
    currency: 'COP',
    payment_method_type: 'CARD',
    status: 'APPROVED',
    status_message: null,
    ...data,
  },
});
