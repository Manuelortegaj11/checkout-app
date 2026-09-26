import { detectCardBrand } from '@shared/lib/card/card-brand';
import { digitsOnly, formatCardNumber } from '@shared/lib/card/card-number';
import { formatExpiry } from '@shared/lib/card/expiry';
import { CardBrandIcon } from '@shared/ui/CardBrandIcon';
import { Fieldset } from '@shared/ui/Fieldset';
import { TextField } from '@shared/ui/TextField';
import type { CardForm } from '../checkout-form.validation';
import type { FormSectionProps } from './form-section';

/**
 * Datos de la tarjeta. Viven solo en el estado local del formulario: van a la
 * pasarela para tokenizarlos y nunca llegan al store ni al backend.
 */
export function CardFields({
  values,
  errors,
  onChange,
  onBlur,
}: FormSectionProps<CardForm>) {
  const brand = detectCardBrand(digitsOnly(values.number));

  return (
    <Fieldset legend="Tarjeta de crédito">
      <TextField
        label="Número de la tarjeta"
        name="number"
        inputMode="numeric"
        autoComplete="cc-number"
        placeholder="0000 0000 0000 0000"
        value={values.number}
        error={errors.number}
        adornment={<CardBrandIcon brand={brand} />}
        onChange={(event) =>
          onChange({ number: formatCardNumber(event.target.value) })
        }
        onBlur={() => onBlur('number')}
      />
      <TextField
        label="Nombre en la tarjeta"
        name="holder"
        autoComplete="cc-name"
        value={values.holder}
        error={errors.holder}
        onChange={(event) => onChange({ holder: event.target.value })}
        onBlur={() => onBlur('holder')}
      />
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Vencimiento"
          name="expiry"
          inputMode="numeric"
          autoComplete="cc-exp"
          placeholder="MM/AA"
          value={values.expiry}
          error={errors.expiry}
          onChange={(event) =>
            onChange({ expiry: formatExpiry(event.target.value) })
          }
          onBlur={() => onBlur('expiry')}
        />
        <TextField
          label="CVC"
          name="cvc"
          inputMode="numeric"
          autoComplete="cc-csc"
          placeholder="123"
          hint="3 dígitos al respaldo"
          value={values.cvc}
          error={errors.cvc}
          onChange={(event) =>
            onChange({ cvc: digitsOnly(event.target.value).slice(0, 3) })
          }
          onBlur={() => onBlur('cvc')}
        />
      </div>
    </Fieldset>
  );
}
