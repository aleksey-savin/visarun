import { StoreClient, StoreOrderItem, StoreVisaApplication } from '@/stores/order/order-store';
import { isPassportExpiringWithin6Months } from '@/utils/passportExpirationDate';

// Validation function to check if client has errors
export const clientHasErrors = (
  client: StoreClient,
  orderItems: StoreOrderItem[],
  visaApplications: StoreVisaApplication[]
) => {
  const clientOrderItems = orderItems.filter(item => item.clientId === client.id);
  const errors = new Set(client.errors || []);

  // 1. Passport expires
  const passportExpires = isPassportExpiringWithin6Months(
    client.passportExpirationDate ? client.passportExpirationDate.toISOString() : ''
  );
  if (passportExpires) {
    errors.add('Passport expires within 6 months');
  }

  // 2. No order items
  if (clientOrderItems.length === 0 && !client.isPrimary) {
    errors.add('No order items added');
  }

  // 3. Visa info incomplete
  const visaOrderItems = clientOrderItems.filter(item => item.serviceType === 'visa');
  for (const visaItem of visaOrderItems) {
    const visaApp = visaApplications.find(app => app.orderItemId === visaItem.id);
    if (!visaApp || !visaApp.visaType?.id || !visaApp.plannedCountryEntryDate) {
      errors.add('Visa info is not complete');
    }
  }

  // 4. Blacklisted
  const hasBlacklistedApplications = visaApplications.some(va => {
    const orderItem = orderItems
      .filter(item => item.clientId === client.id)
      .find(item => item.id === va.orderItemId);
    if (!orderItem) return false;
    if (!client?.citizenship?.blacklisted) return false;
    return client.citizenship.blacklisted.some(bl => bl.countryId === va.country.id);
  });
  if (hasBlacklistedApplications) {
    errors.add('Client is blacklisted for countries they are applying visas for');
  }

  return errors;
};
