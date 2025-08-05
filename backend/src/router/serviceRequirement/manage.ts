import {
  serviceRequirementReadProcedure,
  serviceRequirementCreateProcedure,
  serviceRequirementUpdateProcedure,
} from '../../lib/trpc.js';
import { z } from 'zod';
import {
  initializeServiceRequirements,
  getServiceRequirements,
  checkServiceReadiness,
  validateRequirementInput,
  getAvailableDocumentsForRequirement,
  type ServiceRequirementInput,
} from './utils.js';

// Initialize service requirements
export const zInitializeServiceRequirementsTrpcInput = z.object({
  serviceType: z.enum(['visa_application', 'visarun_order', 'document_service']),
  serviceId: z.string().uuid(),
  clientId: z.string().uuid().optional(),
  visaTypeId: z.string().uuid().optional(),
  citizenshipId: z.string().uuid().optional(),
});

export const initializeServiceRequirementsTrpcRoute = serviceRequirementCreateProcedure
  .input(zInitializeServiceRequirementsTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { serviceType, serviceId, clientId, visaTypeId, citizenshipId } = input;

    // Validate that service exists
    if (serviceType === 'visa_application') {
      const visaApplication = await ctx.prisma.visaApplication.findUnique({
        where: { id: serviceId },
        select: {
          id: true,
          visaTypeId: true,
          orderItem: {
            select: {
              clientId: true,
              client: {
                select: {
                  citizenshipId: true,
                },
              },
            },
          },
        },
      });

      if (!visaApplication) {
        throw new Error('Visa application not found');
      }

      // Auto-fill missing parameters from visa application
      const finalInput: ServiceRequirementInput = {
        serviceType,
        serviceId,
        clientId: clientId || visaApplication.orderItem.clientId,
        visaTypeId: visaTypeId || visaApplication.visaTypeId || undefined,
        citizenshipId: citizenshipId || visaApplication.orderItem.client.citizenshipId || undefined,
      };

      await initializeServiceRequirements(ctx.prisma, finalInput);
    } else {
      // For other service types, use provided parameters
      await initializeServiceRequirements(ctx.prisma, {
        serviceType,
        serviceId,
        clientId,
        visaTypeId,
        citizenshipId,
      });
    }

    const requirements = await getServiceRequirements(ctx.prisma, serviceType, serviceId);

    return {
      success: true,
      message: `Initialized ${requirements.length} requirements for ${serviceType}`,
      requirements,
    };
  });

// Get service requirements with status
export const zGetServiceRequirementsTrpcInput = z.object({
  serviceType: z.enum(['visa_application', 'visarun_order', 'document_service']),
  serviceId: z.string().uuid(),
});

export const getServiceRequirementsTrpcRoute = serviceRequirementReadProcedure
  .input(zGetServiceRequirementsTrpcInput)
  .query(async ({ input, ctx }) => {
    const { serviceType, serviceId } = input;

    const requirements = await getServiceRequirements(ctx.prisma, serviceType, serviceId);

    return {
      requirements,
      totalCount: requirements.length,
    };
  });

// Check service readiness
export const zCheckServiceReadinessTrpcInput = z.object({
  serviceType: z.enum(['visa_application', 'visarun_order', 'document_service']),
  serviceId: z.string().uuid(),
});

export const checkServiceReadinessTrpcRoute = serviceRequirementReadProcedure
  .input(zCheckServiceReadinessTrpcInput)
  .query(async ({ input, ctx }) => {
    const { serviceType, serviceId } = input;

    const readiness = await checkServiceReadiness(ctx.prisma, serviceType, serviceId);

    return readiness;
  });

// Validate requirement input
export const zValidateRequirementInputTrpcInput = z.object({
  serviceType: z.enum(['visa_application', 'visarun_order', 'document_service']),
  serviceId: z.string().uuid(),
  requirementId: z.string().uuid(),
  inputValue: z.union([z.string(), z.number(), z.boolean(), z.date()]),
});

export const validateRequirementInputTrpcRoute = serviceRequirementReadProcedure
  .input(zValidateRequirementInputTrpcInput)
  .query(async ({ input, ctx }) => {
    const { serviceType, serviceId, requirementId, inputValue } = input;

    const requirements = await getServiceRequirements(ctx.prisma, serviceType, serviceId);
    const requirement = requirements.find(r => r.id === requirementId);

    if (!requirement) {
      throw new Error('Requirement not found for this service');
    }

    const validation = validateRequirementInput(requirement, inputValue);

    return {
      requirement: {
        id: requirement.id,
        title: requirement.title,
        inputType: requirement.inputType,
        operator: requirement.operator,
      },
      validation,
    };
  });

// Get available documents for requirement
export const zGetAvailableDocumentsTrpcInput = z.object({
  clientId: z.string().uuid(),
  requirementId: z.string().uuid(),
});

export const getAvailableDocumentsTrpcRoute = serviceRequirementReadProcedure
  .input(zGetAvailableDocumentsTrpcInput)
  .query(async ({ input, ctx }) => {
    const { clientId, requirementId } = input;

    const documents = await getAvailableDocumentsForRequirement(
      ctx.prisma,
      clientId,
      requirementId
    );

    return {
      documents,
      totalCount: documents.length,
    };
  });

// Submit requirement fulfillment
export const zSubmitRequirementTrpcInput = z.object({
  serviceType: z.enum(['visa_application', 'visarun_order', 'document_service']),
  serviceId: z.string().uuid(),
  requirementId: z.string().uuid(),
  textValue: z.string().optional(),
  dateValue: z.date().optional(),
  booleanValue: z.boolean().optional(),
  checkpointValue: z.string().optional(),
  documentId: z.string().uuid().optional(),
  comment: z.string().optional(),
});

export const submitRequirementTrpcRoute = serviceRequirementUpdateProcedure
  .input(zSubmitRequirementTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const {
      serviceType,
      serviceId,
      requirementId,
      textValue,
      dateValue,
      booleanValue,
      checkpointValue,
      documentId,
      comment,
    } = input;

    // Get the service requirement
    const serviceRequirement = await ctx.prisma.serviceRequirement.findUnique({
      where: {
        serviceType_serviceId_requirementId: {
          serviceType,
          serviceId,
          requirementId,
        },
      },
      select: {
        id: true,
        status: true,
        requirement: {
          select: {
            id: true,
            title: true,
            inputType: true,
          },
        },
      },
    });

    if (!serviceRequirement) {
      throw new Error('Service requirement not found');
    }

    // Validate the input
    const requirements = await getServiceRequirements(ctx.prisma, serviceType, serviceId);
    const requirement = requirements.find(r => r.id === requirementId);

    if (!requirement) {
      throw new Error('Requirement not found');
    }

    // Determine the input value based on requirement type
    let inputValue: string | number | boolean | Date | undefined;
    switch (requirement.inputType) {
      case 'text':
        inputValue = textValue;
        break;
      case 'date':
        inputValue = dateValue;
        break;
      case 'boolean':
        inputValue = booleanValue;
        break;
      case 'checkpoint':
        inputValue = checkpointValue;
        break;
      case 'document':
        inputValue = documentId;
        break;
    }

    // Validate the input
    const validation = validateRequirementInput(requirement, inputValue);

    // Update the service requirement
    const updatedServiceRequirement = await ctx.prisma.serviceRequirement.update({
      where: { id: serviceRequirement.id },
      data: {
        status: validation.isValid ? 'submitted' : 'needs_revision',
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
        status: true,
        textValue: true,
        dateValue: true,
        booleanValue: true,
        checkpointValue: true,
        documentId: true,
        submittedAt: true,
        comment: true,
        requirement: {
          select: {
            id: true,
            title: true,
            description: true,
            inputType: true,
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
    });

    return {
      serviceRequirement: updatedServiceRequirement,
      validation,
      message: validation.isValid
        ? 'Requirement submitted successfully'
        : `Requirement needs revision: ${validation.message}`,
    };
  });

// Bulk submit multiple requirements
export const zBulkSubmitRequirementsTrpcInput = z.object({
  serviceType: z.enum(['visa_application', 'visarun_order', 'document_service']),
  serviceId: z.string().uuid(),
  submissions: z.array(
    z.object({
      requirementId: z.string().uuid(),
      textValue: z.string().optional(),
      dateValue: z.date().optional(),
      booleanValue: z.boolean().optional(),
      checkpointValue: z.string().optional(),
      documentId: z.string().uuid().optional(),
      comment: z.string().optional(),
    })
  ),
});

export const bulkSubmitRequirementsTrpcRoute = serviceRequirementUpdateProcedure
  .input(zBulkSubmitRequirementsTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { serviceType, serviceId, submissions } = input;

    const results = [];

    for (const submission of submissions) {
      try {
        const result = await ctx.prisma.serviceRequirement.update({
          where: {
            serviceType_serviceId_requirementId: {
              serviceType,
              serviceId,
              requirementId: submission.requirementId,
            },
          },
          data: {
            textValue: submission.textValue,
            dateValue: submission.dateValue,
            booleanValue: submission.booleanValue,
            checkpointValue: submission.checkpointValue,
            documentId: submission.documentId,
            submittedAt: new Date(),
            comment: submission.comment,
            status: 'submitted',
          },
        });
        results.push({
          requirementId: submission.requirementId,
          success: true,
          result,
        });
      } catch (error) {
        results.push({
          requirementId: submission.requirementId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return {
      results,
      summary: {
        total: submissions.length,
        successful: successCount,
        failed: failureCount,
      },
    };
  });
