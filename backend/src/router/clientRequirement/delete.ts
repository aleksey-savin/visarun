import { clientRequirementDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteClientRequirementTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteClientRequirementTrpcRoute = clientRequirementDeleteProcedure
  .input(zDeleteClientRequirementTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id } = input;

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
        client: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        requirement: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!existingClientRequirement) {
      throw new Error('Client requirement not found');
    }

    // Delete the client requirement
    await ctx.prisma.clientRequirement.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Client requirement deleted successfully`,
      deletedClientRequirement: {
        id: existingClientRequirement.id,
        clientName: `${existingClientRequirement.client.firstName} ${existingClientRequirement.client.lastName}`,
        requirementTitle: existingClientRequirement.requirement.title,
      },
    };
  });
