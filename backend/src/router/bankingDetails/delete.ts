/*
TODO:
    1. Add permission in bankingDetailsDeleteProcedure
    2. Delete document file
 */

import { bankingDetailsDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import path from 'path';
import fs from 'fs/promises';

export const zDeleteBankingDetailsTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteBankingDetailsTrpcRoute = bankingDetailsDeleteProcedure
  .input(zDeleteBankingDetailsTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if bankingDetails exists
    const existingBankingDetails = await ctx.prisma.bankingDetails.findUnique({
      where: { id: input.id },
    });

    if (!existingBankingDetails) {
      throw new Error('Banking details was not found');
    }

    // Delete the physical check file from filesystem
    if (existingBankingDetails.documentUrl) {
      try {
        // Extract filename from checkUrl (e.g., "/uploads/transactions/filename.pdf" -> "filename.pdf")
        const fileName = existingBankingDetails.documentUrl.split('/').pop();
        console.log(`Attempting to delete file:`, {
          originalUrl: existingBankingDetails.documentUrl,
          extractedFileName: fileName,
          __dirname: __dirname,
        });

        if (fileName) {
          const filePath = path.join(__dirname, '../../../uploads/banking-details', fileName);
          console.log(`Full file path to delete: ${filePath}`);

          // Check if file exists before trying to delete
          try {
            await fs.access(filePath);
            console.log(`File exists, proceeding with deletion: ${filePath}`);
          } catch (accessError) {
            console.warn(`File does not exist at path: ${filePath}`, accessError);
            throw new Error(`File not found at path: ${filePath}`);
          }

          await fs.unlink(filePath);
          console.log(`Successfully deleted file: ${filePath}`);
        } else {
          console.warn(`No filename extracted from URL: ${existingBankingDetails.documentUrl}`);
        }
      } catch (error) {
        throw new Error(
          `Failed to delete physical file: ${existingBankingDetails.documentUrl} ${error}`
        );
      }
    }

    // Delete bankingDetails
    await ctx.prisma.bankingDetails.delete({
      where: { id: input.id },
    });

    return {
      success: true,
      message: 'Banking details deleted successfully',
    };
  });
