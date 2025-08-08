export interface VisaApplication {
  id: string;
  orderItemId: string;
  plannedCountryEntryDate?: string | null;
  applicationCode?: string | null;
  submittedByAgent: boolean;
  isMultientry: boolean;
  note?: string | null;
  revisedActivationDate?: string | null;
  statusNote?: string | null;
  status?: string;
  country?: {
    id: string | null;
    name: string | null;
  };
  visaType?: {
    id: string;
    name: string;
    serviceCost: number;
    isMultientry: boolean;
    multientryExtraCost?: number | null;
    processingMode?: string;
    processingUnit?: string;
    processingValueFixed?: number | null;
    processingValueMin?: number | null;
    processingValueMax?: number | null;
  } | null;
}
