import { clientVisaReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const zGetClientVisasByCountryTrpcInput = z.object({
  countryId: z.string().uuid(),
  visaTypeId: z.string().uuid().optional(),
  isExpired: z.boolean().optional(),
  isExpiring: z.boolean().optional(), // expiring in next 30 days
  notifiedExpiry: z.boolean().optional(),
  includeExpired: z.boolean().default(true),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const getClientVisasByCountryTrpcRoute = clientVisaReadProcedure
  .input(zGetClientVisasByCountryTrpcInput)
  .query(async ({ input, ctx }) => {
    const {
      countryId,
      visaTypeId,
      isExpired,
      isExpiring,
      notifiedExpiry,
      includeExpired,
      limit,
      offset,
    } = input;

    // Check if country exists
    const country = await ctx.prisma.country.findUnique({
      where: { id: countryId },
      select: {
        id: true,
        name: true,
        eVisaAvailable: true,
        multivisaAvailable: true,
      },
    });

    if (!country) {
      throw new Error('Country not found');
    }

    // Build where clause
    const where: Prisma.ClientVisaWhereInput = {
      countryId,
    };

    if (visaTypeId) {
      where.visaTypeId = visaTypeId;
    }

    if (notifiedExpiry !== undefined) {
      where.notifiedExpiry = notifiedExpiry;
    }

    // Handle expired/expiring filters
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    if (isExpired === true) {
      where.validTo = { lt: now };
    } else if (isExpired === false) {
      where.validTo = { gte: now };
    }

    if (isExpiring === true) {
      where.validTo = Object.assign(where.validTo || {}, { gte: now, lte: thirtyDaysFromNow });
    }

    // Exclude expired visas if requested
    if (!includeExpired) {
      where.validTo = Object.assign(where.validTo || {}, { gte: now });
    }

    // Get total count
    const total = await ctx.prisma.clientVisa.count({
      where,
    });

    // Get client visas
    const clientVisas = await ctx.prisma.clientVisa.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            citizenship: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        visaType: {
          select: {
            id: true,
            name: true,
            serviceCost: true,
            isMultientry: true,
            multientryExtraCost: true,
          },
        },
        visaApplication: {
          select: {
            id: true,
            applicationCode: true,
            status: true,
            submittedByAgent: true,
          },
        },
      },
      orderBy: [{ validTo: 'asc' }, { validFrom: 'desc' }, { client: { firstName: 'asc' } }],
      take: limit,
      skip: offset,
    });

    // Calculate expiry information for each visa
    const clientVisasWithExpiry = clientVisas.map(visa => {
      const daysUntilExpiry = Math.ceil(
        (visa.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const isExpired = daysUntilExpiry < 0;
      const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry >= 0;

      return {
        ...visa,
        daysUntilExpiry,
        isExpired,
        isExpiringSoon,
      };
    });

    // Group visas by visa type for better organization
    const visasByType = clientVisasWithExpiry.reduce(
      (acc, visa) => {
        const typeName = visa.visaType.name;
        if (!acc[typeName]) {
          acc[typeName] = [];
        }
        acc[typeName].push(visa);
        return acc;
      },
      {} as Record<string, typeof clientVisasWithExpiry>
    );

    // Calculate summary statistics
    const activeVisas = clientVisasWithExpiry.filter(v => !v.isExpired);
    const expiringVisas = clientVisasWithExpiry.filter(v => v.isExpiringSoon);
    const expiredVisas = clientVisasWithExpiry.filter(v => v.isExpired);
    const unnotifiedExpiringVisas = expiringVisas.filter(v => !v.notifiedExpiry);

    return {
      country,
      clientVisas: clientVisasWithExpiry,
      visasByType,
      summary: {
        total: clientVisasWithExpiry.length,
        active: activeVisas.length,
        expiring: expiringVisas.length,
        expired: expiredVisas.length,
        unnotifiedExpiring: unnotifiedExpiringVisas.length,
        visaTypes: Object.keys(visasByType).length,
      },
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  });
