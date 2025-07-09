import { requirementReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetRequirementsByCitizenshipTrpcInput = z.object({
  citizenshipId: z.string().uuid(),
  serviceType: z.enum(['visa', 'visarun']).optional(),
  visaTypeId: z.string().uuid().optional(),
});

export const getRequirementsByCitizenshipTrpcRoute = requirementReadProcedure
  .input(zGetRequirementsByCitizenshipTrpcInput)
  .query(async ({ input, ctx }) => {
    const { citizenshipId, serviceType, visaTypeId } = input;

    // Check if citizenship exists
    const citizenship = await ctx.prisma.citizenship.findUnique({
      where: { id: citizenshipId },
      select: {
        id: true,
        name: true,
        favourite: true,
      },
    });

    if (!citizenship) {
      throw new Error('Citizenship not found');
    }

    // Build where clause for requirements
    const whereClause: {
      serviceType?: 'visa' | 'visarun';
      visaTypeLinks?: {
        some: {
          visaTypeId: string;
        };
      };
      OR: Array<{
        appliesToAllCitizenships: boolean;
        citizenships?: {
          some: {
            citizenshipId: string;
          };
        };
      }>;
    } = {
      OR: [
        // Requirements that apply to all citizenships
        { appliesToAllCitizenships: true },
        // Requirements that apply to specific citizenship
        {
          appliesToAllCitizenships: false,
          citizenships: {
            some: {
              citizenshipId,
            },
          },
        },
      ],
    };

    // Add service type filter if provided
    if (serviceType) {
      whereClause.serviceType = serviceType;
    }

    // Add visa type filter if provided
    if (visaTypeId) {
      whereClause.visaTypeLinks = {
        some: {
          visaTypeId,
        },
      };
    }

    // Get requirements
    const requirements = await ctx.prisma.requirement.findMany({
      where: whereClause,
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
      orderBy: [{ serviceType: 'asc' }, { inputType: 'asc' }, { title: 'asc' }],
    });

    // Group requirements by service type
    const groupedRequirements = requirements.reduce(
      (acc, requirement) => {
        const serviceType = requirement.serviceType;
        if (!acc[serviceType]) {
          acc[serviceType] = [];
        }
        acc[serviceType].push(requirement);
        return acc;
      },
      {} as Record<string, typeof requirements>
    );

    return {
      citizenship,
      requirements: groupedRequirements,
      totalCount: requirements.length,
      visaRequirements: groupedRequirements.visa || [],
      visarunRequirements: groupedRequirements.visarun || [],
    };
  });
