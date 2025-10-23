/*
TODO:
    1. Add permission in transactionDeleteProcedure
    2. Delete check file
 */


import { transactionDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import path from 'path';
import fs from 'fs/promises';

export const zDeleteTransactionTrpcInput = z.object({
    id: z.string().uuid(),
});

export const deleteTransactionTrpcRoute = transactionDeleteProcedure
    .input(zDeleteTransactionTrpcInput)
    .mutation(async ({ input, ctx }) => {
        // Check if transaction exists
        const existingTransaction = await ctx.prisma.transaction.findUnique({
            where: { id: input.id },
        });

        if (!existingTransaction) {
            throw new Error('Transaction was not found');
        }

        // Delete the physical check file from filesystem
        // try {
        //     // Extract filename from checkUrl (e.g., "/uploads/transactions/filename.pdf" -> "filename.pdf")
        //     const fileName = existingTransaction.checkUrl.split('/').pop();
        //     console.log(`Attempting to delete file:`, {
        //         originalUrl: existingTransaction.checkUrl,
        //         extractedFileName: fileName,
        //         __dirname: __dirname,
        //     });
        //
        //     if (fileName) {
        //         const filePath = path.join(__dirname, '../../../uploads/transactions', fileName);
        //         console.log(`Full file path to delete: ${filePath}`);
        //
        //         // Check if file exists before trying to delete
        //         try {
        //             await fs.access(filePath);
        //             console.log(`File exists, proceeding with deletion: ${filePath}`);
        //         } catch (accessError) {
        //             console.warn(`File does not exist at path: ${filePath}`, accessError);
        //             throw new Error(`File not found at path: ${filePath}`);
        //         }
        //
        //         await fs.unlink(filePath);
        //         console.log(`Successfully deleted file: ${filePath}`);
        //     } else {
        //         console.warn(`No filename extracted from URL: ${existingTransaction.checkUrl}`);
        //     }
        // } catch (error) {
        //     throw new Error(`Failed to delete physical file: ${existingTransaction.checkUrl} ${error}`);
        // }

        // Delete the transaction
        await ctx.prisma.transaction.delete({
            where: { id: input.id },
        });

        return {
            success: true,
            message: 'Transaction deleted successfully',
        };
    });
