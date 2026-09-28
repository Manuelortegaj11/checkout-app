import { Fieldset } from '@shared/ui/Fieldset';
import { TextField } from '@shared/ui/TextField';
import type { ContactForm } from '../checkout-form.validation';
import type { FormSectionProps } from './form-section';

export function ContactFields({
  values,
  errors,
  onChange,
  onBlur,
}: FormSectionProps<ContactForm>) {
  return (
    <Fieldset legend="Contacto">
      <TextField
        label="Nombre completo"
        name="fullName"
        autoComplete="name"
        value={values.fullName}
        error={errors.fullName}
        onChange={(event) => onChange({ fullName: event.target.value })}
        onBlur={() => onBlur('fullName')}
      />
      <TextField
        label="Correo"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={values.email}
        error={errors.email}
        onChange={(event) => onChange({ email: event.target.value })}
        onBlur={() => onBlur('email')}
      />
      <TextField
        label="Teléfono"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        hint="Solo para coordinar la entrega"
        value={values.phone}
        error={errors.phone}
        onChange={(event) => onChange({ phone: event.target.value })}
        onBlur={() => onBlur('phone')}
      />
    </Fieldset>
  );
}
