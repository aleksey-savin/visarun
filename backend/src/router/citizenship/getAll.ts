import { citizenshipReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const zGetAllCitizenshipsTrpcInput = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).default(0),
  search: z.string().optional(),
  favourite: z.boolean().optional(),
  citizenshipId: z.string().uuid().optional(),
});

export const getAllCitizenshipsTrpcRoute = citizenshipReadProcedure
  .input(zGetAllCitizenshipsTrpcInput)
  .query(async ({ input, ctx }) => {
    const { limit, offset, search, favourite, citizenshipId } = input;

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
    let citizenships = await ctx.prisma.citizenship.findMany({
      where,
      orderBy: [{ favourite: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        emoji: true,
        abbreviation: true,
        favourite: true,
        _count: {
          select: {
            visaFree: true,
            blacklisted: true,
            surcharges: true,
          },
        },
      },
      ...(limit && { take: limit }),
      skip: offset,
    });

    // If citizenshipId is provided and not already in results, fetch and prepend it
    if (citizenshipId && !citizenships.some(c => c.id === citizenshipId)) {
      const specificCitizenship = await ctx.prisma.citizenship.findUnique({
        where: { id: citizenshipId },
        select: {
          id: true,
          name: true,
          emoji: true,
          abbreviation: true,
          favourite: true,
          _count: {
            select: {
              visaFree: true,
              blacklisted: true,
              surcharges: true,
            },
          },
        },
      });

      if (specificCitizenship) {
        citizenships = [specificCitizenship, ...citizenships];
      }
    }

    return {
      citizenships,
      pagination: {
        total,
        limit: limit || total,
        offset,
        hasMore: limit ? offset + limit < total : false,
      },
    };
  });
