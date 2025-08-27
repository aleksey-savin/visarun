import { visaApplicationUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditVisaApplicationTrpcInput = z.object({
  id: z.string().uuid(),
  applicationCode: z.string().min(1).max(100).optional(),
  submittedByAgent: z.boolean().optional(),
  countryId: z.string().uuid().optional(),
  visaTypeId: z.string().uuid().optional(),
  isMultientry: z.boolean().optional(),
  clientIsInTheCountry: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  plannedCountryEntryDate: z
    .string()
    .datetime()
    .optional()
    .transform(val => (val ? new Date(val) : undefined)),
  plannedCountryExitDate: z
    .string()
    .datetime()
    .optional()
    .transform(val => (val ? new Date(val) : undefined)),
  plannedCompletionDate: z
    .string()
    .datetime()
    .optional()
    .transform(val => (val ? new Date(val) : undefined)),
  stampUntilDate: z
    .string()
    .datetime()
    .optional()
    .transform(val => (val ? new Date(val) : undefined)),
  note: z.string().optional(),
  revisedActivationDate: z.date().optional(),
  statusNote: z.string().optional(),
});

export const editVisaApplicationTrpcRoute = visaApplicationUpdateProcedure
  .input(zEditVisaApplicationTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, ...updateData } = input;

    // Check if visa application exists
    const existingApplication = await ctx.prisma.visaApplication.findUnique({
      where: { id },
      include: {
        orderItem: {
          select: {
            id: true,
            orderId: true,
          },
        },
      },
    });

    if (!existingApplication) {
      throw new Error('Visa application not found');
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

    // Check if visa type exists and belongs to the specified country if being updated
    if (updateData.visaTypeId) {
      const visaType = await ctx.prisma.visaType.findUnique({
        where: { id: updateData.visaTypeId },
      });

      if (!visaType) {
        throw new Error('Visa type not found');
      }

      const countryId = updateData.countryId || existingApplication.countryId;
      if (visaType.countryId !== countryId) {
        throw new Error('Visa type does not belong to the specified country');
      }
    }

    // Check if application code is unique (excluding current application)
    if (updateData.applicationCode) {
      const duplicateApplication = await ctx.prisma.visaApplication.findFirst({
        where: {
          applicationCode: updateData.applicationCode,
          id: { not: id },
        },
      });

      if (duplicateApplication) {
        throw new Error('Application code already exists');
      }
    }

    // Update visa application
    const visaApplication = await ctx.prisma.visaApplication.update({
      where: { id },
      data: updateData,
      include: {
        orderItem: {
          include: {
            order: {
              select: {
                id: true,
                status: true,
              },
            },
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        country: {
          select: {
            id: true,
            name: true,
          },
        },
        visaType: {
          select: {
            id: true,
            name: true,
            serviceCost: true,
            isMultientry: true,
            processingMode: true,
            processingUnit: true,
            processingValueFixed: true,
            processingValueMin: true,
            processingValueMax: true,
          },
        },
        clientVisas: {
          select: {
            id: true,
            validFrom: true,
            validTo: true,
          },
        },
        _count: {
          select: {
            clientVisas: true,
          },
        },
      },
    });

    return {
      visaApplication,
    };
  });
