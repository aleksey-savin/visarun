import { Citizenship } from './Citizenship.js';

export interface Client {
  id: string;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  citizenshipId?: string | null;
  citizenship?: Citizenship | null;
  passportExpirationDate?: string | null | undefined;
  userId?: string | null;
  isPrimary: boolean;
  prevViolations: boolean;
  prevViolationsDesc?: string | null | undefined;
  isOutsideTheCountry?: boolean;
  isOutsideTheCountryAt?: string | null | undefined;
}
