import { VisaApplication } from './VisaApplication';

export interface OrderItem {
  id?: string;
  orderId?: string;
  serviceType: string;
  serviceTypeId?: string | null;
  client: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    citizenship?: object | null;
  };
  visaApplication?: VisaApplication | null;
  basePrice?: number;
  finalPrice?: number;
}
