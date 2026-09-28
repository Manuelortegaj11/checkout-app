import { act, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import { App } from '@app/App';
import { makeStore } from '@store/index';
import { rehydrated } from './persistence.helper';

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
  await act(() => rehydrated(persistor));

  return { store, persistor, ...view };
};
