import { clientRequirementReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetOneClientRequirementTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getOneClientRequirementTrpcRoute = clientRequirementReadProcedure
  .input(zGetOneClientRequirementTrpcInput)
  .query(async ({ input, ctx }) => {
    const { id } = input;

    if (!ctx.user) {
      throw new Error('User not authenticated');
    }

    // Get the client requirement with all related data
    const clientRequirement = await ctx.prisma.clientRequirement.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userId: true,
            citizenshipId: true,
            citizenship: {
              select: {
                id: true,
                name: true,
                abbreviation: true,
                emoji: true,
              },
            },
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

    if (!clientRequirement) {
      throw new Error('Client requirement not found');
    }

    return {
      clientRequirement,
    };
  });
