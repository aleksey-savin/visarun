import { orderItemCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { VisaApplicationStatus } from '@prisma/client';

export const zCreateOrderItemTrpcInput = z.object({
  orderId: z.string().uuid(),
  clientId: z.string().uuid(),
  serviceType: z.enum(['visa', 'visarun']),
  serviceTypeId: z.string(),
  discountAppliedType: z.enum(['manual', 'rule']).optional(),
  discountRuleId: z.string().uuid().optional(),
  discountAmount: z.number().min(0).default(0),
  discountComment: z.string().optional(),
  note: z.string().optional(),
  basePrice: z.number().min(0),
  finalPrice: z.number().min(0),
  // Visa-specific fields
  plannedCountryEntryDate: z
    .string()
    .datetime()
    .optional()
    .transform(val => (val ? new Date(val) : undefined)),
  visaTypeId: z.string().uuid().optional(),
  applicationCode: z.string().optional(),
});

export const createOrderItemTrpcRoute = orderItemCreateProcedure
  .input(zCreateOrderItemTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if order exists
    const order = await ctx.prisma.order.findUnique({
      where: { id: input.orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Check if client exists
    const client = await ctx.prisma.client.findUnique({
      where: { id: input.clientId },
      include: {
        citizenship: true,
      },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Check if discount rule exists if provided
    if (input.discountRuleId) {
      const discountRule = await ctx.prisma.clientDiscountRule.findUnique({
        where: { id: input.discountRuleId },
      });

      if (!discountRule) {
        throw new Error('Discount rule not found');
      }

      // Check if discount rule is active
      if (!discountRule.isActive) {
        throw new Error('Discount rule is not active');
      }

      // Check if discount rule is valid for the current date
      const now = new Date();
      if (now < discountRule.validFrom || now > discountRule.validTo) {
        throw new Error('Discount rule is not valid for the current date');
      }

      // Check if discount rule applies to the service type
      if (
        discountRule.appliesToService !== 'all' &&
        discountRule.appliesToService !== input.serviceType
      ) {
        throw new Error('Discount rule does not apply to this service type');
      }
    }

    // Calculate citizenship surcharge for visa services
    let citizenshipSurcharge = 0;
    let surchargeNote = null;

    if (input.serviceType === 'visa' && client.citizenship) {
      if (client?.citizenship) {
        // Look for applicable citizenship surcharge
        const surchargeQuery = {
          citizenshipId: client.citizenship.id,
          countryId: input.serviceTypeId,
        };

        let surcharge = null;

        // If visa type is specified, look for specific surcharge first
        if (input.visaTypeId) {
          surcharge = await ctx.prisma.visaCitizenshipSurcharge.findFirst({
            where: {
              ...surchargeQuery,
              isGlobal: false,
              visaTypes: {
                some: {
                  visaTypeId: input.visaTypeId,
                },
              },
            },
            include: {
              citizenship: true,
              country: true,
            },
          });
        }

        // If no specific surcharge found, look for global surcharge
        if (!surcharge) {
          surcharge = await ctx.prisma.visaCitizenshipSurcharge.findFirst({
            where: {
              ...surchargeQuery,
              isGlobal: true,
            },
            include: {
              citizenship: true,
              country: true,
            },
          });
        }

        if (surcharge) {
          citizenshipSurcharge = surcharge.surchargeAmount;
          surchargeNote = surcharge.note;
        }
      }
    }

    // Validate discount applied type consistency
    if (input.discountAppliedType === 'rule' && !input.discountRuleId) {
      throw new Error('Discount rule ID is required when discount applied type is "rule"');
    }

    if (input.discountAppliedType === 'manual' && input.discountRuleId) {
      throw new Error(
        'Discount rule ID should not be provided when discount applied type is "manual"'
      );
    }

    // Validate visa-specific fields
    if (input.serviceType === 'visa') {
      // Check if country exists
      const country = await ctx.prisma.country.findUnique({
        where: { id: input.serviceTypeId },
      });

      if (!country) {
        throw new Error('Country not found');
      }

      // If visaTypeId is provided, validate it belongs to the country
      if (input.visaTypeId) {
        const visaType = await ctx.prisma.visaType.findUnique({
          where: { id: input.visaTypeId },
        });

        if (!visaType) {
          throw new Error('Visa type not found');
        }

        if (visaType.countryId !== input.serviceTypeId) {
          throw new Error('Visa type does not belong to the specified country');
        }
      }
    }

    // Recalculate final price including citizenship surcharge
    const adjustedFinalPrice = input.finalPrice + citizenshipSurcharge;

    // Create order item
    const orderItem = await ctx.prisma.orderItem.create({
      data: {
        orderId: input.orderId,
        clientId: input.clientId,
        serviceType: input.serviceType,
        serviceTypeId: input.serviceTypeId,
        discountAppliedType: input.discountAppliedType,
        discountRuleId: input.discountRuleId,
        discountAmount: input.discountAmount,
        discountComment: input.discountComment,
        note: surchargeNote
          ? input.note
            ? `${input.note} | Citizenship surcharge: ${surchargeNote}`
            : `Citizenship surcharge: ${surchargeNote}`
          : input.note,
        basePrice: input.basePrice,
        finalPrice: adjustedFinalPrice,
      },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                firstName: true,
                middleName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
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
        discountRule: {
          select: {
            id: true,
            name: true,
            discountType: true,
            discountValue: true,
            appliesToService: true,
          },
        },
        VisaApplication: true,
      },
    });

    // If service type is visa, create a visa application
    let visaApplication = null;
    if (input.serviceType === 'visa') {
      try {
        // Always create visa application for visa order items
        const visaTypeId = input.visaTypeId;

        const visaApplicationData: {
          orderItemId: string;
          applicationCode?: string;
          submittedByAgent: boolean;
          countryId: string;
          plannedCountryEntryDate?: Date;
          status: VisaApplicationStatus;
          visaTypeId?: string;
        } = {
          orderItemId: orderItem.id,
          submittedByAgent: false,
          countryId: input.serviceTypeId,
          plannedCountryEntryDate: input.plannedCountryEntryDate,
          status: VisaApplicationStatus.pending,
        };

        if (visaTypeId) {
          visaApplicationData.visaTypeId = visaTypeId;
        }

        if (input.applicationCode) {
          visaApplicationData.applicationCode = input.applicationCode;
        }

        visaApplication = await ctx.prisma.visaApplication.create({
          data: visaApplicationData,
          include: {
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
          },
        });
      } catch (error) {
        console.error('Failed to create visa application:', error);
        // Continue without visa application if creation fails
      }
    }

    return {
      orderItem,
      visaApplication,
      surchargeApplied:
        citizenshipSurcharge > 0
          ? {
              amount: citizenshipSurcharge,
              note: surchargeNote,
              message: `Дополнительный сбор для граждан ${client.citizenship?.name} составляет ${citizenshipSurcharge} VND`,
            }
          : null,
    };
  });
