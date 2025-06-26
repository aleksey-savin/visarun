import { visaTypeReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const zGetAllVisaTypesTrpcInput = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  countryId: z.string().uuid().optional(),
  isMultientry: z.boolean().optional(),
  processingMode: z.enum(['fixed', 'approximate']).optional(),
  processingUnit: z.enum(['hours', 'days']).optional(),
  search: z.string().optional(),
});

export const getAllVisaTypesTrpcRoute = visaTypeReadProcedure
  .input(zGetAllVisaTypesTrpcInput)
  .query(async ({ input, ctx }) => {
    const { limit, offset, countryId, isMultientry, processingMode, processingUnit, search } =
      input;

    // Build where clause
    const where: Prisma.VisaTypeWhereInput = {};

    if (countryId) {
      where.countryId = countryId;
    }

    if (isMultientry !== undefined) {
      where.isMultientry = isMultientry;
    }

    if (processingMode) {
      where.processingMode = processingMode;
    }

    if (processingUnit) {
      where.processingUnit = processingUnit;
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          country: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    // Get total count
    const total = await ctx.prisma.visaType.count({
      where,
    });

    // Get visa types
    const visaTypes = await ctx.prisma.visaType.findMany({
      where,
      include: {
        country: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            visaApplications: true,
            clientVisas: true,
          },
        },
      },
      orderBy: [{ country: { name: 'asc' } }, { name: 'asc' }],
      take: limit,
      skip: offset,
    });

    return {
      visaTypes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  });
