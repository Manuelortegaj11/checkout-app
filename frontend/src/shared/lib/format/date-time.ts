/** Hora de la tienda: los pagos se muestran en la hora de Colombia, esté donde esté el cliente. */
const STORE_TIME_ZONE = 'America/Bogota';

const formatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: STORE_TIME_ZONE,
});

/** Fecha ISO 8601 de la API lista para mostrar: `26 de septiembre de 2026 a las 10:04 a. m.` */
export const formatDateTime = (iso: string): string =>
  formatter.format(new Date(iso));
