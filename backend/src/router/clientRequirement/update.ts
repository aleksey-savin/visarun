import { clientRequirementUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zUpdateClientRequirementTrpcInput = z.object({
  id: z.string().uuid(),
  textValue: z.string().optional().nullable(),
  dateValue: z.date().optional().nullable(),
  booleanValue: z.boolean().optional().nullable(),
  checkpointValue: z.string().optional().nullable(),
  submittedAt: z.date().optional().nullable(),
  reviewedAt: z.date().optional().nullable(),
  reviewedById: z.string().uuid().optional().nullable(),
  comment: z.string().optional().nullable(),
});

export const updateClientRequirementTrpcRoute = clientRequirementUpdateProcedure
  .input(zUpdateClientRequirementTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, reviewedById, ...updateData } = input;

    if (!ctx.user) {
      throw new Error('User not authenticated');
    }

    // Check if client requirement exists
    const existingClientRequirement = await ctx.prisma.clientRequirement.findUnique({
      where: { id },
      select: {
        id: true,
        clientId: true,
        requirementId: true,
      },
    });

    if (!existingClientRequirement) {
      throw new Error('Client requirement not found');
    }

    // Check if reviewedBy user exists if provided
    if (reviewedById) {
      const reviewedByUser = await ctx.prisma.user.findUnique({
        where: { id: reviewedById },
        select: { id: true },
      });

      if (!reviewedByUser) {
        throw new Error('Reviewed by user not found');
      }
    }

    // Update the client requirement
    const updatedClientRequirement = await ctx.prisma.clientRequirement.update({
      where: { id },
      data: {
        ...updateData,
        reviewedById,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        requirement: {
          select: {
            id: true,
            title: true,
            description: true,
            serviceType: true,
            inputType: true,
            isOptional: true,
            operator: true,
            thresholdNumber: true,
            thresholdDate: true,
            thresholdText: true,
            thresholdBool: true,
            checkpointValue: true,
            appliesToAllCitizenships: true,
            sampleUrl: true,
            applicableServices: true,
            applicationScope: true,
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
      clientRequirement: updatedClientRequirement,
    };
  });
