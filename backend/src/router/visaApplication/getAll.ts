import { visaApplicationReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const zGetAllVisaApplicationsTrpcInput = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  orderItemId: z.string().uuid().optional(),
  countryId: z.string().uuid().optional(),
  visaTypeId: z.string().uuid().optional(),
  status: z
    .enum([
      'pending_submit',
      'awaiting_approval',
      'approved',
      'pending_refund',
      'refunded',
      'denied',
      'cancelled',
    ])
    .optional(),
  submittedByAgent: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  search: z.string().optional(),
});

export const getAllVisaApplicationsTrpcRoute = visaApplicationReadProcedure
  .input(zGetAllVisaApplicationsTrpcInput)
  .query(async ({ input, ctx }) => {
    const {
      limit,
      offset,
      orderItemId,
      countryId,
      visaTypeId,
      status,
      submittedByAgent,
      isArchived,
      search,
    } = input;

    // Build where clause
    const where: Prisma.VisaApplicationWhereInput = {};

    if (orderItemId) {
      where.orderItemId = orderItemId;
    }

    if (countryId) {
      where.countryId = countryId;
    }

    if (visaTypeId) {
      where.visaTypeId = visaTypeId;
    }

    if (status) {
      where.status = status;
    }

    if (submittedByAgent !== undefined) {
      where.submittedByAgent = submittedByAgent;
    }

    if (isArchived !== undefined) {
      where.isArchived = isArchived;
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
                userId: true,
                user: {
                  select: {
                    email: true,
                    phoneNumber: true,
                    contactMethods: {
                      select: {
                        id: true,
                        value: true,
                        method: true,
                      },
                    },
                  },
                },
                isPrimary: true,
                preConfirmPassportIsValid: true,
                firstName: true,
                lastName: true,
                documents: {
                  select: {
                    id: true,
                    fileUrl: true,
                    originalName: true,
                    requirement: true,
                  },
                },
                citizenship: {
                  select: {
                    id: true,
                    name: true,
                    abbreviation: true,
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
            multientryExtraCost: true,
            processingMode: true,
            processingUnit: true,
            processingValueFixed: true,
            processingValueMin: true,
            processingValueMax: true,
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
      visaApplications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  });
