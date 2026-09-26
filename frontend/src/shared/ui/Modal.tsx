import { X } from 'lucide-react';
import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useDialogBehavior } from '@shared/hooks/use-dialog-behavior';

export interface ModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  /** Acciones fijas al pie, siempre visibles aunque el contenido haga scroll. */
  footer?: ReactNode;
}

/**
 * Diálogo modal: hoja que sube desde abajo en móvil y tarjeta centrada desde
 * `sm`. Se monta solo mientras está abierto. Se cierra con Escape, con la X o
 * tocando el fondo.
 */
export function Modal({
  title,
  description,
  onClose,
  children,
  footer,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(panelRef, onClose);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
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
        className="relative flex max-h-[92dvh] w-full animate-sheet-in flex-col rounded-surface bg-surface-overlay pb-[env(safe-area-inset-bottom)] shadow-overlay outline-none sm:max-w-lg sm:animate-dialog-in"
      >
        <header className="flex items-start gap-4 border-b border-line-subtle py-3 pr-3 pl-5">
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
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-control text-ink-muted transition-colors duration-150 ease-standard hover:bg-hover hover:text-ink"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
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
