import { clientRequirementReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const zGetAllClientRequirementsTrpcInput = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  clientId: z.string().uuid().optional(),
  requirementId: z.string().uuid().optional(),
  hasValue: z.boolean().optional(),
  isSubmitted: z.boolean().optional(),
  isReviewed: z.boolean().optional(),
  reviewedById: z.string().uuid().optional(),
  search: z.string().min(1).optional(),
  includeStats: z.boolean().default(false),
});

export const getAllClientRequirementsTrpcRoute = clientRequirementReadProcedure
  .input(zGetAllClientRequirementsTrpcInput)
  .query(async ({ input, ctx }) => {
    const {
      limit,
      offset,
      clientId,
      requirementId,
      hasValue,
      isSubmitted,
      isReviewed,
      reviewedById,
      search,
      includeStats,
    } = input;

    if (!ctx.user) {
      throw new Error('User not authenticated');
    }

    // Build where clause
    const where: Prisma.ClientRequirementWhereInput = {};

    if (clientId) {
      where.clientId = clientId;
    }

    if (requirementId) {
      where.requirementId = requirementId;
    }

    if (hasValue !== undefined) {
      if (hasValue) {
        where.OR = [
          { textValue: { not: null } },
          { dateValue: { not: null } },
          { booleanValue: { not: null } },
          { checkpointValue: { not: null } },
        ];
      } else {
        where.AND = [
          { textValue: null },
          { dateValue: null },
          { booleanValue: null },
          { checkpointValue: null },
        ];
      }
    }

    if (isSubmitted !== undefined) {
      if (isSubmitted) {
        where.submittedAt = { not: null };
      } else {
        where.submittedAt = null;
      }
    }

    if (isReviewed !== undefined) {
      if (isReviewed) {
        where.reviewedAt = { not: null };
      } else {
        where.reviewedAt = null;
      }
    }

    if (reviewedById) {
      where.reviewedById = reviewedById;
    }

    if (search && search.trim()) {
      where.OR = [
        {
          textValue: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
        {
          checkpointValue: {
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
        {
          client: {
            OR: [
              {
                firstName: {
                  contains: search.trim(),
                  mode: 'insensitive',
                },
              },
              {
                lastName: {
                  contains: search.trim(),
                  mode: 'insensitive',
                },
              },
            ],
          },
        },
        {
          requirement: {
            OR: [
              {
                title: {
                  contains: search.trim(),
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: search.trim(),
                  mode: 'insensitive',
                },
              },
            ],
          },
        },
      ];
    }

    // Get total count
    const total = await ctx.prisma.clientRequirement.count({
      where,
    });

    // Get client requirements
    const clientRequirements = await ctx.prisma.clientRequirement.findMany({
      where,
      orderBy: [{ requirement: { title: 'asc' } }, { submittedAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        clientId: true,
        requirementId: true,
        textValue: true,
        dateValue: true,
        booleanValue: true,
        checkpointValue: true,
        submittedAt: true,
        reviewedAt: true,
        reviewedById: true,
        comment: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            citizenship: {
              select: {
                id: true,
                name: true,
                abbreviation: true,
                emoji: true,
              },
            },
          },
        },
        requirement: {
          select: {
            id: true,
            title: true,
            description: true,
            serviceType: true,
            inputType: true,
            isOptional: true,
          },
        },
        reviewedBy: {
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

    // Calculate statistics if requested
    let stats = undefined;
    if (includeStats) {
      stats = {
        total: clientRequirements.length,
        completed: clientRequirements.filter(
          cr =>
            cr.textValue !== null ||
            cr.dateValue !== null ||
            cr.booleanValue !== null ||
            cr.checkpointValue !== null
        ).length,
        submitted: clientRequirements.filter(cr => cr.submittedAt !== null).length,
        reviewed: clientRequirements.filter(cr => cr.reviewedAt !== null).length,
        pending: clientRequirements.filter(cr => cr.submittedAt !== null && cr.reviewedAt === null)
          .length,
        required: clientRequirements.filter(cr => !cr.requirement.isOptional).length,
      };
    }

    return {
      clientRequirements,
      stats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  });
