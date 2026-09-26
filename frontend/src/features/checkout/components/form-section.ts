import type { FormErrors } from '../checkout-form.validation';

/** Lo que recibe cada sección del formulario: sin Redux ni estado propio. */
export interface FormSectionProps<Form> {
  values: Form;
  /** Solo los errores que ya se deben mostrar. */
  errors: FormErrors<Form>;
  onChange: (changes: Partial<Form>) => void;
  onBlur: (field: keyof Form) => void;
}
