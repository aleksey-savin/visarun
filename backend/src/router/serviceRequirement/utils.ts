import { PrismaClient } from '@prisma/client';

import { ServiceEntityType } from '@prisma/client';

export interface ServiceRequirementInput {
  serviceType: 'visa_application' | 'visarun_order' | 'document_service';
  serviceId: string;
  clientId?: string;
  visaTypeId?: string;
  citizenshipId?: string;
}

export interface RequirementWithStatus {
  id: string;
  title: string;
  description: string | null;
  inputType: string;
  operator: string | null;
  thresholdNumber: number | null;
  thresholdDate: Date | null;
  thresholdText: string | null;
  thresholdBool: boolean | null;
  checkpointValue: string | null;
  appliesToAllCitizenships: boolean;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'needs_revision';
  serviceRequirementId?: string;
  submittedValue?: string | Date | boolean | null;
  document?: {
    id: string;
    fileName: string;
    originalName: string;
    fileUrl: string;
    isValid: boolean;
  };
}

export interface ServiceReadinessResult {
  isReady: boolean;
  totalRequirements: number;
  completedRequirements: number;
  pendingRequirements: number;
  approvedRequirements: number;
  rejectedRequirements: number;
  requirements: RequirementWithStatus[];
}

/**
 * Initialize service requirements for a given service
 */
export async function initializeServiceRequirements(
  prisma: PrismaClient,
  input: ServiceRequirementInput
): Promise<void> {
  const { serviceType, serviceId, visaTypeId, citizenshipId } = input;

  // Build where clause for requirements
  const whereClause: {
    OR?: Array<{
      applicableServices?: { isEmpty: boolean } | { has: ServiceEntityType };
      appliesToAllCitizenships?: boolean;
      citizenships?: {
        some: {
          citizenshipId: string;
        };
      };
    }>;
    visaTypeLinks?: {
      some: {
        visaTypeId: string;
      };
    };
  } = {
    OR: [
      { applicableServices: { isEmpty: true } },
      { applicableServices: { has: serviceType as ServiceEntityType } },
    ],
  };

  // Add service-specific filters
  if (serviceType === 'visa_application' && visaTypeId) {
    whereClause.visaTypeLinks = {
      some: {
        visaTypeId,
      },
    };
  }

  // Add citizenship filter
  if (citizenshipId) {
    whereClause.OR = [
      { appliesToAllCitizenships: true },
      {
        appliesToAllCitizenships: false,
        citizenships: {
          some: {
            citizenshipId,
          },
        },
      },
    ];
  }

  // Get applicable requirements
  const requirements = await prisma.requirement.findMany({
    where: whereClause,
    select: {
      id: true,
    },
  });

  // Create service requirements for each applicable requirement
  const serviceRequirements = requirements.map(req => ({
    requirementId: req.id,
    serviceType,
    serviceId,
    status: 'pending' as const,
  }));

  // Use createMany to insert all service requirements
  if (serviceRequirements.length > 0) {
    await prisma.serviceRequirement.createMany({
      data: serviceRequirements,
      skipDuplicates: true,
    });
  }
}

/**
 * Get service requirements with their status
 */
export async function getServiceRequirements(
  prisma: PrismaClient,
  serviceType: 'visa_application' | 'visarun_order' | 'document_service',
  serviceId: string
): Promise<RequirementWithStatus[]> {
  const serviceRequirements = await prisma.serviceRequirement.findMany({
    where: {
      serviceType,
      serviceId,
    },
    select: {
      id: true,
      status: true,
      textValue: true,
      dateValue: true,
      booleanValue: true,
      checkpointValue: true,
      documentId: true,
      submittedAt: true,
      requirement: {
        select: {
          id: true,
          title: true,
          description: true,
          inputType: true,
          operator: true,
          thresholdNumber: true,
          thresholdDate: true,
          thresholdText: true,
          thresholdBool: true,
          checkpointValue: true,
          appliesToAllCitizenships: true,
        },
      },
      document: {
        select: {
          id: true,
          fileName: true,
          originalName: true,
          fileUrl: true,
          isValid: true,
        },
      },
    },
    orderBy: {
      requirement: {
        title: 'asc',
      },
    },
  });

  return serviceRequirements.map(sr => ({
    id: sr.requirement.id,
    title: sr.requirement.title,
    description: sr.requirement.description,
    inputType: sr.requirement.inputType,
    operator: sr.requirement.operator,
    thresholdNumber: sr.requirement.thresholdNumber,
    thresholdDate: sr.requirement.thresholdDate,
    thresholdText: sr.requirement.thresholdText,
    thresholdBool: sr.requirement.thresholdBool,
    checkpointValue: sr.requirement.checkpointValue,
    appliesToAllCitizenships: sr.requirement.appliesToAllCitizenships,
    status: sr.status,
    serviceRequirementId: sr.id,
    submittedValue: getSubmittedValue(sr),
    document: sr.document || undefined,
  }));
}

/**
 * Check service readiness based on requirements completion
 */
export async function checkServiceReadiness(
  prisma: PrismaClient,
  serviceType: 'visa_application' | 'visarun_order' | 'document_service',
  serviceId: string
): Promise<ServiceReadinessResult> {
  const requirements = await getServiceRequirements(prisma, serviceType, serviceId);

  const totalRequirements = requirements.length;
  const completedRequirements = requirements.filter(
    r => r.status === 'submitted' || r.status === 'approved'
  ).length;
  const pendingRequirements = requirements.filter(r => r.status === 'pending').length;
  const approvedRequirements = requirements.filter(r => r.status === 'approved').length;
  const rejectedRequirements = requirements.filter(r => r.status === 'rejected').length;

  const isReady = totalRequirements > 0 && approvedRequirements === totalRequirements;

  return {
    isReady,
    totalRequirements,
    completedRequirements,
    pendingRequirements,
    approvedRequirements,
    rejectedRequirements,
    requirements,
  };
}

/**
 * Validate requirement input based on its type and rules
 */
export function validateRequirementInput(
  requirement: RequirementWithStatus,
  inputValue: string | number | Date | boolean | null | undefined
): { isValid: boolean; message: string } {
  const { inputType, operator, thresholdDate, thresholdText, thresholdBool, checkpointValue } =
    requirement;

  // Handle null/undefined values
  if (inputValue === null || inputValue === undefined) {
    return { isValid: false, message: 'Input value is required' };
  }

  try {
    switch (inputType) {
      case 'document':
        if (typeof inputValue === 'string' && inputValue.startsWith('/uploads/')) {
          return { isValid: true, message: 'Document is valid' };
        }
        return { isValid: false, message: 'Valid document upload required' };

      case 'checkpoint':
        if (typeof inputValue === 'string' && inputValue === checkpointValue) {
          return { isValid: true, message: 'Checkpoint value matches requirement' };
        }
        return { isValid: false, message: `Expected checkpoint value: ${checkpointValue}` };

      case 'date': {
        if (!(inputValue instanceof Date)) {
          return { isValid: false, message: 'Valid date required' };
        }

        if (!thresholdDate || !operator) {
          return { isValid: false, message: 'Requirement configuration incomplete' };
        }

        const dateValue = inputValue;
        let isValid = false;
        let message = '';

        switch (operator) {
          case 'eq': {
            isValid = dateValue.getTime() === thresholdDate.getTime();
            message = isValid
              ? 'Date matches requirement'
              : `Date must be ${thresholdDate.toDateString()}`;
            break;
          }
          case 'neq': {
            isValid = dateValue.getTime() !== thresholdDate.getTime();
            message = isValid
              ? 'Date is acceptable'
              : `Date must not be ${thresholdDate.toDateString()}`;
            break;
          }
          case 'lt': {
            isValid = dateValue.getTime() < thresholdDate.getTime();
            message = isValid
              ? 'Date is valid'
              : `Date must be before ${thresholdDate.toDateString()}`;
            break;
          }
          case 'lte': {
            isValid = dateValue.getTime() <= thresholdDate.getTime();
            message = isValid
              ? 'Date is valid'
              : `Date must be on or before ${thresholdDate.toDateString()}`;
            break;
          }
          case 'gt': {
            isValid = dateValue.getTime() > thresholdDate.getTime();
            message = isValid
              ? 'Date is valid'
              : `Date must be after ${thresholdDate.toDateString()}`;
            break;
          }
          case 'gte': {
            isValid = dateValue.getTime() >= thresholdDate.getTime();
            message = isValid
              ? 'Date is valid'
              : `Date must be on or after ${thresholdDate.toDateString()}`;
            break;
          }
        }

        return { isValid, message };
      }

      case 'text': {
        if (typeof inputValue !== 'string' && typeof inputValue !== 'number') {
          return { isValid: false, message: 'Valid text required' };
        }

        if (!thresholdText || !operator) {
          return { isValid: false, message: 'Requirement configuration incomplete' };
        }

        const textValue = String(inputValue).trim();
        let textValid = false;
        let textMessage = '';

        switch (operator) {
          case 'eq': {
            textValid = textValue === thresholdText;
            textMessage = textValid
              ? 'Text matches requirement'
              : `Text must be exactly: ${thresholdText}`;
            break;
          }
          case 'neq': {
            textValid = textValue !== thresholdText;
            textMessage = textValid ? 'Text is acceptable' : `Text must not be: ${thresholdText}`;
            break;
          }
          case 'contains': {
            textValid = textValue.toLowerCase().includes(thresholdText.toLowerCase());
            textMessage = textValid
              ? 'Text contains required content'
              : `Text must contain: ${thresholdText}`;
            break;
          }
        }

        return { isValid: textValid, message: textMessage };
      }

      case 'boolean': {
        if (typeof inputValue !== 'boolean') {
          return { isValid: false, message: 'Valid boolean value required' };
        }

        if (thresholdBool === null || thresholdBool === undefined) {
          return { isValid: false, message: 'Requirement configuration incomplete' };
        }

        const boolValid = inputValue === thresholdBool;
        const boolMessage = boolValid
          ? 'Boolean value matches requirement'
          : `Boolean must be ${thresholdBool}`;

        return { isValid: boolValid, message: boolMessage };
      }

      default:
        return { isValid: false, message: 'Unknown requirement input type' };
    }
  } catch (error) {
    return {
      isValid: false,
      message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get submitted value from service requirement based on input type
 */
function getSubmittedValue(serviceRequirement: {
  textValue: string | null;
  dateValue: Date | null;
  booleanValue: boolean | null;
  checkpointValue: string | null;
  documentId: string | null;
}): string | Date | boolean | null {
  const { textValue, dateValue, booleanValue, checkpointValue, documentId } = serviceRequirement;

  if (textValue !== null) return textValue;
  if (dateValue !== null) return dateValue;
  if (booleanValue !== null) return booleanValue;
  if (checkpointValue !== null) return checkpointValue;
  if (documentId !== null) return documentId;

  return null;
}

/**
 * Get client documents that can be used for a specific requirement
 */
export async function getAvailableDocumentsForRequirement(
  prisma: PrismaClient,
  clientId: string,
  requirementId: string
): Promise<
  Array<{
    id: string;
    fileName: string;
    originalName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedAt: Date;
    expiresAt: Date | null;
    tags: string[];
    comment: string | null;
  }>
> {
  const documents = await prisma.clientDocument.findMany({
    where: {
      clientId,
      isValid: true,
      OR: [{ requirementId }, { requirementId: null }],
    },
    select: {
      id: true,
      fileName: true,
      originalName: true,
      fileUrl: true,
      fileType: true,
      fileSize: true,
      uploadedAt: true,
      expiresAt: true,
      tags: true,
      comment: true,
    },
    orderBy: {
      uploadedAt: 'desc',
    },
  });

  return documents.filter(doc => {
    // Filter out expired documents
    if (doc.expiresAt && doc.expiresAt < new Date()) {
      return false;
    }
    return true;
  });
}
