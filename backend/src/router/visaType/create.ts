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
    });

    if (!country) {
      throw new Error('Country not found');
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

    // Validate multientry extra cost
    if (input.isMultientry && input.multientryExtraCost === undefined) {
      throw new Error('Multientry extra cost is required when visa type is multientry');
    }

    // Create visa type
    const visaType = await ctx.prisma.visaType.create({
      data: {
        name: input.name,
        serviceCost: input.serviceCost,
        countryId: input.countryId,
        isMultientry: input.isMultientry,
        favourite: input.favourite,
        multientryExtraCost: input.multientryExtraCost,
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
