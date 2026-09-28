import type { FormErrors } from '../checkout-form.validation';

export interface FormSectionProps<Form> {
  values: Form;

  errors: FormErrors<Form>;
  onChange: (changes: Partial<Form>) => void;
  onBlur: (field: keyof Form) => void;
}
