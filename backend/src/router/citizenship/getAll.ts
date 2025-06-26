import { citizenshipReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const zGetAllCitizenshipsTrpcInput = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  search: z.string().min(1).optional(),
  favourite: z.boolean().optional(),
});

export const getAllCitizenshipsTrpcRoute = citizenshipReadProcedure
  .input(zGetAllCitizenshipsTrpcInput)
  .query(async ({ input, ctx }) => {
    const { limit, offset, search, favourite } = input;

    // Build where clause
    const where: Prisma.CitizenshipWhereInput = {};

    if (favourite !== undefined) {
      where.favourite = favourite;
    }

    if (search && search.trim()) {
      where.name = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    // Get total count
    const total = await ctx.prisma.citizenship.count({
      where,
    });

    // Get citizenships
    const citizenships = await ctx.prisma.citizenship.findMany({
      where,
      orderBy: [{ favourite: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        favourite: true,
        _count: {
          select: {
            visaFree: true,
            blacklisted: true,
            surcharges: true,
          },
        },
      },
      take: limit,
      skip: offset,
    });

    return {
      citizenships,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  });
