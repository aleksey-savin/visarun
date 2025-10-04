import {
  StoreClient,
  StoreOrderItem,
  StoreOrderPayment,
  StoreUser,
  StoreVisaApplication,
} from '@/stores/order/order-store';

// Validation function to check if client has errors
export const clientHasServicePuzzleErrors = (
  client: StoreClient,
  orderItems: StoreOrderItem[],
  visaApplications: StoreVisaApplication[]
) => {
  const clientOrderItems = orderItems.filter(item => item.clientId === client.id);
  const errors = new Set(client.errors || []);

  // 1. Passport expires
  if (!client.preConfirmPassportIsValid) {
    errors.add('Passport expires within 6 months');
  }

  // 2. No order items
  if (!client.isPrimary && clientOrderItems.length === 0) {
    errors.add('No order items added');
  }

  const accelerationItems = clientOrderItems.filter(item => item.serviceType === 'acceleration');
  for (const item of accelerationItems) {
    const visaApp = visaApplications.find(app => app.orderItemId === item.id);
    if (!visaApp || !visaApp.applicationCode) {
      errors.add('Visa acceleration info is not complete');
    }
  }

  // 3. Visa info incomplete
  const visaOrderItems = clientOrderItems.filter(item =>
    ['visa', 'acceleration'].includes(item.serviceType)
  );
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

export const clientHasPersonalDataErrors = (
  client: StoreClient,
  orderItems: StoreOrderItem[],
  user?: StoreUser
) => {
  const errors = new Set(client.errors || []);

  const hasOnlyAccelerationServices = orderItems.every(item => item.serviceType === 'acceleration');

  if (hasOnlyAccelerationServices) return [];

  const docRequirements =
    client.visaRequirements?.filter(req => req.inputType === 'document') || [];

  const needsToComply = orderItems.filter(item => item.clientId === client.id).length > 0;

  // 1. Required documents not uploaded
  for (const req of docRequirements || []) {
    const uploadedDocument = client?.documents?.find(doc => doc.requirementId === req.id);

    if (!uploadedDocument && !req.isOptional && needsToComply) {
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
    const existingClientRequirement = client.requirements?.find(
      requirement => requirement.requirementId === req.id
    );

    if (
      req.thresholdBool === false &&
      existingClientRequirement &&
      existingClientRequirement.booleanValue === true &&
      needsToComply
    ) {
      errors.add(`Switch ${req.title} must be unchecked to continue`);
    }

    if (
      req.thresholdBool === true &&
      (!existingClientRequirement ||
        (existingClientRequirement.booleanValue === false && needsToComply))
    ) {
      errors.add(`Switch ${req.title} must be checked to continue`);
    }
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

export const clientHasOrderPaymentErrors = (payment: StoreOrderPayment) => {
  const errors = new Set(payment.errors || []);

  if (!payment) {
    errors.add('Payment is required');
  }

  if (payment && !payment.documentUrl && !payment.confirmPaymentWithoutDocument) {
    errors.add('Uploaded document is required');
  }

  return errors;
};
