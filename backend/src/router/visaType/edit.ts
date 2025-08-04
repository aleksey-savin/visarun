import { visaTypeUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditVisaTypeTrpcInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  serviceCost: z.number().min(0).optional(),
  countryId: z.string().uuid().optional(),
  isMultientry: z.boolean().optional(),
  favourite: z.boolean().optional().default(false),
  multientryExtraCost: z.number().min(0).optional(),
  processingMode: z.enum(['fixed', 'approximate']).optional(),
  processingUnit: z.enum(['hours', 'days']).optional(),
  processingValueFixed: z.number().int().min(1).optional(),
  processingValueMin: z.number().int().min(1).optional(),
  processingValueMax: z.number().int().min(1).optional(),
  submissionDayIncluded: z.boolean().optional(),
});

export const editVisaTypeTrpcRoute = visaTypeUpdateProcedure
  .input(zEditVisaTypeTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, ...updateData } = input;

    // Check if visa type exists
    const existingVisaType = await ctx.prisma.visaType.findUnique({
      where: { id },
    });

    if (!existingVisaType) {
      throw new Error('Visa type not found');
    }

    // Check if country exists if countryId is being updated
    if (updateData.countryId) {
      const country = await ctx.prisma.country.findUnique({
        where: { id: updateData.countryId },
      });

      if (!country) {
        throw new Error('Country not found');
      }
    }

    // Validate processing values based on mode (use existing or new mode)
    const processingMode = updateData.processingMode || existingVisaType.processingMode;

    if (processingMode === 'fixed') {
      const fixedValue =
        updateData.processingValueFixed !== undefined
          ? updateData.processingValueFixed
          : existingVisaType.processingValueFixed;

      if (!fixedValue) {
        throw new Error('Fixed processing value is required when processing mode is fixed');
      }

      // Clear min/max values if switching to fixed mode
      if (updateData.processingMode === 'fixed') {
        updateData.processingValueMin = undefined;
        updateData.processingValueMax = undefined;
      }
    } else if (processingMode === 'approximate') {
      const minValue =
        updateData.processingValueMin !== undefined
          ? updateData.processingValueMin
          : existingVisaType.processingValueMin;
      const maxValue =
        updateData.processingValueMax !== undefined
          ? updateData.processingValueMax
          : existingVisaType.processingValueMax;

      if (!minValue || !maxValue) {
        throw new Error(
          'Min and Max processing values are required when processing mode is approximate'
        );
      }

      if (minValue >= maxValue) {
        throw new Error('Min processing value must be less than max processing value');
      }

      // Clear fixed value if switching to approximate mode
      if (updateData.processingMode === 'approximate') {
        updateData.processingValueFixed = undefined;
      }
    }

    // Validate multientry extra cost
    const isMultientry =
      updateData.isMultientry !== undefined
        ? updateData.isMultientry
        : existingVisaType.isMultientry;
    const multientryExtraCost =
      updateData.multientryExtraCost !== undefined
        ? updateData.multientryExtraCost
        : existingVisaType.multientryExtraCost;

    if (isMultientry && multientryExtraCost === null) {
      throw new Error('Multientry extra cost is required when visa type is multientry');
    }

    // Update visa type
    const visaType = await ctx.prisma.visaType.update({
      where: { id },
      data: updateData,
      include: {
        country: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            visaApplications: true,
            clientVisas: true,
          },
        },
      },
    });

    return {
      visaType,
    };
  });
