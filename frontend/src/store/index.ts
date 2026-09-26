import { configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';
import { rootReducer } from './root-reducer';

export type RootState = ReturnType<typeof rootReducer>;

/** Crea un store; las pruebas lo usan con un estado inicial propio. */
export const makeStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // Las acciones internas de redux-persist llevan funciones: no son del estado.
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];

export const store = makeStore();

/** Guarda el checkout en localStorage y lo recupera al abrir la app. */
export const persistor = persistStore(store);
