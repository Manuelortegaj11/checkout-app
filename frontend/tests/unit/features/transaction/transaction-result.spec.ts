import { resultPresentation } from '@features/transaction/transaction-result';

describe('resultPresentation', () => {
  it.each([
    ['APPROVED', 'success', '¡Pago aprobado!'],
    ['DECLINED', 'danger', 'Pago rechazado'],
    ['VOIDED', 'warning', 'Pago anulado'],
    ['ERROR', 'danger', 'No pudimos procesar el pago'],
    ['PENDING', 'warning', 'Pago en proceso'],
  ] as const)('%s se comunica con tono %s: "%s"', (status, tone, title) => {
    expect(resultPresentation(status)).toMatchObject({ tone, title });
  });

  it('si el pago no se aprobó, aclara que no hubo cobro', () => {
    expect(resultPresentation('DECLINED').message).toContain(
      'no se hizo ningún cobro',
    );
    expect(resultPresentation('ERROR').message).toContain(
      'no se hizo ningún cobro',
    );
  });
});
