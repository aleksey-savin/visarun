import { requirementDocumentReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const zGetAllRequirementDocumentsTrpcInput = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  requirementId: z.string().uuid().optional(),
  uploadedById: z.string().uuid().optional(),
});

export const getAllRequirementDocumentsTrpcRoute = requirementDocumentReadProcedure
  .input(zGetAllRequirementDocumentsTrpcInput)
  .query(async ({ input, ctx }) => {
    const { limit, offset, requirementId, uploadedById } = input;

    // Build where clause
    const where: Prisma.RequirementDocumentWhereInput = {};

    if (requirementId) {
      where.requirementId = requirementId;
    }

    if (uploadedById) {
      where.uploadedById = uploadedById;
    }

    // Get total count
    const total = await ctx.prisma.requirementDocument.count({
      where,
    });

    // Get requirement documents
    const requirementDocuments = await ctx.prisma.requirementDocument.findMany({
      where,
      select: {
        id: true,
        requirementId: true,
        fileUrl: true,
        uploadedAt: true,
        uploadedById: true,
        comment: true,
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
      orderBy: [
        {
          uploadedAt: 'desc',
        },
      ],
      take: limit,
      skip: offset,
    });

    return {
      requirementDocuments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  });
