import { clientVisaCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateClientVisaTrpcInput = z.object({
  clientId: z.string().uuid(),
  countryId: z.string().uuid(),
  visaTypeId: z.string().uuid(),
  visaApplicationId: z.string().uuid(),
  validFrom: z.date(),
  validTo: z.date(),
  notifiedExpiry: z.boolean().default(false),
});

export const createClientVisaTrpcRoute = clientVisaCreateProcedure
  .input(zCreateClientVisaTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if client exists
    const client = await ctx.prisma.client.findUnique({
      where: { id: input.clientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Check if country exists
    const country = await ctx.prisma.country.findUnique({
      where: { id: input.countryId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!country) {
      throw new Error('Country not found');
    }

    // Check if visa type exists and belongs to the specified country
    const visaType = await ctx.prisma.visaType.findUnique({
      where: { id: input.visaTypeId },
      select: {
        id: true,
        name: true,
        countryId: true,
      },
    });

    if (!visaType) {
      throw new Error('Visa type not found');
    }

    if (visaType.countryId !== input.countryId) {
      throw new Error('Visa type does not belong to the specified country');
    }

    // Check if visa application exists
    const visaApplication = await ctx.prisma.visaApplication.findUnique({
      where: { id: input.visaApplicationId },
      select: {
        id: true,
        applicationCode: true,
        status: true,
        countryId: true,
        visaTypeId: true,
      },
    });

    if (!visaApplication) {
      throw new Error('Visa application not found');
    }

    // Validate that visa application matches the country and visa type
    if (visaApplication.countryId !== input.countryId) {
      throw new Error('Visa application country does not match specified country');
    }

    if (visaApplication.visaTypeId !== input.visaTypeId) {
      throw new Error('Visa application visa type does not match specified visa type');
    }

    // Check if visa application has a visa type assigned
    if (!visaApplication.visaTypeId) {
      throw new Error('Cannot create client visa from visa application without assigned visa type');
    }

    // Check if visa application is in approved status
    if (visaApplication.status !== 'approved') {
      throw new Error('Can only create client visa from approved visa application');
    }

    // Validate date range
    if (input.validFrom >= input.validTo) {
      throw new Error('Valid from date must be before valid to date');
    }

    // Check for overlapping visas for the same client and country
    const overlappingVisa = await ctx.prisma.clientVisa.findFirst({
      where: {
        clientId: input.clientId,
        countryId: input.countryId,
        OR: [
          {
            AND: [{ validFrom: { lte: input.validFrom } }, { validTo: { gte: input.validFrom } }],
          },
          {
            AND: [{ validFrom: { lte: input.validTo } }, { validTo: { gte: input.validTo } }],
          },
          {
            AND: [{ validFrom: { gte: input.validFrom } }, { validTo: { lte: input.validTo } }],
          },
        ],
      },
    });

    if (overlappingVisa) {
      throw new Error(
        'Client already has an overlapping visa for this country in the specified date range'
      );
    }

    // Create client visa
    const clientVisa = await ctx.prisma.clientVisa.create({
      data: {
        clientId: input.clientId,
        countryId: input.countryId,
        visaTypeId: input.visaTypeId,
        visaApplicationId: input.visaApplicationId,
        validFrom: input.validFrom,
        validTo: input.validTo,
        notifiedExpiry: input.notifiedExpiry,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            citizenship: {
              select: {
                id: true,
                name: true,
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
          },
        },
        visaApplication: {
          select: {
            id: true,
            applicationCode: true,
            status: true,
          },
        },
      },
    });

    return {
      clientVisa,
    };
  });
