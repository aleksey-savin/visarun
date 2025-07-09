import { requirementDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteRequirementTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteRequirementTrpcRoute = requirementDeleteProcedure
  .input(zDeleteRequirementTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id } = input;

    // Check if requirement exists
    const existingRequirement = await ctx.prisma.requirement.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            documents: true,
            citizenships: true,
            visaTypeLinks: true,
            routeLinks: true,
          },
        },
      },
    });

    if (!existingRequirement) {
      throw new Error('Requirement not found');
    }

    // Delete the requirement and all related data in a transaction
    await ctx.prisma.$transaction(async tx => {
      // Delete requirement documents
      await tx.requirementDocument.deleteMany({
        where: {
          requirementId: id,
        },
      });

      // Delete requirement citizenship relations
      await tx.requirementCitizenship.deleteMany({
        where: {
          requirementId: id,
        },
      });

      // Delete requirement visa type relations
      await tx.requirementVisaType.deleteMany({
        where: {
          requirementId: id,
        },
      });

      // Delete requirement visarun route relations
      await tx.requirementVisarunRoute.deleteMany({
        where: {
          requirementId: id,
        },
      });

      // Finally, delete the requirement itself
      await tx.requirement.delete({
        where: { id },
      });
    });

    return {
      success: true,
      message: `Requirement "${existingRequirement.title}" has been deleted successfully`,
    };
  });
