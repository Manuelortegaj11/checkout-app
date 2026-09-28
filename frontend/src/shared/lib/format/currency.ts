const formatters = new Map<string, Intl.NumberFormat>();

const formatterFor = (currency: string): Intl.NumberFormat => {
  let formatter = formatters.get(currency);

  if (!formatter) {
    formatter = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
    formatters.set(currency, formatter);
  }

  return formatter;
};

export const formatCurrency = (
  amountInCents: number,
  currency = 'COP',
): string => formatterFor(currency).format(amountInCents / 100);
