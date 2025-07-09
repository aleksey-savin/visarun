import { requirementDocumentCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateRequirementDocumentTrpcInput = z.object({
  requirementId: z.string().uuid(),
  fileUrl: z.string().min(1),
  comment: z.string().optional(),
});

export const createRequirementDocumentTrpcRoute = requirementDocumentCreateProcedure
  .input(zCreateRequirementDocumentTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { requirementId, fileUrl, comment } = input;

    if (!ctx.user) {
      throw new Error('User not authenticated');
    }

    // Check if requirement exists
    const existingRequirement = await ctx.prisma.requirement.findUnique({
      where: { id: requirementId },
      select: {
        id: true,
        title: true,
        inputType: true,
      },
    });

    if (!existingRequirement) {
      throw new Error('Requirement not found');
    }

    // Validate file URL format
    if (!fileUrl.startsWith('/uploads/')) {
      throw new Error('Invalid file URL format');
    }

    // Create the requirement document
    const newRequirementDocument = await ctx.prisma.requirementDocument.create({
      data: {
        requirementId,
        fileUrl,
        uploadedById: ctx.user.id,
        uploadedAt: new Date(),
        comment,
      },
      select: {
        id: true,
        requirementId: true,
        fileUrl: true,
        uploadedAt: true,
        uploadedById: true,
        comment: true,
        requirement: {
          select: {
            id: true,
            title: true,
            description: true,
            serviceType: true,
            inputType: true,
          },
        },
        uploadedBy: {
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
      requirementDocument: newRequirementDocument,
    };
  });
