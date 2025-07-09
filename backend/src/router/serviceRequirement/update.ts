import { serviceRequirementUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zUpdateServiceRequirementTrpcInput = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'submitted', 'approved', 'rejected', 'needs_revision']).optional(),
  textValue: z.string().optional(),
  dateValue: z.date().optional(),
  booleanValue: z.boolean().optional(),
  checkpointValue: z.string().optional(),
  documentId: z.string().uuid().optional(),
  comment: z.string().optional(),
});

export const updateServiceRequirementTrpcRoute = serviceRequirementUpdateProcedure
  .input(zUpdateServiceRequirementTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, status, textValue, dateValue, booleanValue, checkpointValue, documentId, comment } =
      input;

    if (!ctx.user) {
      throw new Error('User not authenticated');
    }

    // Check if service requirement exists
    const existingServiceRequirement = await ctx.prisma.serviceRequirement.findUnique({
      where: { id },
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

    if (!existingServiceRequirement) {
      throw new Error('Service requirement not found');
    }

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

    // Validate input based on requirement type
    const inputType = existingServiceRequirement.requirement.inputType;

    if (inputType === 'document' && documentId === undefined && status === 'submitted') {
      throw new Error('Document ID is required for document type requirements');
    }

    if (inputType === 'text' && textValue === undefined && status === 'submitted') {
      throw new Error('Text value is required for text type requirements');
    }

    if (inputType === 'date' && dateValue === undefined && status === 'submitted') {
      throw new Error('Date value is required for date type requirements');
    }

    if (inputType === 'boolean' && booleanValue === undefined && status === 'submitted') {
      throw new Error('Boolean value is required for boolean type requirements');
    }

    if (inputType === 'checkpoint' && checkpointValue === undefined && status === 'submitted') {
      throw new Error('Checkpoint value is required for checkpoint type requirements');
    }

    // Prepare update data
    const updateData: {
      status?: 'pending' | 'submitted' | 'approved' | 'rejected' | 'needs_revision';
      submittedAt?: Date;
      reviewedAt?: Date;
      reviewedById?: string;
      textValue?: string;
      dateValue?: Date;
      booleanValue?: boolean;
      checkpointValue?: string;
      documentId?: string;
      comment?: string;
    } = {};

    if (status !== undefined) {
      updateData.status = status;

      // Update timestamps based on status
      if (status === 'submitted') {
        updateData.submittedAt = new Date();
      } else if (['approved', 'rejected'].includes(status)) {
        updateData.reviewedAt = new Date();
        updateData.reviewedById = ctx.user.id;
      }
    }

    if (textValue !== undefined) updateData.textValue = textValue;
    if (dateValue !== undefined) updateData.dateValue = dateValue;
    if (booleanValue !== undefined) updateData.booleanValue = booleanValue;
    if (checkpointValue !== undefined) updateData.checkpointValue = checkpointValue;
    if (documentId !== undefined) updateData.documentId = documentId;
    if (comment !== undefined) updateData.comment = comment;

    // Update the service requirement
    const updatedServiceRequirement = await ctx.prisma.serviceRequirement.update({
      where: { id },
      data: updateData,
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
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      serviceRequirement: updatedServiceRequirement,
    };
  });
