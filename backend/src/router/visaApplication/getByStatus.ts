import { visaApplicationReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const zGetVisaApplicationsByStatusTrpcInput = z.object({
  status: z.enum(['pending', 'submitted', 'approved', 'used', 'cancelled', 'denied']),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  countryId: z.string().uuid().optional(),
  visaTypeId: z.string().uuid().optional(),
  submittedByAgent: z.boolean().optional(),
  search: z.string().optional(),
});

export const getVisaApplicationsByStatusTrpcRoute = visaApplicationReadProcedure
  .input(zGetVisaApplicationsByStatusTrpcInput)
  .query(async ({ input, ctx }) => {
    const { status, limit, offset, countryId, visaTypeId, submittedByAgent, search } = input;

    // Build where clause
    const where: Prisma.VisaApplicationWhereInput = {
      status,
    };

    if (countryId) {
      where.countryId = countryId;
    }

    if (visaTypeId) {
      where.visaTypeId = visaTypeId;
    }

    if (submittedByAgent !== undefined) {
      where.submittedByAgent = submittedByAgent;
    }

    if (search) {
      where.OR = [
        {
          applicationCode: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          note: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          statusNote: {
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
        {
          visaType: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          orderItem: {
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
        },
      ];
    }

    // Get total count
    const total = await ctx.prisma.visaApplication.count({
      where,
    });

    // Get visa applications
    const visaApplications = await ctx.prisma.visaApplication.findMany({
      where,
      include: {
        orderItem: {
          include: {
            order: {
              select: {
                id: true,
                status: true,
                createdAt: true,
              },
            },
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
        _count: {
          select: {
            clientVisas: true,
          },
        },
      },
      orderBy: [{ applicationCode: 'asc' }],
      take: limit,
      skip: offset,
    });

    return {
      status,
      visaApplications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  });
