import { requirementCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateRequirementTrpcInput = z.object({
  serviceType: z.enum(['visa', 'visarun']),
  isOptional: z.boolean().default(false),
  inputType: z.enum(['document', 'checkpoint', 'date', 'text', 'boolean']),
  operator: z.enum(['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'contains']).optional(),
  thresholdNumber: z.number().optional(),
  thresholdDate: z.date().optional(),
  thresholdText: z.string().optional(),
  thresholdBool: z.boolean().optional(),
  checkpointValue: z.string().optional(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  appliesToAllCitizenships: z.boolean().default(false),
  sampleUrl: z.string().optional(),
  citizenshipIds: z.array(z.string().uuid()).optional(),
  visaTypeIds: z.array(z.string().uuid()).optional(),
  routeIds: z.array(z.string().uuid()).optional(),
  // New fields for application scope
  applicationScope: z.enum(['specific', 'country_all', 'global']).default('specific'),
  countryId: z.string().uuid().optional(),
});

export const createRequirementTrpcRoute = requirementCreateProcedure
  .input(zCreateRequirementTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const {
      serviceType,
      isOptional,
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
      applicationScope,
      countryId,
    } = input;

    // Validate threshold values based on input type
    if (inputType === 'date' && !thresholdDate) {
      throw new Error('Threshold date is required for date input type');
    }
    if (inputType === 'text' && !thresholdText) {
      throw new Error('Threshold text is required for text input type');
    }
    if (inputType === 'boolean' && thresholdBool === undefined) {
      throw new Error('Threshold boolean is required for boolean input type');
    }
    if (inputType === 'checkpoint' && !checkpointValue) {
      throw new Error('Checkpoint value is required for checkpoint input type');
    }

    // Validate operator presence for certain input types
    if (['date', 'text'].includes(inputType) && !operator) {
      throw new Error(`Operator is required for ${inputType} input type`);
    }

    // Validate application scope requirements
    if (applicationScope === 'country_all' && !countryId) {
      throw new Error('Country ID is required when application scope is country_all');
    }

    if (
      applicationScope === 'specific' &&
      (!visaTypeIds || visaTypeIds.length === 0) &&
      serviceType === 'visa'
    ) {
      throw new Error(
        'Visa type IDs are required when application scope is specific for visa service'
      );
    }

    // Validate citizenship requirements
    if (!appliesToAllCitizenships && (!citizenshipIds || citizenshipIds.length === 0)) {
      throw new Error('Citizenship IDs are required when not applying to all citizenships');
    }

    // Validate country ID exists if provided
    if (countryId) {
      const existingCountry = await ctx.prisma.country.findUnique({
        where: { id: countryId },
        select: { id: true },
      });

      if (!existingCountry) {
        throw new Error('Country ID does not exist');
      }
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

    // Create the requirement with relations
    const newRequirement = await ctx.prisma.requirement.create({
      data: {
        serviceType,
        isOptional,
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
        applicationScope: applicationScope,
        countryId,
        // Create citizenship relations if not applying to all
        citizenships:
          !appliesToAllCitizenships && citizenshipIds
            ? {
                create: citizenshipIds.map(citizenshipId => ({
                  citizenshipId,
                })),
              }
            : undefined,
        // Create visa type relations only for specific scope
        visaTypeLinks:
          applicationScope === 'specific' && visaTypeIds
            ? {
                create: visaTypeIds.map(visaTypeId => ({
                  visaTypeId,
                })),
              }
            : undefined,
        // Create route relations if provided
        routeLinks: routeIds
          ? {
              create: routeIds.map(routeId => ({
                routeId,
              })),
            }
          : undefined,
      },
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

    return {
      requirement: newRequirement,
    };
  });
