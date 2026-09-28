const STORE_TIME_ZONE = 'America/Bogota';

const formatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: STORE_TIME_ZONE,
});

export const formatDateTime = (iso: string): string =>
  formatter.format(new Date(iso));
