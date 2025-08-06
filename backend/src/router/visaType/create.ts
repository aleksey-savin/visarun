import { visaTypeCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateVisaTypeTrpcInput = z.object({
  name: z.string().min(1).max(255),
  serviceCost: z.number().min(0),
  countryId: z.string().uuid(),
  isMultientry: z.boolean().default(false),
  favourite: z.boolean().default(false),
  multientryExtraCost: z.number().min(0).optional(),
  processingMode: z.enum(['fixed', 'approximate']),
  processingUnit: z.enum(['hours', 'days']),
  processingValueFixed: z.number().int().min(1).optional(),
  processingValueMin: z.number().int().min(1).optional(),
  processingValueMax: z.number().int().min(1).optional(),
  submissionDayIncluded: z.boolean().default(false),
});

export const createVisaTypeTrpcRoute = visaTypeCreateProcedure
  .input(zCreateVisaTypeTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if country exists
    const country = await ctx.prisma.country.findUnique({
      where: { id: input.countryId },
      select: {
        id: true,
        name: true,
        multivisaAvailable: true,
        multivisaIsGlobal: true,
        multivisaGlobalExtraCost: true,
      },
    });

    if (!country) {
      throw new Error('Country not found');
    }

    // Handle global multivisa settings
    let finalIsMultientry = input.isMultientry;
    let finalMultientryExtraCost = input.multientryExtraCost;

    if (country.multivisaIsGlobal && country.multivisaGlobalExtraCost !== null) {
      // Override with global settings
      finalIsMultientry = true;
      finalMultientryExtraCost = country.multivisaGlobalExtraCost;
    } else {
      // Validate multi-entry settings based on country configuration
      if (input.isMultientry && !country.multivisaAvailable) {
        throw new Error('Multi-entry visas are not available for this country');
      }
    }

    // Validate processing values based on mode
    if (input.processingMode === 'fixed') {
      if (!input.processingValueFixed) {
        throw new Error('Fixed processing value is required when processing mode is fixed');
      }
      if (input.processingValueMin || input.processingValueMax) {
        throw new Error(
          'Min/Max processing values should not be provided when processing mode is fixed'
        );
      }
    } else if (input.processingMode === 'approximate') {
      if (!input.processingValueMin || !input.processingValueMax) {
        throw new Error(
          'Min and Max processing values are required when processing mode is approximate'
        );
      }
      if (input.processingValueMin >= input.processingValueMax) {
        throw new Error('Min processing value must be less than max processing value');
      }
      if (input.processingValueFixed) {
        throw new Error(
          'Fixed processing value should not be provided when processing mode is approximate'
        );
      }
    }

    // Validate multientry extra cost (only if not using global settings)
    if (!country.multivisaIsGlobal) {
      // Auto-clear multientryExtraCost if isMultientry is false or country doesn't support multivisa
      if (!finalIsMultientry || !country.multivisaAvailable) {
        finalMultientryExtraCost = undefined;
      }

      // Validate multientry extra cost
      if (finalIsMultientry && finalMultientryExtraCost === undefined) {
        throw new Error('Multientry extra cost is required when visa type is multientry');
      }
    }

    // Create visa type
    const visaType = await ctx.prisma.visaType.create({
      data: {
        name: input.name,
        serviceCost: input.serviceCost,
        countryId: input.countryId,
        isMultientry: finalIsMultientry,
        favourite: input.favourite,
        multientryExtraCost: finalMultientryExtraCost,
        processingMode: input.processingMode,
        processingUnit: input.processingUnit,
        processingValueFixed: input.processingValueFixed,
        processingValueMin: input.processingValueMin,
        processingValueMax: input.processingValueMax,
        submissionDayIncluded: input.submissionDayIncluded,
      },
      include: {
        country: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      visaType,
    };
  });
