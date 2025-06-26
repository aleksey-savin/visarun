import { clientVisaReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const zGetExpiringClientVisasTrpcInput = z.object({
  daysAhead: z.number().int().min(1).max(365).default(30),
  countryId: z.string().uuid().optional(),
  visaTypeId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  notifiedExpiry: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const getExpiringClientVisasTrpcRoute = clientVisaReadProcedure
  .input(zGetExpiringClientVisasTrpcInput)
  .query(async ({ input, ctx }) => {
    const { daysAhead, countryId, visaTypeId, clientId, notifiedExpiry, limit, offset } = input;

    // Calculate date range for expiring visas
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(now.getDate() + daysAhead);

    // Build where clause
    const where: Prisma.ClientVisaWhereInput = {
      validTo: {
        gte: now,
        lte: expiryDate,
      },
    };

    if (countryId) {
      where.countryId = countryId;
    }

    if (visaTypeId) {
      where.visaTypeId = visaTypeId;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (notifiedExpiry !== undefined) {
      where.notifiedExpiry = notifiedExpiry;
    }

    // Get total count
    const total = await ctx.prisma.clientVisa.count({
      where,
    });

    // Get expiring client visas
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
        country: {
          select: {
            id: true,
            name: true,
            eVisaAvailable: true,
            multivisaAvailable: true,
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
      orderBy: [{ validTo: 'asc' }, { client: { firstName: 'asc' } }],
      take: limit,
      skip: offset,
    });

    // Calculate expiry information for each visa
    const clientVisasWithExpiry = clientVisas.map(visa => {
      const daysUntilExpiry = Math.ceil(
        (visa.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const isExpired = daysUntilExpiry < 0;
      const isExpiringSoon = daysUntilExpiry <= daysAhead && daysUntilExpiry >= 0;

      // Determine urgency level
      let urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
      if (daysUntilExpiry <= 7) {
        urgencyLevel = 'critical';
      } else if (daysUntilExpiry <= 14) {
        urgencyLevel = 'high';
      } else if (daysUntilExpiry <= 21) {
        urgencyLevel = 'medium';
      } else {
        urgencyLevel = 'low';
      }

      return {
        ...visa,
        daysUntilExpiry,
        isExpired,
        isExpiringSoon,
        urgencyLevel,
      };
    });

    // Group visas by urgency level
    const visasByUrgency = {
      critical: clientVisasWithExpiry.filter(v => v.urgencyLevel === 'critical'),
      high: clientVisasWithExpiry.filter(v => v.urgencyLevel === 'high'),
      medium: clientVisasWithExpiry.filter(v => v.urgencyLevel === 'medium'),
      low: clientVisasWithExpiry.filter(v => v.urgencyLevel === 'low'),
    };

    // Group visas by country
    const visasByCountry = clientVisasWithExpiry.reduce(
      (acc, visa) => {
        const countryName = visa.country.name;
        if (!acc[countryName]) {
          acc[countryName] = [];
        }
        acc[countryName].push(visa);
        return acc;
      },
      {} as Record<string, typeof clientVisasWithExpiry>
    );

    // Calculate summary statistics
    const unnotifiedVisas = clientVisasWithExpiry.filter(v => !v.notifiedExpiry);
    const criticalVisas = visasByUrgency.critical;
    const highPriorityVisas = visasByUrgency.high;

    return {
      clientVisas: clientVisasWithExpiry,
      visasByUrgency,
      visasByCountry,
      filters: {
        daysAhead,
        countryId,
        visaTypeId,
        clientId,
        notifiedExpiry,
      },
      summary: {
        total: clientVisasWithExpiry.length,
        unnotified: unnotifiedVisas.length,
        critical: criticalVisas.length,
        high: highPriorityVisas.length,
        medium: visasByUrgency.medium.length,
        low: visasByUrgency.low.length,
        countries: Object.keys(visasByCountry).length,
      },
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  });
