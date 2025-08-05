import { visaApplicationCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateVisaApplicationTrpcInput = z.object({
  orderItemId: z.string().uuid(),
  applicationCode: z.string().min(1).max(100).optional(),
  submittedByAgent: z.boolean().default(false),
  countryId: z.string().uuid(),
  visaTypeId: z.string().uuid(),
  plannedCountryEntryDate: z
    .string()
    .datetime()
    .optional()
    .transform(val => (val ? new Date(val) : undefined)),
  note: z.string().optional(),
  revisedActivationDate: z.date().optional(),
  statusNote: z.string().optional(),
  status: z
    .enum(['pending', 'submitted', 'approved', 'used', 'cancelled', 'denied'])
    .default('pending'),
});

export const createVisaApplicationTrpcRoute = visaApplicationCreateProcedure
  .input(zCreateVisaApplicationTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if order item exists
    const orderItem = await ctx.prisma.orderItem.findUnique({
      where: { id: input.orderItemId },
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
    });

    if (!orderItem) {
      throw new Error('Order item not found');
    }

    // Check if country exists
    const country = await ctx.prisma.country.findUnique({
      where: { id: input.countryId },
    });

    if (!country) {
      throw new Error('Country not found');
    }

    // Check if visa type exists and belongs to the specified country
    const visaType = await ctx.prisma.visaType.findUnique({
      where: { id: input.visaTypeId },
    });

    if (!visaType) {
      throw new Error('Visa type not found');
    }

    if (visaType.countryId !== input.countryId) {
      throw new Error('Visa type does not belong to the specified country');
    }

    // Check if application code is unique
    const existingApplication = await ctx.prisma.visaApplication.findFirst({
      where: { applicationCode: input.applicationCode },
    });

    if (existingApplication) {
      throw new Error('Application code already exists');
    }

    // Create visa application
    const visaApplication = await ctx.prisma.visaApplication.create({
      data: {
        orderItemId: input.orderItemId,
        applicationCode: input.applicationCode,
        submittedByAgent: input.submittedByAgent,
        countryId: input.countryId,
        visaTypeId: input.visaTypeId,
        plannedCountryEntryDate: input.plannedCountryEntryDate,
        note: input.note,
        revisedActivationDate: input.revisedActivationDate,
        statusNote: input.statusNote,
        status: input.status,
      },
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
      },
    });

    return {
      visaApplication,
    };
  });
