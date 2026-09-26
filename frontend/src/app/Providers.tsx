import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from '@store/index';

/**
 * Contexto de toda la app: el store de Redux. PersistGate espera a recuperar
 * el checkout de localStorage antes de pintar, para no mostrar un paso
 * equivocado durante un instante. Tarda milisegundos: no hace falta indicador.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
