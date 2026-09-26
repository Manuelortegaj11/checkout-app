import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './root-reducer';

export type RootState = ReturnType<typeof rootReducer>;

/** Crea un store; las pruebas lo usan con un estado inicial propio. */
export const makeStore = (preloadedState?: Partial<RootState>) =>
  configureStore({ reducer: rootReducer, preloadedState });

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];

export const store = makeStore();
