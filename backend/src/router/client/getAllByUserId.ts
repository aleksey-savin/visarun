import { userReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import {
  addRelatedClientsToClientList,
  // clientSelectFieldsWithDocuments,
} from '../../utils/clientHelpers.js';

export const zGetAllClientsByUserIdTrpcInput = z.object({
  userId: z.string().uuid(),
});

export const getAllClientsByUserIdTrpcRoute = userReadProcedure
  .input(zGetAllClientsByUserIdTrpcInput)
  .query(async ({ input, ctx }) => {
    const clients = await ctx.prisma.client.findMany({
      where: { userId: input.userId },
      include: {
        bankingDetails: true,
        citizenship: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
            favourite: true,
            emoji: true,
            blacklisted: true,
            surcharges: true,
            visaFree: true,
            RequirementCitizenship: true,
          },
        },
      },
      orderBy: {
        firstName: 'asc',
      },
    });

    const clientsWithRelatedClients = await addRelatedClientsToClientList(ctx.prisma, clients);

    return {
      clients: clientsWithRelatedClients,
    };
  });
