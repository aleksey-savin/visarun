import { visaCitizenshipSurchargeReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetVisaCitizenshipSurchargeByCitizenshipAndCountryTrpcInput = z.object({
  citizenshipId: z.string().uuid(),
  countryId: z.string().uuid(),
  visaTypeId: z.string().uuid().optional(),
});

export const getVisaCitizenshipSurchargeByCitizenshipAndCountryTrpcRoute =
  visaCitizenshipSurchargeReadProcedure
    .input(zGetVisaCitizenshipSurchargeByCitizenshipAndCountryTrpcInput)
    .query(async ({ input, ctx }) => {
      const { citizenshipId, countryId, visaTypeId } = input;

      // Check if citizenship exists
      const citizenship = await ctx.prisma.citizenship.findUnique({
        where: { id: citizenshipId },
      });

      if (!citizenship) {
        throw new Error('Citizenship not found');
      }

      // Check if country exists
      const country = await ctx.prisma.country.findUnique({
        where: { id: countryId },
      });

      if (!country) {
        throw new Error('Country not found');
      }

      let surcharge = null;

      if (visaTypeId) {
        // First, try to find a specific surcharge for this visa type
        surcharge = await ctx.prisma.visaCitizenshipSurcharge.findFirst({
          where: {
            citizenshipId,
            countryId,
            isGlobal: false,
            visaTypes: {
              some: {
                visaTypeId,
              },
            },
          },
          include: {
            citizenship: {
              select: {
                id: true,
                name: true,
              },
            },
            country: {
              select: {
                id: true,
                name: true,
              },
            },
            visaTypes: {
              include: {
                visaType: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });
      }

      // If no specific surcharge found, look for a global surcharge for this citizenship and country
      if (!surcharge) {
        surcharge = await ctx.prisma.visaCitizenshipSurcharge.findFirst({
          where: {
            citizenshipId,
            countryId,
            isGlobal: true,
          },
          include: {
            citizenship: {
              select: {
                id: true,
                name: true,
              },
            },
            country: {
              select: {
                id: true,
                name: true,
              },
            },
            visaTypes: {
              include: {
                visaType: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });
      }

      return {
        surcharge,
        citizenship: {
          id: citizenship.id,
          name: citizenship.name,
        },
        country: {
          id: country.id,
          name: country.name,
        },
      };
    });
