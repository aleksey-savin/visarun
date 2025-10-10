/*
TODO:
    1. Check if select object is full
    2. Add permission in bankingDetailsReadProcedure
 */

import { bankingDetailsReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetOneBankingDetailsTrpcInput = z.object({
    id: z.string().uuid(),
});

export const getOneBankingDetailsTrpcRoute = bankingDetailsReadProcedure
    .input(zGetOneBankingDetailsTrpcInput)
    .query(async ({ input, ctx }) => {
        const bankingDetails = await ctx.prisma.bankingDetails.findUnique({
            where: { id: input.id },
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
