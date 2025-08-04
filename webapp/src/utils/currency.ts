export const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('ru-Ru', {
    style: 'currency',
    currency: currency || 'VND',
  }).format(amount);
};
