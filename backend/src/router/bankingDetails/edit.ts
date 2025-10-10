/*
TODO:
    Add permission in bankingDetailsUpdateProcedure
 */

import { bankingDetailsUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditBankingDetailsTrpcInput = z.object({
    id: z.string().uuid(),
    content: z.string().optional(),
    documentUrl: z.string().optional(),
});

export const editBankingDetailsTrpcRoute = bankingDetailsUpdateProcedure
    .input(zEditBankingDetailsTrpcInput)
    .mutation(async ({ input, ctx }) => {
        const { id, ...updateData } = input;

        if (!ctx.user?.id) {
            throw new Error("User must be authenticated to edit Banking Details");
        }

        // Check if banking details exists
        const existingBankingDetails = await ctx.prisma.bankingDetails.findUnique({
            where: { id },
        });

        if (!existingBankingDetails) {
            throw new Error('BankingDetails was not found');
        }

        // Content and documentUrl validation (either one or another must not be blank)
        if (!input.content && !input.documentUrl) {
            throw new Error("Either content or documentUrl must not be empty");
        }

        // Update banking details
        const bankingDetails = await ctx.prisma.bankingDetails.update({
            where: { id },
            data: updateData,
        });

        return { bankingDetails };
    });
