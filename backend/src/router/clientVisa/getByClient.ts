import { clientVisaReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const zGetClientVisasByClientTrpcInput = z.object({
  clientId: z.string().uuid(),
  countryId: z.string().uuid().optional(),
  visaTypeId: z.string().uuid().optional(),
  isExpired: z.boolean().optional(),
  isExpiring: z.boolean().optional(), // expiring in next 30 days
  includeExpired: z.boolean().default(true),
});

export const getClientVisasByClientTrpcRoute = clientVisaReadProcedure
  .input(zGetClientVisasByClientTrpcInput)
  .query(async ({ input, ctx }) => {
    const { clientId, countryId, visaTypeId, isExpired, isExpiring, includeExpired } = input;

    // Check if client exists
    const client = await ctx.prisma.client.findUnique({
      where: { id: clientId },
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
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Build where clause
    const where: Prisma.ClientVisaWhereInput = {
      clientId,
    };

    if (countryId) {
      where.countryId = countryId;
    }

    if (visaTypeId) {
      where.visaTypeId = visaTypeId;
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

    // Get client visas
    const clientVisas = await ctx.prisma.clientVisa.findMany({
      where,
      include: {
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
            processingMode: true,
            processingUnit: true,
            processingValueFixed: true,
            processingValueMin: true,
            processingValueMax: true,
          },
        },
        visaApplication: {
          select: {
            id: true,
            applicationCode: true,
            status: true,
            submittedByAgent: true,
            note: true,
            statusNote: true,
          },
        },
      },
      orderBy: [{ validTo: 'asc' }, { validFrom: 'desc' }, { country: { name: 'asc' } }],
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

    // Group visas by country for better organization
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
    const activeVisas = clientVisasWithExpiry.filter(v => !v.isExpired);
    const expiringVisas = clientVisasWithExpiry.filter(v => v.isExpiringSoon);
    const expiredVisas = clientVisasWithExpiry.filter(v => v.isExpired);

    return {
      client,
      clientVisas: clientVisasWithExpiry,
      visasByCountry,
      summary: {
        total: clientVisasWithExpiry.length,
        active: activeVisas.length,
        expiring: expiringVisas.length,
        expired: expiredVisas.length,
        countries: Object.keys(visasByCountry).length,
      },
    };
  });
