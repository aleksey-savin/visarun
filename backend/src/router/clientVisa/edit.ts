import { clientVisaUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditClientVisaTrpcInput = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid().optional(),
  countryId: z.string().uuid().optional(),
  visaTypeId: z.string().uuid().optional(),
  visaApplicationId: z.string().uuid().optional(),
  validFrom: z.date().optional(),
  validTo: z.date().optional(),
  notifiedExpiry: z.boolean().optional(),
});

export const editClientVisaTrpcRoute = clientVisaUpdateProcedure
  .input(zEditClientVisaTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, ...updateData } = input;

    // Check if client visa exists
    const existingClientVisa = await ctx.prisma.clientVisa.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
            countryId: true,
          },
        },
        visaApplication: {
          select: {
            id: true,
            applicationCode: true,
            countryId: true,
            visaTypeId: true,
          },
        },
      },
    });

    if (!existingClientVisa) {
      throw new Error('Client visa not found');
    }

    // Check if client exists if clientId is being updated
    if (updateData.clientId) {
      const client = await ctx.prisma.client.findUnique({
        where: { id: updateData.clientId },
      });

      if (!client) {
        throw new Error('Client not found');
      }
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

      const countryId = updateData.countryId || existingClientVisa.countryId;
      if (visaType.countryId !== countryId) {
        throw new Error('Visa type does not belong to the specified country');
      }
    }

    // Check if visa application exists and matches requirements if being updated
    if (updateData.visaApplicationId) {
      const visaApplication = await ctx.prisma.visaApplication.findUnique({
        where: { id: updateData.visaApplicationId },
      });

      if (!visaApplication) {
        throw new Error('Visa application not found');
      }

      const countryId = updateData.countryId || existingClientVisa.countryId;
      const visaTypeId = updateData.visaTypeId || existingClientVisa.visaTypeId;

      if (visaApplication.countryId !== countryId) {
        throw new Error('Visa application country does not match specified country');
      }

      if (!visaApplication.visaTypeId) {
        throw new Error('Cannot link to visa application without assigned visa type');
      }

      if (visaApplication.visaTypeId !== visaTypeId) {
        throw new Error('Visa application visa type does not match specified visa type');
      }

      if (visaApplication.status !== 'approved') {
        throw new Error('Can only link to approved visa applications');
      }
    }

    // Validate date range
    const validFrom = updateData.validFrom || existingClientVisa.validFrom;
    const validTo = updateData.validTo || existingClientVisa.validTo;

    if (validFrom >= validTo) {
      throw new Error('Valid from date must be before valid to date');
    }

    // Check for overlapping visas for the same client and country (excluding current visa)
    const clientId = updateData.clientId || existingClientVisa.clientId;
    const countryId = updateData.countryId || existingClientVisa.countryId;

    const overlappingVisa = await ctx.prisma.clientVisa.findFirst({
      where: {
        id: { not: id },
        clientId,
        countryId,
        OR: [
          {
            AND: [{ validFrom: { lte: validFrom } }, { validTo: { gte: validFrom } }],
          },
          {
            AND: [{ validFrom: { lte: validTo } }, { validTo: { gte: validTo } }],
          },
          {
            AND: [{ validFrom: { gte: validFrom } }, { validTo: { lte: validTo } }],
          },
        ],
      },
    });

    if (overlappingVisa) {
      throw new Error(
        'Client already has an overlapping visa for this country in the specified date range'
      );
    }

    // Update client visa
    const clientVisa = await ctx.prisma.clientVisa.update({
      where: { id },
      data: updateData,
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
            multientryExtraCost: true,
          },
        },
        visaApplication: {
          select: {
            id: true,
            applicationCode: true,
            status: true,
            submittedByAgent: true,
          },
        },
      },
    });

    // Calculate expiry information
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (clientVisa.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isExpired = daysUntilExpiry < 0;
    const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry >= 0;

    return {
      clientVisa: {
        ...clientVisa,
        daysUntilExpiry,
        isExpired,
        isExpiringSoon,
      },
    };
  });
