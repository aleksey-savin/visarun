import { clientRequirementCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zUpsertClientRequirementTrpcInput = z.object({
  clientId: z.string().uuid(),
  requirementId: z.string().uuid(),
  textValue: z.string().optional().nullable(),
  dateValue: z.date().optional().nullable(),
  booleanValue: z.boolean().optional().nullable(),
  checkpointValue: z.string().optional().nullable(),
  submittedAt: z.date().optional().nullable(),
  comment: z.string().optional().nullable(),
});

export const upsertClientRequirementTrpcRoute = clientRequirementCreateProcedure
  .input(zUpsertClientRequirementTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const {
      clientId,
      requirementId,
      textValue,
      dateValue,
      booleanValue,
      checkpointValue,
      submittedAt,
      comment,
    } = input;

    if (!ctx.user) {
      throw new Error('User not authenticated');
    }

    // Check if client exists
    const existingClient = await ctx.prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!existingClient) {
      throw new Error('Client not found');
    }

    // Check if requirement exists
    const existingRequirement = await ctx.prisma.requirement.findUnique({
      where: { id: requirementId },
      select: {
        id: true,
        title: true,
        inputType: true,
        serviceType: true,
      },
    });

    if (!existingRequirement) {
      throw new Error('Requirement not found');
    }

    // Check if a ClientRequirement already exists for this requirementId (anywhere in the system)
    const existingClientRequirement = await ctx.prisma.clientRequirement.findUnique({
      where: { requirementId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        requirement: {
          select: {
            id: true,
            title: true,
            description: true,
            serviceType: true,
            inputType: true,
            isOptional: true,
            operator: true,
            thresholdNumber: true,
            thresholdDate: true,
            thresholdText: true,
            thresholdBool: true,
            checkpointValue: true,
            appliesToAllCitizenships: true,
            sampleUrl: true,
            applicableServices: true,
            applicationScope: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    let clientRequirement;

    if (existingClientRequirement) {
      // Update the existing ClientRequirement to point to the new client
      clientRequirement = await ctx.prisma.clientRequirement.update({
        where: { requirementId },
        data: {
          clientId,
          textValue,
          dateValue,
          booleanValue,
          checkpointValue,
          submittedAt,
          comment,
          // Reset review fields when updating to a new client
          reviewedAt: null,
          reviewedById: null,
        },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          requirement: {
            select: {
              id: true,
              title: true,
              description: true,
              serviceType: true,
              inputType: true,
              isOptional: true,
              operator: true,
              thresholdNumber: true,
              thresholdDate: true,
              thresholdText: true,
              thresholdBool: true,
              checkpointValue: true,
              appliesToAllCitizenships: true,
              sampleUrl: true,
              applicableServices: true,
              applicationScope: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    } else {
      // Create a new ClientRequirement
      clientRequirement = await ctx.prisma.clientRequirement.create({
        data: {
          clientId,
          requirementId,
          textValue,
          dateValue,
          booleanValue,
          checkpointValue,
          submittedAt,
          comment,
        },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          requirement: {
            select: {
              id: true,
              title: true,
              description: true,
              serviceType: true,
              inputType: true,
              isOptional: true,
              operator: true,
              thresholdNumber: true,
              thresholdDate: true,
              thresholdText: true,
              thresholdBool: true,
              checkpointValue: true,
              appliesToAllCitizenships: true,
              sampleUrl: true,
              applicableServices: true,
              applicationScope: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    }

    return {
      clientRequirement,
      wasUpdated: !!existingClientRequirement,
    };
  });
