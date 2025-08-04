import { visaTypeReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const zGetVisaTypesByCountryTrpcInput = z.object({
  countryId: z.string().uuid(),
  isMultientry: z.boolean().optional(),
  favourite: z.boolean().optional(),
  processingMode: z.enum(['fixed', 'approximate']).optional(),
  processingUnit: z.enum(['hours', 'days']).optional(),
});

export const getVisaTypesByCountryTrpcRoute = visaTypeReadProcedure
  .input(zGetVisaTypesByCountryTrpcInput)
  .query(async ({ input, ctx }) => {
    const { countryId, isMultientry, favourite, processingMode, processingUnit } = input;

    // Check if country exists
    const country = await ctx.prisma.country.findUnique({
      where: { id: countryId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!country) {
      throw new Error('Country not found');
    }

    // Build where clause
    const where: Prisma.VisaTypeWhereInput = {
      countryId,
    };

    if (isMultientry !== undefined) {
      where.isMultientry = isMultientry;
    }

    if (favourite !== undefined) {
      where.favourite = favourite;
    }

    if (processingMode) {
      where.processingMode = processingMode;
    }

    if (processingUnit) {
      where.processingUnit = processingUnit;
    }

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
      orderBy: {
        name: 'asc',
      },
    });

    return {
      country,
      visaTypes,
    };
  });
