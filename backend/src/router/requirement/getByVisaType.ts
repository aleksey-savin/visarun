import { requirementReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

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

    // Build where clause for requirements
    const whereClause: {
      serviceType: 'visa';
      visaTypeLinks: {
        some: {
          visaTypeId: string;
        };
      };
      appliesToAllCitizenships?: boolean;
      OR?: Array<{
        appliesToAllCitizenships: boolean;
        citizenships?: {
          some: {
            citizenshipId: string;
          };
        };
      }>;
    } = {
      serviceType: 'visa',
      visaTypeLinks: {
        some: {
          visaTypeId,
        },
      },
    };

    // Add citizenship filter if provided
    if (citizenshipId) {
      whereClause.OR = [
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
      ];
    } else if (includeGeneral) {
      // If no citizenship specified, only return general requirements
      whereClause.appliesToAllCitizenships = true;
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
