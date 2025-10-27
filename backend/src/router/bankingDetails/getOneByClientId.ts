/*
TODO:
    1. Check if select object is full
    2. Add permission in bankingDetailsReadProcedure
 */

import { bankingDetailsReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetOneBankingDetailsByClientIdTrpcInput = z.object({
  clientId: z.string().uuid(),
});

export const getOneBankingDetailsByClientIdTrpcRoute = bankingDetailsReadProcedure
  .input(zGetOneBankingDetailsByClientIdTrpcInput)
  .query(async ({ input, ctx }) => {
    // Check if client exists
    const client = await ctx.prisma.client.findUnique({
      where: { id: input.clientId },
    });

    if (!client) {
      throw new Error('Client was not found');
    }

    const bankingDetails = await ctx.prisma.bankingDetails.findUnique({
      where: {
        clientId: input.clientId,
      },
      select: {
        id: true,
        content: true,
        documentUrl: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!bankingDetails) {
      throw new Error('BankingDetails not found');
    }

    return { bankingDetails };
  });
