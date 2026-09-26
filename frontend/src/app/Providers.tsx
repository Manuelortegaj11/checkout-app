import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '@store/index';

/** Contexto de toda la app: el store de Redux. */
export function Providers({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
