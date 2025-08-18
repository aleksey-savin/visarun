import {
  StoreClient,
  StoreOrderItem,
  StoreUser,
  StoreVisaApplication,
} from '@/stores/order/order-store';
import { isPassportExpiringWithin6Months } from '@/utils/passportExpirationDate';

// Validation function to check if client has errors
export const clientHasServicePuzzleErrors = (
  client: StoreClient,
  orderItems: StoreOrderItem[],
  visaApplications: StoreVisaApplication[],
  user?: StoreUser
) => {
  const clientOrderItems = orderItems.filter(item => item.clientId === client.id);
  const errors = new Set(client.errors || []);

  // 1. Passport expires
  const passportExpires = isPassportExpiringWithin6Months(
    client.passportExpirationDate ? client.passportExpirationDate.toISOString() : ''
  );
  if (passportExpires) {
    // passport expiry should not block the flow
    //errors.add('Passport expires within 6 months');
  }

  // 2. No order items
  if (clientOrderItems.length === 0) {
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

  // 5. User contact information (only for primary client)
  if (client.isPrimary && user) {
    if (!user.email || user.email.trim() === '') {
      errors.add('Email is required');
    }
    if (!user.phoneNumber || user.phoneNumber.trim() === '') {
      errors.add('Phone number is required');
    }
  }

  return errors;
};

export const clientHasPersonalDataErrors = (client: StoreClient, user?: StoreUser) => {
  const errors = new Set(client.errors || []);

  const docRequirements =
    client.visaRequirements?.filter(req => req.inputType === 'document') || [];

  // 1. Required documents not uploaded
  for (const req of docRequirements || []) {
    const uploadedDocument = client?.documents?.find(doc => doc.requirementId === req.id);

    if (!uploadedDocument && !req.isOptional) {
      errors.add(`Document ${req.title} is not uploaded`);
    }
  }

  // 2. Client name validation
  if (!client.firstName || client.firstName.trim() === '') {
    errors.add('First name is required');
  }
  if (!client.lastName || client.lastName.trim() === '') {
    errors.add('Last name is required');
  }

  // 3. User contact validation (only for primary client)
  if (client.isPrimary && user) {
    if (!user.email || user.email.trim() === '') {
      errors.add('Email is required');
    }
    if (!user.phoneNumber || user.phoneNumber.trim() === '') {
      errors.add('Phone number is required');
    }
  }

  // 4. Check boolean requirements
  const booleanRequirements =
    client.visaRequirements?.filter(req => req.inputType === 'boolean') || [];

  for (const req of booleanRequirements || []) {
    if (req.thresholdBool === false) {
      errors.add(`Switch ${req.title} must be unchecked to continue`);
    }
  }

  return errors;
};
