import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { Provider } from 'react-redux';
import { makeStore, type RootState } from '@store/index';

interface RenderWithStoreOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>;
}

/** Renderiza con un store real y nuevo en cada prueba, opcionalmente con un estado inicial. */
export const renderWithStore = (
  ui: ReactElement,
  { preloadedState, ...options }: RenderWithStoreOptions = {},
) => {
  const store = makeStore(preloadedState);
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return { store, ...render(ui, { wrapper: Wrapper, ...options }) };
};
