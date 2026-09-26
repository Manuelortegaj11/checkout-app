import { databaseError } from '@infrastructure/persistence/database.errors';

describe('databaseError', () => {
  it('es un error de infraestructura con código estable y la causa original', () => {
    const cause = new Error('connection refused');

    expect(databaseError(cause)).toEqual({
      type: 'INFRASTRUCTURE',
      code: 'DB_QUERY_FAILED',
      message: 'Database query failed',
      cause,
    });
  });
});
