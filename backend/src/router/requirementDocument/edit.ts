import { requirementDocumentUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditRequirementDocumentTrpcInput = z.object({
  id: z.string().uuid(),
  fileUrl: z.string().min(1).optional(),
  comment: z.string().optional(),
});

export const editRequirementDocumentTrpcRoute = requirementDocumentUpdateProcedure
  .input(zEditRequirementDocumentTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, fileUrl, comment } = input;

    if (!ctx.user) {
      throw new Error('User not authenticated');
    }

    // Check if requirement document exists
    const existingDocument = await ctx.prisma.requirementDocument.findUnique({
      where: { id },
      select: {
        id: true,
        requirementId: true,
        fileUrl: true,
        uploadedById: true,
        requirement: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!existingDocument) {
      throw new Error('Requirement document not found');
    }

    // Validate file URL format if provided
    if (fileUrl && !fileUrl.startsWith('/uploads/')) {
      throw new Error('Invalid file URL format');
    }

    // Prepare update data
    const updateData: {
      fileUrl?: string;
      comment?: string;
    } = {};

    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
    if (comment !== undefined) updateData.comment = comment;

    // Update the requirement document
    const updatedDocument = await ctx.prisma.requirementDocument.update({
      where: { id },
      data: updateData,
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
      requirementDocument: updatedDocument,
    };
  });
