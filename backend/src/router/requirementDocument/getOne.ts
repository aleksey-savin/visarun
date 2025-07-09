import { requirementDocumentReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetOneRequirementDocumentTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getOneRequirementDocumentTrpcRoute = requirementDocumentReadProcedure
  .input(zGetOneRequirementDocumentTrpcInput)
  .query(async ({ input, ctx }) => {
    const { id } = input;

    const requirementDocument = await ctx.prisma.requirementDocument.findUnique({
      where: {
        id,
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
            operator: true,
            thresholdNumber: true,
            thresholdDate: true,
            thresholdText: true,
            thresholdBool: true,
            checkpointValue: true,
            appliesToAllCitizenships: true,
            sampleUrl: true,
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

    if (!requirementDocument) {
      throw new Error('Requirement document not found');
    }

    return {
      requirementDocument,
    };
  });
