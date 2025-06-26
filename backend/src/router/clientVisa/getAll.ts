import { clientVisaReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const zGetAllClientVisasTrpcInput = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  clientId: z.string().uuid().optional(),
  countryId: z.string().uuid().optional(),
  visaTypeId: z.string().uuid().optional(),
  visaApplicationId: z.string().uuid().optional(),
  isExpired: z.boolean().optional(),
  isExpiring: z.boolean().optional(), // expiring in next 30 days
  notifiedExpiry: z.boolean().optional(),
  search: z.string().optional(),
  validFromStart: z.date().optional(),
  validFromEnd: z.date().optional(),
  validToStart: z.date().optional(),
  validToEnd: z.date().optional(),
});

export const getAllClientVisasTrpcRoute = clientVisaReadProcedure
  .input(zGetAllClientVisasTrpcInput)
  .query(async ({ input, ctx }) => {
    const {
      limit,
      offset,
      clientId,
      countryId,
      visaTypeId,
      visaApplicationId,
      isExpired,
      isExpiring,
      notifiedExpiry,
      search,
      validFromStart,
      validFromEnd,
      validToStart,
      validToEnd,
    } = input;

    // Build where clause
    const where: Prisma.ClientVisaWhereInput = {};

    if (clientId) {
      where.clientId = clientId;
    }

    if (countryId) {
      where.countryId = countryId;
    }

    if (visaTypeId) {
      where.visaTypeId = visaTypeId;
    }

    if (visaApplicationId) {
      where.visaApplicationId = visaApplicationId;
    }

    if (notifiedExpiry !== undefined) {
      where.notifiedExpiry = notifiedExpiry;
    }

    // Handle date filters
    if (validFromStart || validFromEnd) {
      where.validFrom = {};
      if (validFromStart) {
        where.validFrom.gte = validFromStart;
      }
      if (validFromEnd) {
        where.validFrom.lte = validFromEnd;
      }
    }

    if (validToStart || validToEnd) {
      where.validTo = {};
      if (validToStart) {
        where.validTo.gte = validToStart;
      }
      if (validToEnd) {
        where.validTo.lte = validToEnd;
      }
    }

    // Handle expired/expiring filters
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    if (isExpired === true) {
      where.validTo = Object.assign(where.validTo || {}, { lt: now });
    } else if (isExpired === false) {
      where.validTo = Object.assign(where.validTo || {}, { gte: now });
    }

    if (isExpiring === true) {
      where.validTo = Object.assign(where.validTo || {}, { gte: now, lte: thirtyDaysFromNow });
    }

    if (search) {
      where.OR = [
        {
          client: {
            OR: [
              {
                firstName: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                lastName: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
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
        {
          visaType: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          visaApplication: {
            applicationCode: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
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
        country: {
          select: {
            id: true,
            name: true,
          },
        },
        visaType: {
          select: {
            id: true,
            name: true,
            serviceCost: true,
            isMultientry: true,
          },
        },
        visaApplication: {
          select: {
            id: true,
            applicationCode: true,
            status: true,
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

    return {
      clientVisas: clientVisasWithExpiry,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  });
