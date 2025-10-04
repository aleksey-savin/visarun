import { requirementDocumentDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { deleteFile } from '../../services/s3.js';

export const zDeleteRequirementDocumentTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteRequirementDocumentTrpcRoute = requirementDocumentDeleteProcedure
  .input(zDeleteRequirementDocumentTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id } = input;

    // Check if requirement document exists
    const existingDocument = await ctx.prisma.requirementDocument.findUnique({
      where: { id },
      select: {
        id: true,
        fileUrl: true,
        requirement: {
          select: {
            id: true,
            title: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!existingDocument) {
      throw new Error('Requirement document not found');
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

    // Delete the requirement document
    await ctx.prisma.requirementDocument.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Document for requirement "${existingDocument.requirement.title}" has been deleted successfully`,
      deletedFileUrl: existingDocument.fileUrl,
    };
  });
