/** VISA y MasterCard usan un código de seguridad de exactamente 3 dígitos. */
export const isValidCvc = (cvc: string): boolean => /^\d{3}$/.test(cvc);
