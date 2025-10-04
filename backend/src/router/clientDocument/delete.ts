import { clientDocumentDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { deleteFile } from '../../services/s3.js';

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

    // Delete the physical file from S3 or local filesystem
    try {
      console.log(`Attempting to delete file: ${existingDocument.fileUrl}`);

      const deleteSuccess = await deleteFile(existingDocument.fileUrl);

      if (deleteSuccess) {
        console.log(`Successfully deleted file: ${existingDocument.fileUrl}`);
      } else {
        console.warn(`Failed to delete file from storage: ${existingDocument.fileUrl}`);
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
