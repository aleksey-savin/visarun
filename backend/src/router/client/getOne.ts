import { userReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { getClientWithRelatedClients } from '../../utils/clientHelpers.js';

export const zGetClientTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getClientTrpcRoute = userReadProcedure
  .input(zGetClientTrpcInput)
  .query(async ({ input, ctx }) => {
    const client = await getClientWithRelatedClients(
      ctx.prisma,
      { id: input.id },
      true // Include documents
    );

    if (!client) {
      throw new Error('Client not found');
    }

    return {
      client,
    };
  });
