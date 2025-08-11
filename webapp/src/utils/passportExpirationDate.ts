export const isPassportExpiringWithin6Months = (date: string) => {
  const today = new Date();
  const sixMonthsFromNow = new Date(today);
  sixMonthsFromNow.setMonth(today.getMonth() + 6);

  return date && new Date(date) <= sixMonthsFromNow;
};
