import { clientRequirementCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateClientRequirementTrpcInput = z.object({
  clientId: z.string().uuid(),
  requirementId: z.string().uuid(),
  textValue: z.string().optional(),
  dateValue: z.date().optional(),
  booleanValue: z.boolean().optional(),
  checkpointValue: z.string().optional(),
  submittedAt: z.date().optional(),
  comment: z.string().optional(),
});

export const createClientRequirementTrpcRoute = clientRequirementCreateProcedure
  .input(zCreateClientRequirementTrpcInput)
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

    // Check if client requirement already exists for this client and requirement
    const existingClientRequirement = await ctx.prisma.clientRequirement.findFirst({
      where: {
        clientId,
        requirementId,
      },
    });

    if (existingClientRequirement) {
      throw new Error('Client requirement already exists for this client and requirement');
    }

    // Create the client requirement
    const newClientRequirement = await ctx.prisma.clientRequirement.create({
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

    return {
      clientRequirement: newClientRequirement,
    };
  });
