import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import { store } from '@store/index';

/**
 * Guarda el checkout en localStorage y lo recupera al abrir la app. Se crea
 * aquí y no en store/: así importar el store no escribe en localStorage.
 */
const persistor = persistStore(store);

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
