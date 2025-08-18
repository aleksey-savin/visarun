import { clientDocumentDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const zDeleteClientDocumentTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteClientDocumentTrpcRoute = clientDocumentDeleteProcedure
  .input(zDeleteClientDocumentTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id } = input;

    // Check if client document exists
    const existingDocument = await ctx.prisma.clientDocument.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        requirement: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!existingDocument) {
      throw new Error('Client document not found');
    }

    // Delete the physical file from filesystem
    try {
      // Extract filename from fileUrl (e.g., "/uploads/client-documents/filename.pdf" -> "filename.pdf")
      const fileName = existingDocument.fileUrl.split('/').pop();
      console.log(`Attempting to delete file:`, {
        originalUrl: existingDocument.fileUrl,
        extractedFileName: fileName,
        __dirname: __dirname,
      });

      if (fileName) {
        const filePath = path.join(__dirname, '../../../uploads/client-documents', fileName);
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
        console.warn(`No filename extracted from URL: ${existingDocument.fileUrl}`);
      }
    } catch (error) {
      console.error(`Failed to delete physical file: ${existingDocument.fileUrl}`, error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete the client document from database
    await ctx.prisma.clientDocument.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Document "${existingDocument.originalName}" for client "${existingDocument.client.firstName} ${existingDocument.client.lastName}" has been deleted successfully`,
      deletedFileUrl: existingDocument.fileUrl,
    };
  });
