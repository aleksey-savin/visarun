/*
TODO:
    Add permission in bankingDetailsCreateProcedure
 */

import { bankingDetailsCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateBankingDetailsTrpcInput = z.object({
    content: z.string().optional(),
    documentUrl: z.string().optional(),
    clientId: z.string().uuid(),
});

export const createBankingDetailsTrpcRoute = bankingDetailsCreateProcedure
    .input(zCreateBankingDetailsTrpcInput)
    .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) {
            throw new Error("User must be authenticated to create banking details");
        }

        // Client existence validation
        const client = await ctx.prisma.client.findUnique({
            where: { id: input.clientId },
        });

        if (!client) {
            throw new Error("Client does not exist");
        }

        // Content and documentUrl validation (either one or another must not be blank)
        if (!input.content && !input.documentUrl) {
            throw new Error("Either content or documentUrl must not be empty");
        }

        const bankingDetails = await ctx.prisma.bankingDetails.create({
            data: {
                content: input.content,
                documentUrl: input.documentUrl,
                clientId: input.clientId,
            },
        });

        return bankingDetails;
    });
