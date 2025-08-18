import { requirementReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { RequirementApplicationScope } from '@prisma/client';

export const zGetRequirementsByVisaTypeTrpcInput = z.object({
  visaTypeId: z.string().uuid(),
  citizenshipId: z.string().uuid().optional(),
  includeGeneral: z.boolean().default(true), // Include requirements that apply to all citizenships
});

export const getRequirementsByVisaTypeTrpcRoute = requirementReadProcedure
  .input(zGetRequirementsByVisaTypeTrpcInput)
  .query(async ({ input, ctx }) => {
    const { visaTypeId, citizenshipId, includeGeneral } = input;

    // Check if visa type exists
    const visaType = await ctx.prisma.visaType.findUnique({
      where: { id: visaTypeId },
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
    });

    if (!visaType) {
      throw new Error('Visa type not found');
    }

    // Build where clause with new application scope logic
    const citizenshipFilter = citizenshipId
      ? [
          // Requirements that apply to all citizenships
          ...(includeGeneral ? [{ appliesToAllCitizenships: true }] : []),
          // Requirements that apply to specific citizenship
          {
            appliesToAllCitizenships: false,
            citizenships: {
              some: {
                citizenshipId,
              },
            },
          },
        ]
      : includeGeneral
        ? [{ appliesToAllCitizenships: true }]
        : [];

    const whereClause = {
      serviceType: 'visa' as const,
      OR: [
        // Global requirements
        { applicationScope: RequirementApplicationScope.global },
        // Country-specific requirements
        {
          applicationScope: RequirementApplicationScope.country_all,
          countryId: visaType.country.id,
        },
        // Specific visa type requirements
        {
          applicationScope: RequirementApplicationScope.specific,
          visaTypeLinks: {
            some: {
              visaTypeId,
            },
          },
        },
      ],
      // Apply citizenship filter to all scopes
      ...(citizenshipFilter.length > 0 ? { AND: { OR: citizenshipFilter } } : {}),
    };

    // Get requirements
    const requirements = await ctx.prisma.requirement.findMany({
      where: whereClause,
      select: {
        id: true,
        serviceType: true,
        isOptional: true,
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
        applicationScope: true,
        countryId: true,
        country: {
          select: {
            id: true,
            name: true,
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
        documents: {
          select: {
            id: true,
            fileUrl: true,
            uploadedAt: true,
            comment: true,
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            uploadedAt: 'desc',
          },
        },
        _count: {
          select: {
            documents: true,
          },
        },
      },
      orderBy: [{ inputType: 'asc' }, { title: 'asc' }],
    });

    return {
      visaType,
      requirements,
      totalCount: requirements.length,
    };
  });
