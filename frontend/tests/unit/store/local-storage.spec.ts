import { localStorageEngine } from '@store/local-storage';

describe('localStorageEngine', () => {
  it('guarda, lee y borra valores de localStorage', async () => {
    await localStorageEngine.setItem('persist:checkout', '{"step":"PRODUCT"}');
    await expect(localStorageEngine.getItem('persist:checkout')).resolves.toBe(
      '{"step":"PRODUCT"}',
    );

    await localStorageEngine.removeItem('persist:checkout');
    await expect(
      localStorageEngine.getItem('persist:checkout'),
    ).resolves.toBeNull();
  });

  it('si el navegador bloquea localStorage, sigue sin persistir en lugar de fallar', async () => {
    const blocked = () => {
      throw new DOMException('Access denied', 'SecurityError');
    };
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked);
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(blocked);

    await expect(localStorageEngine.setItem('k', 'v')).resolves.toBeUndefined();
    await expect(localStorageEngine.getItem('k')).resolves.toBeNull();
    await expect(localStorageEngine.removeItem('k')).resolves.toBeUndefined();
  });
});
