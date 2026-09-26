import { useEffect, useEffectEvent, type RefObject } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Lo que promete aria-modal: el foco no sale del panel (Tab y Shift+Tab dan la
 * vuelta), Escape cierra, el fondo no hace scroll y al cerrar el foco vuelve a
 * quien abrió el diálogo. Sin esto, el lector de pantalla cree que el fondo
 * está inerte mientras el tabulador sigue saliéndose a él.
 *
 * El foco inicial va al panel: así se anuncia su título y en móvil no se abre
 * el teclado antes de que el cliente elija un campo.
 */
export function useDialogBehavior(
  panelRef: RefObject<HTMLElement | null>,
  onClose: () => void,
): void {
  const close = useEffectEvent(onClose);

  useEffect(() => {
    const panel = panelRef.current;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab' || !panel) {
        return;
      }

      const focusables = panel.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusables.length === 0) {
        // Nada a donde ir: el foco se queda en el panel.
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const leavingStart =
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === panel);
      const leavingEnd = !event.shiftKey && document.activeElement === last;

      if (leavingStart) {
        event.preventDefault();
        last.focus();
      } else if (leavingEnd) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [panelRef]);
}
