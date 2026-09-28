import { ArrowLeft, X } from 'lucide-react';
import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useDialogBehavior } from '@shared/hooks/use-dialog-behavior';

export interface BackdropProps {
  title: string;
  description?: string;

  onClose?: () => void;

  onBack?: () => void;
  children: ReactNode;

  footer?: ReactNode;
}

const HEADER_BUTTON =
  'grid size-11 shrink-0 cursor-pointer place-items-center rounded-control text-ink-muted transition-colors duration-150 ease-standard hover:bg-hover hover:text-ink';

export function Backdrop({
  title,
  description,
  onClose,
  onBack,
  children,
  footer,
}: BackdropProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(panelRef, onClose);

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end pt-14 sm:pt-16">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-backdrop"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className="relative mx-auto flex max-h-full w-full max-w-xl animate-sheet-in flex-col border-t-4 border-primary-500 bg-surface-overlay pb-[env(safe-area-inset-bottom)] shadow-overlay outline-none"
      >
        <header className="flex items-start gap-2 border-b border-line-subtle py-3 pr-3 pl-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Volver"
              className={HEADER_BUTTON}
            >
              <ArrowLeft aria-hidden="true" className="size-5" />
            </button>
          ) : (
            <span aria-hidden="true" className="w-2" />
          )}
          <div className="min-w-0 flex-1 pt-2">
            <h2 id={titleId} className="text-lg font-semibold text-ink">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-ink-muted">
                {description}
              </p>
            )}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className={HEADER_BUTTON}
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          )}
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {children}
        </div>
        {footer && (
          <footer className="border-t border-line-subtle px-5 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
