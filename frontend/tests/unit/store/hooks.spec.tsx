import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { fetchProducts } from '@features/products/products.thunks';
import { productsApi } from '@shared/api/products.api';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { makeStore } from '@store/index';

describe('hooks del store', () => {
  it('leen el estado y despachan thunks del store del Provider', async () => {
    jest.spyOn(productsApi, 'list').mockResolvedValue([]);
    const store = makeStore();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(
      () => ({
        dispatch: useAppDispatch(),
        status: useAppSelector((state) => state.products.status),
      }),
      { wrapper },
    );
    expect(result.current.status).toBe('idle');

    await act(() => result.current.dispatch(fetchProducts()));

    expect(result.current.status).toBe('succeeded');
  });
});
