import type { Storage } from 'redux-persist';

/** Si el navegador bloquea localStorage (modo privado estricto, cuota llena), se sigue sin persistir. */
const attempt = <T>(operation: () => T, fallback: T): T => {
  try {
    return operation();
  } catch {
    return fallback;
  }
};

/**
 * Motor de almacenamiento de redux-persist sobre localStorage, y el único
 * archivo que lo toca. Reemplaza a `redux-persist/lib/storage`: ese módulo es
 * CommonJS con `exports.default` y Vite lo importa como el objeto del módulo,
 * no como el almacenamiento.
 */
export const localStorageEngine: Storage = {
  getItem: (key: string) =>
    Promise.resolve(attempt(() => localStorage.getItem(key), null)),
  setItem: (key: string, value: string) =>
    Promise.resolve(attempt(() => localStorage.setItem(key, value), undefined)),
  removeItem: (key: string) =>
    Promise.resolve(attempt(() => localStorage.removeItem(key), undefined)),
};
