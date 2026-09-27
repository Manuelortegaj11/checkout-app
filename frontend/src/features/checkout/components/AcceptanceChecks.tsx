import { ExternalLink } from 'lucide-react';
import type { CheckoutConfig } from '@shared/api/checkout.api';
import { Checkbox } from '@shared/ui/Checkbox';

export interface Acceptance {
  endUserPolicy: boolean;
  personalDataAuth: boolean;
}

export interface AcceptanceChecksProps {
  contracts: CheckoutConfig['acceptance'];
  accepted: Acceptance;
  onChange: (accepted: Acceptance) => void;
}

function DocumentLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-medium text-primary-600 underline underline-offset-2 hover:text-primary-700"
    >
      {children}
      <ExternalLink aria-hidden="true" className="size-3" />
      <span className="sr-only">(se abre en otra pestaña)</span>
    </a>
  );
}

/**
 * Las dos aceptaciones que exige la pasarela antes de cobrar, con casillas
 * explícitas y el enlace a cada documento.
 */
export function AcceptanceChecks({
  contracts,
  accepted,
  onChange,
}: AcceptanceChecksProps) {
  return (
    <fieldset className="flex min-w-0 flex-col">
      <legend className="mb-1 text-sm font-semibold text-ink">
        Para pagar, acepta:
      </legend>
      <Checkbox
        label="Acepto la política de uso de la pasarela de pagos"
        checked={accepted.endUserPolicy}
        onChange={(event) =>
          onChange({ ...accepted, endUserPolicy: event.target.checked })
        }
        details={
          <DocumentLink href={contracts.endUserPolicy.url}>
            Leer la política de uso
          </DocumentLink>
        }
      />
      <Checkbox
        label="Autorizo el tratamiento de mis datos personales"
        checked={accepted.personalDataAuth}
        onChange={(event) =>
          onChange({ ...accepted, personalDataAuth: event.target.checked })
        }
        details={
          <DocumentLink href={contracts.personalDataAuth.url}>
            Leer la autorización
          </DocumentLink>
        }
      />
    </fieldset>
  );
}
