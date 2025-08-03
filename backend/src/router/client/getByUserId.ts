import { userReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { getClientWithRelatedClients } from '../../utils/clientHelpers.js';

export const zGetClientByUserIdTrpcInput = z.object({
  userId: z.string().uuid(),
});

export const getClientByUserIdTrpcRoute = userReadProcedure
  .input(zGetClientByUserIdTrpcInput)
  .query(async ({ input, ctx }) => {
    const client = await getClientWithRelatedClients(
      ctx.prisma,
      { userId: input.userId },
      true // Include documents
    );

    return {
      client,
    };
  });
