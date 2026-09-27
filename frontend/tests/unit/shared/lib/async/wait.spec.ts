import { wait } from '@shared/lib/async/wait';

describe('wait', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('se resuelve cuando pasa el tiempo', async () => {
    const done = jest.fn();
    void wait(2_000).then(done);

    await jest.advanceTimersByTimeAsync(1_999);
    expect(done).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1);
    expect(done).toHaveBeenCalled();
  });

  it('al abortar la señal rechaza con AbortError y cancela el temporizador', async () => {
    const controller = new AbortController();
    const waiting = wait(2_000, controller.signal);

    controller.abort();

    await expect(waiting).rejects.toMatchObject({ name: 'AbortError' });
    expect(jest.getTimerCount()).toBe(0);
  });

  it('con una señal ya abortada rechaza sin esperar', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(wait(2_000, controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(jest.getTimerCount()).toBe(0);
  });

  it('al terminar deja de escuchar la señal', async () => {
    const controller = new AbortController();
    const removeListener = jest.spyOn(controller.signal, 'removeEventListener');
    const waiting = wait(1_000, controller.signal);

    await jest.advanceTimersByTimeAsync(1_000);

    await expect(waiting).resolves.toBeUndefined();
    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
  });
});
