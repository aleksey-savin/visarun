import { clientDocumentDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

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
      select: {
        id: true,
        fileName: true,
        originalName: true,
        fileUrl: true,
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
        _count: {
          select: {
            serviceRequirements: true,
          },
        },
      },
    });

    if (!existingDocument) {
      throw new Error('Client document not found');
    }

    // Check if document is being used in any service requirements
    if (existingDocument._count.serviceRequirements > 0) {
      throw new Error('Cannot delete document that is being used in service requirements');
    }

    // Delete the client document
    await ctx.prisma.clientDocument.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Document "${existingDocument.originalName}" for client "${existingDocument.client.firstName} ${existingDocument.client.lastName}" has been deleted successfully`,
      deletedFileUrl: existingDocument.fileUrl,
    };
  });
