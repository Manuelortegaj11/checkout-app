import { act, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import { App } from '@app/App';
import { makeStore } from '@store/index';
import { rehydrated } from './persistence.helper';

/**
 * Monta la app completa con un store y una persistencia nuevos, como al abrir
 * la página: recupera lo que haya en localStorage antes de pintar.
 */
export const renderApp = async () => {
  const store = makeStore();
  const persistor = persistStore(store);
  const view = render(
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>,
  );
  // PersistGate pinta al terminar de recuperar el estado: esa espera va en act.
  await act(() => rehydrated(persistor));

  return { store, persistor, ...view };
};
