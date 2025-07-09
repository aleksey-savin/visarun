import { serviceRequirementCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateServiceRequirementTrpcInput = z.object({
  requirementId: z.string().uuid(),
  serviceType: z.enum(['visa_application', 'visarun_order', 'document_service']),
  serviceId: z.string().uuid(),
  textValue: z.string().optional(),
  dateValue: z.date().optional(),
  booleanValue: z.boolean().optional(),
  checkpointValue: z.string().optional(),
  documentId: z.string().uuid().optional(),
  comment: z.string().optional(),
});

export const createServiceRequirementTrpcRoute = serviceRequirementCreateProcedure
  .input(zCreateServiceRequirementTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const {
      requirementId,
      serviceType,
      serviceId,
      textValue,
      dateValue,
      booleanValue,
      checkpointValue,
      documentId,
      comment,
    } = input;

    if (!ctx.user) {
      throw new Error('User not authenticated');
    }

    // Check if requirement exists
    const existingRequirement = await ctx.prisma.requirement.findUnique({
      where: { id: requirementId },
      select: {
        id: true,
        title: true,
        serviceType: true,
        inputType: true,
        applicableServices: true,
      },
    });

    if (!existingRequirement) {
      throw new Error('Requirement not found');
    }

    // Check if the requirement is applicable to this service type
    if (
      existingRequirement.applicableServices.length > 0 &&
      !existingRequirement.applicableServices.includes(serviceType)
    ) {
      throw new Error(`Requirement is not applicable to service type: ${serviceType}`);
    }

    // Validate service exists based on service type
    if (serviceType === 'visa_application') {
      const visaApplication = await ctx.prisma.visaApplication.findUnique({
        where: { id: serviceId },
        select: { id: true },
      });
      if (!visaApplication) {
        throw new Error('Visa application not found');
      }
    }
    // Add validation for other service types when they're implemented

    // Check if document exists (if provided)
    if (documentId) {
      const existingDocument = await ctx.prisma.clientDocument.findUnique({
        where: { id: documentId },
        select: {
          id: true,
          isValid: true,
        },
      });

      if (!existingDocument) {
        throw new Error('Document not found');
      }

      if (!existingDocument.isValid) {
        throw new Error('Cannot use invalid document');
      }
    }

    // Check if this service requirement already exists
    const existingServiceRequirement = await ctx.prisma.serviceRequirement.findUnique({
      where: {
        serviceType_serviceId_requirementId: {
          serviceType,
          serviceId,
          requirementId,
        },
      },
    });

    if (existingServiceRequirement) {
      throw new Error('Service requirement already exists for this service and requirement');
    }

    // Validate input based on requirement type
    if (existingRequirement.inputType === 'document' && !documentId) {
      throw new Error('Document ID is required for document type requirements');
    }

    if (existingRequirement.inputType === 'text' && !textValue) {
      throw new Error('Text value is required for text type requirements');
    }

    if (existingRequirement.inputType === 'date' && !dateValue) {
      throw new Error('Date value is required for date type requirements');
    }

    if (existingRequirement.inputType === 'boolean' && booleanValue === undefined) {
      throw new Error('Boolean value is required for boolean type requirements');
    }

    if (existingRequirement.inputType === 'checkpoint' && !checkpointValue) {
      throw new Error('Checkpoint value is required for checkpoint type requirements');
    }

    // Create the service requirement
    const newServiceRequirement = await ctx.prisma.serviceRequirement.create({
      data: {
        requirementId,
        serviceType,
        serviceId,
        status: 'submitted',
        textValue,
        dateValue,
        booleanValue,
        checkpointValue,
        documentId,
        submittedAt: new Date(),
        comment,
      },
      select: {
        id: true,
        requirementId: true,
        serviceType: true,
        serviceId: true,
        status: true,
        textValue: true,
        dateValue: true,
        booleanValue: true,
        checkpointValue: true,
        documentId: true,
        submittedAt: true,
        reviewedAt: true,
        reviewedById: true,
        comment: true,
        requirement: {
          select: {
            id: true,
            title: true,
            description: true,
            serviceType: true,
            inputType: true,
            operator: true,
            thresholdNumber: true,
            thresholdDate: true,
            thresholdText: true,
            thresholdBool: true,
            checkpointValue: true,
          },
        },
        document: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
            fileUrl: true,
            fileType: true,
            fileSize: true,
            uploadedAt: true,
            isValid: true,
            expiresAt: true,
            tags: true,
            comment: true,
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return {
      serviceRequirement: newServiceRequirement,
    };
  });
