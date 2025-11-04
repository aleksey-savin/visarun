import { visarunScheduleCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateVisarunScheduleTrpcInput = z.object({
  routeId: z.string().uuid('Invalid route ID'),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1, 'At least one day must be selected'),
  departureTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Departure time must be in HH:MM format'),
  validFrom: z.string().transform(str => new Date(str)),
  validTo: z
    .string()
    .nullable()
    .optional()
    .transform(str => (str ? new Date(str) : null)),
  autoGeneratePeriodMonths: z.number().int().min(1).max(24).optional().default(12),
  isActive: z.boolean().optional().default(true),
});

// Interface for trip data with optional transports
interface TripData {
  scheduleId: string;
  routeId: string;
  departureDateTime: Date;
  status: 'scheduled';
  isFromSchedule: boolean;
  transports?: {
    create: Array<{
      transportId: string;
      status: 'added';
    }>;
  };
}

// Helper function to generate trips based on schedule
function generateTripsFromSchedule(
  scheduleId: string,
  routeId: string,
  daysOfWeek: number[],
  departureTime: string,
  validFrom: Date,
  validTo: Date | null,
  periodMonths: number,
  defaultTransportId?: string
) {
  const trips: TripData[] = [];

  // Calculate end date - either validTo or validFrom + autoGeneratePeriodMonths
  const endDate =
    validTo ||
    new Date(validFrom.getFullYear(), validFrom.getMonth() + periodMonths, validFrom.getDate());

  // Parse departure time
  const [hours, minutes] = departureTime.split(':').map(Number);

  // Start from validFrom date
  const currentDate = new Date(validFrom);
  currentDate.setHours(hours, minutes, 0, 0);

  // Generate trips for each matching day within the date range
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday

    if (daysOfWeek.includes(dayOfWeek)) {
      const tripData: TripData = {
        scheduleId,
        routeId,
        departureDateTime: new Date(currentDate),
        status: 'scheduled',
        isFromSchedule: true,
      };

      // Add default transport if available
      if (defaultTransportId) {
        tripData.transports = {
          create: [
            {
              transportId: defaultTransportId,
              status: 'added',
            },
          ],
        };
      }

      trips.push(tripData);
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return trips;
}

export const createVisarunScheduleTrpcRoute = visarunScheduleCreateProcedure
  .input(zCreateVisarunScheduleTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if route exists and get default transport
    const route = await ctx.prisma.visarunRoute.findUnique({
      where: { id: input.routeId },
      include: {
        transports: {
          where: {
            isActive: true,
            isDefault: true,
          },
          include: {
            transport: true,
          },
        },
      },
    });

    if (!route) {
      throw new Error('Route not found');
    }

    // Get the default transport ID if available
    const defaultTransport = route.transports.find(rt => rt.isDefault);
    const defaultTransportId = defaultTransport?.transportId;

    // Validate date range
    if (input.validTo && input.validFrom >= input.validTo) {
      throw new Error('Valid from date must be before valid to date');
    }

    // Validate days of week (0 = Sunday, 6 = Saturday)
    const uniqueDays = [...new Set(input.daysOfWeek)];
    if (uniqueDays.length !== input.daysOfWeek.length) {
      throw new Error('Duplicate days of week are not allowed');
    }

    // Use Prisma transaction to ensure atomicity
    const result = await ctx.prisma.$transaction(async tx => {
      // Create the schedule
      const schedule = await tx.visarunSchedule.create({
        data: {
          routeId: input.routeId,
          daysOfWeek: input.daysOfWeek,
          departureTime: input.departureTime,
          validFrom: input.validFrom,
          validTo: input.validTo,
          autoGeneratePeriodMonths: input.autoGeneratePeriodMonths,
          isActive: input.isActive,
          createdById: ctx.user?.id,
        },
      });

      // Generate trips based on the schedule
      const tripsData = generateTripsFromSchedule(
        schedule.id,
        input.routeId,
        input.daysOfWeek,
        input.departureTime,
        input.validFrom,
        input.validTo,
        input.autoGeneratePeriodMonths,
        defaultTransportId
      );

      // Create all trips with transports if available
      if (tripsData.length > 0) {
        if (defaultTransportId) {
          // Create trips individually with transports
          for (const tripData of tripsData) {
            await tx.visarunTrip.create({
              data: {
                scheduleId: tripData.scheduleId,
                routeId: tripData.routeId,
                departureDateTime: tripData.departureDateTime,
                status: tripData.status,
                isFromSchedule: tripData.isFromSchedule,
                transports: tripData.transports,
              },
            });
          }
        } else {
          // Create trips in bulk without transports
          await tx.visarunTrip.createMany({
            data: tripsData,
          });
        }
      }

      // Return the schedule with related data
      return await tx.visarunSchedule.findUnique({
        where: { id: schedule.id },
        include: {
          route: {
            include: {
              routeStops: {
                include: {
                  city: true,
                },
                orderBy: {
                  stopOrder: 'asc',
                },
              },
              transports: {
                include: {
                  transport: {
                    include: {
                      transportType: true,
                    },
                  },
                },
                where: {
                  isActive: true,
                },
              },
            },
          },
          trips: {
            take: 10, // Show more trips since we just created them
            orderBy: {
              departureDateTime: 'asc',
            },
          },
        },
      });
    });

    return {
      schedule: result,
      tripsGenerated: result?.trips.length || 0,
    };
  });
