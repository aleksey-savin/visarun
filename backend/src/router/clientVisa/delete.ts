import { clientVisaDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteClientVisaTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteClientVisaTrpcRoute = clientVisaDeleteProcedure
  .input(zDeleteClientVisaTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id } = input;

    // Check if client visa exists
    const existingClientVisa = await ctx.prisma.clientVisa.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        country: {
          select: {
            id: true,
            name: true,
          },
        },
        visaType: {
          select: {
            id: true,
            name: true,
          },
        },
        visaApplication: {
          select: {
            id: true,
            applicationCode: true,
            status: true,
          },
        },
      },
    });

    if (!existingClientVisa) {
      throw new Error('Client visa not found');
    }

    // Check if visa is still valid (not expired)
    const now = new Date();
    const isExpired = existingClientVisa.validTo < now;

    if (!isExpired) {
      // Only allow deletion of expired visas or with explicit confirmation
      // This is a safety measure to prevent accidental deletion of active visas
      throw new Error('Cannot delete active visa. Only expired visas can be deleted.');
    }

    // Delete client visa
    await ctx.prisma.clientVisa.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Client visa deleted successfully for ${existingClientVisa.client.firstName} ${existingClientVisa.client.lastName} - ${existingClientVisa.country.name}`,
      deletedVisa: {
        id: existingClientVisa.id,
        client: `${existingClientVisa.client.firstName} ${existingClientVisa.client.lastName}`,
        country: existingClientVisa.country.name,
        visaType: existingClientVisa.visaType.name,
        validFrom: existingClientVisa.validFrom,
        validTo: existingClientVisa.validTo,
        applicationCode: existingClientVisa.visaApplication.applicationCode,
      },
    };
  });
