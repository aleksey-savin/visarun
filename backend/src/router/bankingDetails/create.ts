/*
TODO:
    Add permission in bankingDetailsCreateProcedure
 */

import { bankingDetailsCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateBankingDetailsTrpcInput = z.object({
  content: z.string().nullable().optional(),
  documentUrl: z.string().nullable().optional(),
  clientId: z.string().uuid().optional(),
  currencyExchangeId: z.string().uuid().optional(),
});

export const createBankingDetailsTrpcRoute = bankingDetailsCreateProcedure
  .input(zCreateBankingDetailsTrpcInput)
  .mutation(async ({ input, ctx }) => {
    if (!ctx.user?.id) {
      throw new Error('User must be authenticated to create banking details');
    }

    if (!input.clientId && !input.currencyExchangeId) {
      throw new Error('Client id or currency exchange id must exist');
    }

    // Client existence validation
    if (input.clientId) {
      const client = await ctx.prisma.client.findUnique({
        where: { id: input.clientId },
      });

      if (!client) {
        throw new Error('Client does not exist');
      }
    }

    // Exchange existence validation
    if (input.currencyExchangeId) {
      const exchange = await ctx.prisma.currencyExchange.findUnique({
        where: { id: input.currencyExchangeId },
      });

      if (!exchange) {
        throw new Error('Currency exchange does not exist');
      }
    }

    // Content or documentUrl existence validation
    if (!input.documentUrl && !input.content) {
      throw new Error('Document url or content must be provided');
    }

    const bankingDetails = await ctx.prisma.bankingDetails.create({
      data: {
        content: input.content,
        documentUrl: input.documentUrl,
        clientId: input.clientId,
        currencyExchangeId: input.currencyExchangeId,
      },
    });

    return bankingDetails;
  });
