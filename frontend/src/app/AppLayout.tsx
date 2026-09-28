import type { ReactNode } from 'react';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line-subtle bg-surface">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4 sm:h-16 sm:px-6">
          <span className="text-lg font-bold tracking-tight text-ink">
            Templetus
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        {children}
      </main>

      <footer className="border-t border-line-subtle">
        <p className="mx-auto w-full max-w-6xl px-4 py-6 text-xs text-ink-subtle sm:px-6">
          Pagos de prueba en el entorno Sandbox de la pasarela: no se hace
          ningún cobro real.
        </p>
      </footer>
    </div>
  );
}
