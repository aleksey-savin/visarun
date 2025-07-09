import { clientDocumentCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateClientDocumentTrpcInput = z.object({
  clientId: z.string().uuid(),
  requirementId: z.string().uuid().optional(),
  fileName: z.string().min(1),
  originalName: z.string().min(1),
  fileUrl: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().int().min(1),
  expiresAt: z.date().optional(),
  tags: z.array(z.string()).optional(),
  comment: z.string().optional(),
});

export const createClientDocumentTrpcRoute = clientDocumentCreateProcedure
  .input(zCreateClientDocumentTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const {
      clientId,
      requirementId,
      fileName,
      originalName,
      fileUrl,
      fileType,
      fileSize,
      expiresAt,
      tags,
      comment,
    } = input;

    if (!ctx.user) {
      throw new Error('User not authenticated');
    }

    // Check if client exists
    const existingClient = await ctx.prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!existingClient) {
      throw new Error('Client not found');
    }

    // Check if requirement exists (if provided)
    if (requirementId) {
      const existingRequirement = await ctx.prisma.requirement.findUnique({
        where: { id: requirementId },
        select: {
          id: true,
          title: true,
        },
      });

      if (!existingRequirement) {
        throw new Error('Requirement not found');
      }
    }

    // Validate file URL format
    if (!fileUrl.startsWith('/uploads/')) {
      throw new Error('Invalid file URL format');
    }

    // Create the client document
    const newClientDocument = await ctx.prisma.clientDocument.create({
      data: {
        clientId,
        requirementId,
        fileName,
        originalName,
        fileUrl,
        fileType,
        fileSize,
        uploadedById: ctx.user.id,
        expiresAt,
        tags: tags || [],
        comment,
      },
      select: {
        id: true,
        clientId: true,
        requirementId: true,
        fileName: true,
        originalName: true,
        fileUrl: true,
        fileType: true,
        fileSize: true,
        uploadedAt: true,
        uploadedById: true,
        isValid: true,
        expiresAt: true,
        tags: true,
        comment: true,
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
            description: true,
            serviceType: true,
            inputType: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      clientDocument: newClientDocument,
    };
  });
