import { isFinalStatus } from '@features/transaction/transaction-status';
import type { TransactionStatus } from '@shared/api/transactions.api';

describe('isFinalStatus', () => {
  it('PENDING no es final: el pago aún no se decide', () => {
    expect(isFinalStatus('PENDING')).toBe(false);
  });

  it.each<TransactionStatus>(['APPROVED', 'DECLINED', 'VOIDED', 'ERROR'])(
    '%s es final',
    (status) => {
      expect(isFinalStatus(status)).toBe(true);
    },
  );
});
