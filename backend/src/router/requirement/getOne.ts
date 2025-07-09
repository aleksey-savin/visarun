import { requirementReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetOneRequirementTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getOneRequirementTrpcRoute = requirementReadProcedure
  .input(zGetOneRequirementTrpcInput)
  .query(async ({ input, ctx }) => {
    const { id } = input;

    const requirement = await ctx.prisma.requirement.findUnique({
      where: {
        id,
      },
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
            id: true,
            citizenship: {
              select: {
                id: true,
                name: true,
                favourite: true,
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
                email: true,
              },
            },
          },
          orderBy: {
            uploadedAt: 'desc',
          },
        },
        visaTypeLinks: {
          select: {
            visaType: {
              select: {
                id: true,
                name: true,
                serviceCost: true,
                isMultientry: true,
                processingMode: true,
                processingUnit: true,
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
        routeLinks: {
          select: {
            routeId: true,
          },
        },
        VisaType: {
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
    });

    if (!requirement) {
      throw new Error('Requirement not found');
    }

    return {
      requirement,
    };
  });
