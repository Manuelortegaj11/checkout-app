import type { Persistor } from 'redux-persist';

export const rehydrated = (persistor: Persistor): Promise<void> =>
  new Promise((resolve) => {
    const isDone = () => persistor.getState().bootstrapped;
    if (isDone()) {
      resolve();
      return;
    }
    const unsubscribe = persistor.subscribe(() => {
      if (isDone()) {
        unsubscribe();
        resolve();
      }
    });
  });

export const persistedCheckout = (): Record<string, unknown> => {
  const raw = localStorage.getItem('persist:checkout');
  if (raw === null) {
    return {};
  }
  const entries = Object.entries(JSON.parse(raw) as Record<string, string>);
  return Object.fromEntries(
    entries.map(([key, value]) => [key, JSON.parse(value) as unknown]),
  );
};
