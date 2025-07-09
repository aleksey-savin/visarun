import { requirementUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditRequirementTrpcInput = z.object({
  id: z.string().uuid(),
  serviceType: z.enum(['visa', 'visarun']).optional(),
  inputType: z.enum(['document', 'checkpoint', 'date', 'text', 'boolean']).optional(),
  operator: z.enum(['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'contains']).optional(),
  thresholdNumber: z.number().optional(),
  thresholdDate: z.date().optional(),
  thresholdText: z.string().optional(),
  thresholdBool: z.boolean().optional(),
  checkpointValue: z.string().optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  appliesToAllCitizenships: z.boolean().optional(),
  sampleUrl: z.string().optional(),
  citizenshipIds: z.array(z.string().uuid()).optional(),
  visaTypeIds: z.array(z.string().uuid()).optional(),
  routeIds: z.array(z.string().uuid()).optional(),
});

export const editRequirementTrpcRoute = requirementUpdateProcedure
  .input(zEditRequirementTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const {
      id,
      serviceType,
      inputType,
      operator,
      thresholdNumber,
      thresholdDate,
      thresholdText,
      thresholdBool,
      checkpointValue,
      title,
      description,
      appliesToAllCitizenships,
      sampleUrl,
      citizenshipIds,
      visaTypeIds,
      routeIds,
    } = input;

    // Check if requirement exists
    const existingRequirement = await ctx.prisma.requirement.findUnique({
      where: { id },
      select: {
        id: true,
        inputType: true,
        appliesToAllCitizenships: true,
      },
    });

    if (!existingRequirement) {
      throw new Error('Requirement not found');
    }

    // Determine the input type to use (current or new)
    const finalInputType = inputType || existingRequirement.inputType;

    // Validate threshold values based on input type
    if (finalInputType === 'date' && thresholdDate === undefined && inputType) {
      throw new Error('Threshold date is required for date input type');
    }
    if (finalInputType === 'text' && thresholdText === undefined && inputType) {
      throw new Error('Threshold text is required for text input type');
    }
    if (finalInputType === 'boolean' && thresholdBool === undefined && inputType) {
      throw new Error('Threshold boolean is required for boolean input type');
    }
    if (finalInputType === 'checkpoint' && checkpointValue === undefined && inputType) {
      throw new Error('Checkpoint value is required for checkpoint input type');
    }

    // Validate operator presence for certain input types
    if (['date', 'text'].includes(finalInputType) && operator === undefined && inputType) {
      throw new Error(`Operator is required for ${finalInputType} input type`);
    }

    // Determine final appliesToAllCitizenships value
    const finalAppliesToAllCitizenships =
      appliesToAllCitizenships !== undefined
        ? appliesToAllCitizenships
        : existingRequirement.appliesToAllCitizenships;

    // Validate citizenship requirements
    if (
      !finalAppliesToAllCitizenships &&
      citizenshipIds !== undefined &&
      citizenshipIds.length === 0
    ) {
      throw new Error('Citizenship IDs are required when not applying to all citizenships');
    }

    // Validate visa type IDs exist if provided
    if (visaTypeIds && visaTypeIds.length > 0) {
      const existingVisaTypes = await ctx.prisma.visaType.findMany({
        where: {
          id: {
            in: visaTypeIds,
          },
        },
        select: {
          id: true,
        },
      });

      if (existingVisaTypes.length !== visaTypeIds.length) {
        throw new Error('One or more visa type IDs do not exist');
      }
    }

    // Validate citizenship IDs exist if provided
    if (citizenshipIds && citizenshipIds.length > 0) {
      const existingCitizenships = await ctx.prisma.citizenship.findMany({
        where: {
          id: {
            in: citizenshipIds,
          },
        },
        select: {
          id: true,
        },
      });

      if (existingCitizenships.length !== citizenshipIds.length) {
        throw new Error('One or more citizenship IDs do not exist');
      }
    }

    // Prepare update data
    const updateData: {
      serviceType?: 'visa' | 'visarun';
      inputType?: 'document' | 'checkpoint' | 'date' | 'text' | 'boolean';
      operator?: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'contains';
      thresholdNumber?: number;
      thresholdDate?: Date;
      thresholdText?: string;
      thresholdBool?: boolean;
      checkpointValue?: string;
      title?: string;
      description?: string;
      appliesToAllCitizenships?: boolean;
      sampleUrl?: string;
    } = {};

    if (serviceType !== undefined) updateData.serviceType = serviceType;
    if (inputType !== undefined) updateData.inputType = inputType;
    if (operator !== undefined) updateData.operator = operator;
    if (thresholdNumber !== undefined) updateData.thresholdNumber = thresholdNumber;
    if (thresholdDate !== undefined) updateData.thresholdDate = thresholdDate;
    if (thresholdText !== undefined) updateData.thresholdText = thresholdText;
    if (thresholdBool !== undefined) updateData.thresholdBool = thresholdBool;
    if (checkpointValue !== undefined) updateData.checkpointValue = checkpointValue;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (appliesToAllCitizenships !== undefined)
      updateData.appliesToAllCitizenships = appliesToAllCitizenships;
    if (sampleUrl !== undefined) updateData.sampleUrl = sampleUrl;

    // Update the requirement
    const updatedRequirement = await ctx.prisma.$transaction(async tx => {
      // Delete existing relations if they need to be updated
      if (citizenshipIds !== undefined) {
        await tx.requirementCitizenship.deleteMany({
          where: {
            requirementId: id,
          },
        });

        // Create new citizenship relations if not applying to all
        if (!finalAppliesToAllCitizenships && citizenshipIds.length > 0) {
          await tx.requirementCitizenship.createMany({
            data: citizenshipIds.map(citizenshipId => ({
              requirementId: id,
              citizenshipId,
            })),
          });
        }
      }

      if (visaTypeIds !== undefined) {
        await tx.requirementVisaType.deleteMany({
          where: {
            requirementId: id,
          },
        });

        // Create new visa type relations if provided
        if (visaTypeIds.length > 0) {
          await tx.requirementVisaType.createMany({
            data: visaTypeIds.map(visaTypeId => ({
              requirementId: id,
              visaTypeId,
            })),
          });
        }
      }

      if (routeIds !== undefined) {
        await tx.requirementVisarunRoute.deleteMany({
          where: {
            requirementId: id,
          },
        });

        // Create new route relations if provided
        if (routeIds.length > 0) {
          await tx.requirementVisarunRoute.createMany({
            data: routeIds.map(routeId => ({
              requirementId: id,
              routeId,
            })),
          });
        }
      }

      // Update the requirement itself
      return await tx.requirement.update({
        where: { id },
        data: updateData,
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
        },
      });
    });

    return {
      requirement: updatedRequirement,
    };
  });
