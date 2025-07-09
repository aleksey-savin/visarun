import { requirementReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetAllRequirementsTrpcInput = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  search: z.string().min(1).optional(),
  serviceType: z.enum(['visa', 'visarun']).optional(),
  inputType: z.enum(['document', 'checkpoint', 'date', 'text', 'boolean']).optional(),
  visaTypeId: z.string().uuid().optional(),
  citizenshipId: z.string().uuid().optional(),
  countryId: z.string().uuid().optional(),
});

export const getAllRequirementsTrpcRoute = requirementReadProcedure
  .input(zGetAllRequirementsTrpcInput)
  .query(async ({ input, ctx }) => {
    const { limit, offset, search, serviceType, inputType, visaTypeId, citizenshipId, countryId } =
      input;

    // Build where clause
    const where: {
      serviceType?: 'visa' | 'visarun';
      inputType?: 'document' | 'checkpoint' | 'date' | 'text' | 'boolean';
      visaTypeLinks?: {
        some: {
          visaTypeId?: string;
          visaType?: {
            countryId: string;
          };
        };
      };
      citizenships?: {
        some: {
          citizenshipId: string;
        };
      };
      appliesToAllCitizenships?: boolean;
      OR?: Array<{
        title?: {
          contains: string;
          mode: 'insensitive';
        };
        description?: {
          contains: string;
          mode: 'insensitive';
        };
        appliesToAllCitizenships?: boolean;
        citizenships?: {
          some: {
            citizenshipId: string;
          };
        };
      }>;
    } = {};

    if (serviceType) {
      where.serviceType = serviceType;
    }

    if (inputType) {
      where.inputType = inputType;
    }

    if (visaTypeId) {
      where.visaTypeLinks = {
        some: {
          visaTypeId,
        },
      };
    } else if (countryId) {
      where.visaTypeLinks = {
        some: {
          visaType: {
            countryId,
          },
        },
      };
    }

    if (citizenshipId) {
      where.OR = [
        { appliesToAllCitizenships: true },
        {
          citizenships: {
            some: {
              citizenshipId,
            },
          },
        },
      ];
    }

    if (search && search.trim()) {
      where.OR = [
        {
          title: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
      ];
    }

    // Get total count
    const total = await ctx.prisma.requirement.count({
      where,
    });

    // Get requirements
    const requirements = await ctx.prisma.requirement.findMany({
      where,
      orderBy: [{ serviceType: 'asc' }, { title: 'asc' }],
      select: {
        id: true,
        serviceType: true,
        inputType: true,
        operator: true,
        thresholdNumber: true,
        thresholdDate: true,
        thresholdText: true,
        thresholdBool: true,
        checkpointValue: true,
        title: true,
        description: true,
        appliesToAllCitizenships: true,
        sampleUrl: true,
        _count: {
          select: {
            citizenships: true,
            documents: true,
            visaTypeLinks: true,
            routeLinks: true,
          },
        },
        citizenships: {
          select: {
            citizenship: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        visaTypeLinks: {
          select: {
            visaType: {
              select: {
                id: true,
                name: true,
                country: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      take: limit,
      skip: offset,
    });

    return {
      requirements,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  });
