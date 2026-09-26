/** Nombre de una persona sin espacios sobrantes: `  Ana   Gómez ` → `Ana Gómez`. */
export const normalizePersonName = (name: string): string =>
  name.trim().replace(/\s+/g, ' ');

/** Teléfono sin espacios: `300 123 4567` → `3001234567`. */
export const normalizePhone = (phone: string): string =>
  phone.replace(/\s+/g, '');
