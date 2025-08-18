import { clientDocumentReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const zGetAllClientDocumentsTrpcInput = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  clientId: z.string().uuid().optional(),
  requirementId: z.string().uuid().optional(),
  isValid: z.boolean().optional(),
  search: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  fileType: z.string().optional(),
});

export const getAllClientDocumentsTrpcRoute = clientDocumentReadProcedure
  .input(zGetAllClientDocumentsTrpcInput)
  .query(async ({ input, ctx }) => {
    const { limit, offset, clientId, requirementId, isValid, search, tags, fileType } = input;

    // Build where clause
    const where: Prisma.ClientDocumentWhereInput = {};

    if (clientId) {
      where.clientId = clientId;
    }

    if (requirementId) {
      where.requirementId = requirementId;
    }

    if (isValid !== undefined) {
      where.isValid = isValid;
    }

    if (fileType) {
      where.fileType = {
        contains: fileType,
        mode: 'insensitive',
      };
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    if (search && search.trim()) {
      where.OR = [
        {
          fileName: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
        {
          originalName: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
        {
          comment: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
      ];
    }

    // Get total count
    const total = await ctx.prisma.clientDocument.count({
      where,
    });

    // Get client documents
    const clientDocuments = await ctx.prisma.clientDocument.findMany({
      where,
      orderBy: [{ uploadedAt: 'desc' }],
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
      take: limit,
      skip: offset,
    });

    return {
      clientDocuments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  });
