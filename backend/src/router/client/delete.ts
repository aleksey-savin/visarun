import { userDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { removePrimaryClient } from '../../utils/clientPrimary.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const zDeleteClientTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteClientTrpcRoute = userDeleteProcedure
  .input(zDeleteClientTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id } = input;

    // Check if client exists
    const existingClient = await ctx.prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        isPrimary: true,
        documents: {
          select: {
            id: true,
            fileUrl: true,
            originalName: true,
          },
        },
      },
    });

    if (!existingClient) {
      throw new Error('Client not found');
    }

    // If this is a primary client, handle the primary status transfer
    if (existingClient.isPrimary && existingClient.userId) {
      await removePrimaryClient(ctx.prisma, id);
    }

    // Delete all associated documents first
    if (existingClient.documents.length > 0) {
      // Delete physical files from filesystem
      for (const document of existingClient.documents) {
        try {
          const fileName = document.fileUrl.split('/').pop();
          if (fileName) {
            const filePath = path.join(__dirname, '../../../uploads/client-documents', fileName);
            await fs.unlink(filePath);
          }
        } catch (error) {
          console.warn(`Failed to delete physical file: ${document.fileUrl}`, error);
          // Continue with deletion even if file deletion fails
        }
      }

      // Delete documents from database
      await ctx.prisma.clientDocument.deleteMany({
        where: { clientId: id },
      });
    }

    // Delete the client
    await ctx.prisma.client.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Client deleted successfully',
    };
  });
