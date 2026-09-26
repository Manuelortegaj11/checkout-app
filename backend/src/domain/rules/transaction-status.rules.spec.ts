import { isFinalStatus, isTransactionStatus } from './transaction-status.rules';

describe('transaction status rules', () => {
  it.each(['PENDING', 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR'])(
    'isTransactionStatus reconoce %p',
    (value) => {
      expect(isTransactionStatus(value)).toBe(true);
    },
  );

  it.each(['approved', 'REFUNDED', '', null, 42, undefined])(
    'isTransactionStatus rechaza %p',
    (value) => {
      expect(isTransactionStatus(value)).toBe(false);
    },
  );

  it.each(['APPROVED', 'DECLINED', 'VOIDED', 'ERROR'] as const)(
    '%s es un estado final',
    (status) => {
      expect(isFinalStatus(status)).toBe(true);
    },
  );

  it('PENDING no es un estado final', () => {
    expect(isFinalStatus('PENDING')).toBe(false);
  });
});
