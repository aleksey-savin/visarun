import { userReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import {
  addRelatedClientsToClientList,
  clientSelectFieldsWithDocuments,
} from '../../utils/clientHelpers.js';

export const zGetAllClientsByUserIdTrpcInput = z.object({
  userId: z.string().uuid(),
});

export const getAllClientsByUserIdTrpcRoute = userReadProcedure
  .input(zGetAllClientsByUserIdTrpcInput)
  .query(async ({ input, ctx }) => {
    const clients = await ctx.prisma.client.findMany({
      where: { userId: input.userId },
      select: clientSelectFieldsWithDocuments,
      orderBy: {
        firstName: 'asc',
      },
    });

    const clientsWithRelatedClients = await addRelatedClientsToClientList(ctx.prisma, clients);

    return {
      clients: clientsWithRelatedClients,
    };
  });
