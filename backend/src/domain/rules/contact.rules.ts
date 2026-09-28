export const normalizePersonName = (name: string): string =>
  name.trim().replace(/\s+/g, ' ');

export const normalizePhone = (phone: string): string =>
  phone.replace(/\s+/g, '');
