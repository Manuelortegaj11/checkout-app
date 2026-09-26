/**
 * Respuesta de `GET /merchants/{publicKey}` con la forma real del Sandbox
 * (solo los campos relevantes).
 */
export const aMerchantResponse = () => ({
  data: {
    id: 5113,
    name: 'Comercio de pruebas',
    accepted_currencies: ['COP'],
    presigned_acceptance: {
      acceptance_token: 'end-user-policy-token',
      permalink: 'https://gateway.test/docs/end-user-policy.pdf',
      type: 'END_USER_POLICY',
    },
    presigned_personal_data_auth: {
      acceptance_token: 'personal-data-auth-token',
      permalink: 'https://gateway.test/docs/personal-data-auth.pdf',
      type: 'PERSONAL_DATA_AUTH',
    },
  },
});

/** Respuesta HTTP JSON para simular `fetch`. */
export const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
