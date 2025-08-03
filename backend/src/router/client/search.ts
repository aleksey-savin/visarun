import { userReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { searchClientsWithRelatedClients } from '../../utils/clientHelpers.js';

export const zSearchClientsTrpcInput = z.object({
  query: z.string().min(1),
  limit: z.number().optional().default(50),
  offset: z.number().optional().default(0),
});

export const searchClientsTrpcRoute = userReadProcedure
  .input(zSearchClientsTrpcInput)
  .query(async ({ input, ctx }) => {
    const { query, limit, offset } = input;

    return await searchClientsWithRelatedClients(ctx.prisma, query, limit, offset);
  });
