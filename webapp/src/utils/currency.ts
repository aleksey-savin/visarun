export const formatCurrency = (amount: number, currency?: string) => {
  try {
    // Try to format with the provided currency
    if (currency) {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0,
      }).format(amount);
    }
  } catch {
    // If currency is invalid, fall back to number formatting with currency symbol
    console.warn(`Invalid currency code: ${currency}`);
  }

  // Fallback: format as number with currency name or default
  const currencySymbol = currency || 'VND';
  return (
    new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ` ${currencySymbol}`
  );
};

export const getCurrencySymbol = (currency?: string) => {
    try {
        // Try to format with the provided currency
        if (currency) {
            const parts = new Intl.NumberFormat('ru-RU', {
                style: 'currency',
                currency: currency,
                currencyDisplay: 'symbol',
            }).formatToParts(1);

            const symbolPart = parts.find((p) => p.type === 'currency');
            return symbolPart ? symbolPart.value : 'VND';
        }
    } catch {
        // If currency is invalid, fall back to number formatting with currency symbol
        console.warn(`Invalid currency code: ${currency}`);
    }

    // Fallback: format as number with currency name or default
    return currency || 'VND';
}
