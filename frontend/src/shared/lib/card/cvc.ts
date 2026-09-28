export const isValidCvc = (cvc: string): boolean => /^\d{3}$/.test(cvc);
