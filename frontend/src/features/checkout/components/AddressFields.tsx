import { Fieldset } from '@shared/ui/Fieldset';
import { TextField } from '@shared/ui/TextField';
import type { AddressForm } from '../checkout-form.validation';
import type { FormSectionProps } from './form-section';

/** Dirección de entrega del pedido. */
export function AddressFields({
  values,
  errors,
  onChange,
  onBlur,
}: FormSectionProps<AddressForm>) {
  return (
    <Fieldset legend="Dirección de entrega">
      <TextField
        label="Dirección"
        name="addressLine1"
        autoComplete="address-line1"
        placeholder="Calle 10 # 20-30"
        value={values.addressLine1}
        error={errors.addressLine1}
        onChange={(event) => onChange({ addressLine1: event.target.value })}
        onBlur={() => onBlur('addressLine1')}
      />
      <TextField
        label="Apartamento, torre u otros (opcional)"
        name="addressLine2"
        autoComplete="address-line2"
        value={values.addressLine2}
        error={errors.addressLine2}
        onChange={(event) => onChange({ addressLine2: event.target.value })}
        onBlur={() => onBlur('addressLine2')}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Ciudad"
          name="city"
          autoComplete="address-level2"
          value={values.city}
          error={errors.city}
          onChange={(event) => onChange({ city: event.target.value })}
          onBlur={() => onBlur('city')}
        />
        <TextField
          label="Departamento"
          name="region"
          autoComplete="address-level1"
          value={values.region}
          error={errors.region}
          onChange={(event) => onChange({ region: event.target.value })}
          onBlur={() => onBlur('region')}
        />
      </div>
      <TextField
        label="Código postal (opcional)"
        name="postalCode"
        inputMode="numeric"
        autoComplete="postal-code"
        value={values.postalCode}
        error={errors.postalCode}
        onChange={(event) => onChange({ postalCode: event.target.value })}
        onBlur={() => onBlur('postalCode')}
      />
    </Fieldset>
  );
}
