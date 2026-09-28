import type { Storage } from 'redux-persist';

const attempt = <T>(operation: () => T, fallback: T): T => {
  try {
    return operation();
  } catch {
    return fallback;
  }
};

export const localStorageEngine: Storage = {
  getItem: (key: string) =>
    Promise.resolve(attempt(() => localStorage.getItem(key), null)),
  setItem: (key: string, value: string) =>
    Promise.resolve(attempt(() => localStorage.setItem(key, value), undefined)),
  removeItem: (key: string) =>
    Promise.resolve(attempt(() => localStorage.removeItem(key), undefined)),
};
