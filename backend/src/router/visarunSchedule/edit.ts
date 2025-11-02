import { visarunScheduleUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

// Helper function to generate trips based on schedule
function generateTripsFromSchedule(
  scheduleId: string,
  routeId: string,
  daysOfWeek: number[],
  departureTime: string,
  validFrom: Date,
  validTo: Date | null,
  periodMonths: number,
  existingTrips?: Array<{ routeId: string; departureDateTime: Date }>
) {
  const trips: Array<{
    scheduleId: string;
    routeId: string;
    departureDateTime: Date;
    status: 'scheduled';
    isFromSchedule: boolean;
  }> = [];

  // Create a set of existing departure datetimes for this route for quick lookup
  const existingDepartureTimes = new Set<string>();
  if (existingTrips) {
    for (const trip of existingTrips) {
      if (trip.routeId === routeId) {
        existingDepartureTimes.add(trip.departureDateTime.toISOString());
      }
    }
  }

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
      const departureDateTime = new Date(currentDate);

      // Check if trip with same routeId and departureDateTime already exists
      if (!existingDepartureTimes.has(departureDateTime.toISOString())) {
        trips.push({
          scheduleId,
          routeId,
          departureDateTime,
          status: 'scheduled',
          isFromSchedule: true,
        });
        existingDepartureTimes.add(departureDateTime.toISOString());
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return trips;
}

export const zEditVisarunScheduleTrpcInput = z.object({
  id: z.string().uuid('Invalid schedule ID'),
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  daysOfWeek: z
    .array(z.number().int().min(0).max(6))
    .min(1, 'At least one day must be selected')
    .optional(),
  departureTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Departure time must be in HH:MM format')
    .optional(),
  validFrom: z
    .string()
    .optional()
    .transform(str => (str ? new Date(str) : undefined)),
  validTo: z
    .string()
    .nullable()
    .optional()
    .transform(str => (str ? new Date(str) : null)),
  autoGeneratePeriodMonths: z.number().int().min(1).max(24).optional(),
  isActive: z.boolean().optional(),
  routeStops: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        cityId: z.string().uuid('Invalid city ID'),
        stopOrder: z.number().int().positive('Stop order must be positive'),
        stopType: z.enum(['departure', 'intermediate', 'arrival']),
        pickupMode: z.enum(['location', 'address']),
        pickupLocationId: z.string().uuid().optional(),
        arrivalTime: z.string().optional(),
        departureTime: z.string().optional(),
        arrivalNextDay: z.boolean().optional().default(false),
        waitingDuration: z
          .number()
          .int()
          .min(0, 'Waiting duration must be non-negative')
          .optional(),
      })
    )
    .optional(),
});

export const editVisarunScheduleTrpcRoute = visarunScheduleUpdateProcedure
  .input(zEditVisarunScheduleTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, routeStops, ...updateData } = input;

    // Check if schedule exists
    const existingSchedule = await ctx.prisma.visarunSchedule.findUnique({
      where: { id },
      include: {
        route: true,
        trips: {
          where: {
            departureDateTime: {
              gte: new Date(),
            },
          },
          take: 1,
        },
      },
    });

    if (!existingSchedule) {
      throw new Error('Schedule not found');
    }

    // Validate date range if being updated
    const finalValidFrom = updateData.validFrom ?? existingSchedule.validFrom;
    const finalValidTo = updateData.validTo ?? existingSchedule.validTo;

    if (finalValidTo && finalValidFrom >= finalValidTo) {
      throw new Error('Valid from date must be before valid to date');
    }

    // Validate days of week if being updated
    if (updateData.daysOfWeek) {
      const uniqueDays = [...new Set(updateData.daysOfWeek)];
      if (uniqueDays.length !== updateData.daysOfWeek.length) {
        throw new Error('Duplicate days of week are not allowed');
      }
    }

    // Check if name is being updated and conflicts with another schedule
    if (updateData.name && updateData.name !== existingSchedule.name) {
      const nameConflict = await ctx.prisma.visarunSchedule.findFirst({
        where: {
          routeId: existingSchedule.routeId,
          name: updateData.name,
          id: {
            not: id,
          },
        },
      });

      if (nameConflict) {
        throw new Error('Schedule with this name already exists for this route');
      }
    }

    // Check for overlapping active schedules if days or validity period changes
    if (
      (updateData.daysOfWeek || updateData.validFrom || updateData.validTo !== undefined) &&
      updateData.isActive !== false
    ) {
      const finalDaysOfWeek = updateData.daysOfWeek ?? existingSchedule.daysOfWeek;

      const overlappingSchedules = await ctx.prisma.visarunSchedule.findMany({
        where: {
          routeId: existingSchedule.routeId,
          isActive: true,
          id: {
            not: id,
          },
          AND: [
            {
              OR: [{ validTo: null }, { validTo: { gte: finalValidFrom } }],
            },
            {
              validFrom: finalValidTo ? { lte: finalValidTo } : undefined,
            },
          ],
        },
      });

      // Check for day conflicts
      for (const schedule of overlappingSchedules) {
        const scheduleDays = Array.isArray(schedule.daysOfWeek)
          ? (schedule.daysOfWeek as number[])
          : [];
        const finalDaysArray = Array.isArray(finalDaysOfWeek) ? (finalDaysOfWeek as number[]) : [];
        const hasConflict = finalDaysArray.some(day => scheduleDays.includes(day));

        if (hasConflict) {
          throw new Error(
            `Schedule conflicts with existing active schedule "${schedule.name}" on overlapping days and time period`
          );
        }
      }
    }

    // If schedule parameters that affect trip generation are being updated,
    // we need to regenerate scheduled trips without passengers
    const needsToRegenerateTrips =
      updateData.daysOfWeek ||
      updateData.departureTime ||
      updateData.validFrom ||
      updateData.validTo !== undefined ||
      updateData.autoGeneratePeriodMonths ||
      routeStops; // Route stops changes also require trip regeneration

    // Use Prisma transaction to ensure atomicity
    const result = await ctx.prisma.$transaction(async tx => {
      // Handle route stops update if provided
      if (routeStops) {
        // Get existing route stops
        const existingStops = await tx.visarunRouteStop.findMany({
          where: {
            routeId: existingSchedule.routeId,
          },
          include: {
            pickupLocations: true,
          },
        });

        // Create a map of existing stops by cityId
        const existingStopsByCityId = new Map(existingStops.map(stop => [stop.cityId, stop]));

        // Track which cityIds are in the new route stops
        const newCityIds = new Set(routeStops.map(stop => stop.cityId));

        // Delete stops that are no longer in the route
        await tx.visarunRouteStop.deleteMany({
          where: {
            routeId: existingSchedule.routeId,
            cityId: {
              notIn: Array.from(newCityIds),
            },
          },
        });

        // First pass: Update all existing stops with temporary high stopOrder values to avoid unique constraint conflicts
        const existingStopsToUpdate = Array.from(existingStopsByCityId.values());
        for (let i = 0; i < existingStopsToUpdate.length; i++) {
          const existingStop = existingStopsToUpdate[i];
          // Use a temporary stopOrder starting from 1000 to avoid conflicts
          await tx.visarunRouteStop.update({
            where: { id: existingStop.id },
            data: {
              stopOrder: 1000 + i,
            },
          });
        }

        // Second pass: Process each route stop and assign correct stopOrder
        for (let i = 0; i < routeStops.length; i++) {
          const stop = routeStops[i];
          const expectedStopOrder = i + 1;
          const existingStop = existingStopsByCityId.get(stop.cityId);

          if (existingStop) {
            // Update existing stop with correct order and other fields
            await tx.visarunRouteStop.update({
              where: { id: existingStop.id },
              data: {
                stopOrder: expectedStopOrder,
                stopType: stop.stopType,
                pickupMode: stop.pickupMode,
                arrivalTime: stop.arrivalTime,
                departureTime: stop.departureTime,
                arrivalNextDay: stop.arrivalNextDay,
                waitingDuration: stop.waitingDuration,
              },
            });

            // Handle pickup location updates
            if (stop.pickupLocationId) {
              // Remove existing pickup locations
              await tx.visarunStopPickupLocation.deleteMany({
                where: { routeStopId: existingStop.id },
              });

              // Add new pickup location
              await tx.visarunStopPickupLocation.create({
                data: {
                  routeStopId: existingStop.id,
                  pickupLocationId: stop.pickupLocationId,
                },
              });
            } else {
              // Remove pickup locations if none specified
              await tx.visarunStopPickupLocation.deleteMany({
                where: { routeStopId: existingStop.id },
              });
            }
          } else {
            // Create new stop
            const newStop = await tx.visarunRouteStop.create({
              data: {
                routeId: existingSchedule.routeId,
                cityId: stop.cityId,
                stopOrder: expectedStopOrder,
                stopType: stop.stopType,
                pickupMode: stop.pickupMode,
                arrivalTime: stop.arrivalTime,
                departureTime: stop.departureTime,
                arrivalNextDay: stop.arrivalNextDay,
                waitingDuration: stop.waitingDuration,
              },
            });

            // Handle pickup location if provided
            if (stop.pickupLocationId) {
              await tx.visarunStopPickupLocation.create({
                data: {
                  routeStopId: newStop.id,
                  pickupLocationId: stop.pickupLocationId,
                },
              });
            }
          }
        }
      }

      if (needsToRegenerateTrips) {
        // Delete only scheduled trips without passengers (from the future)
        await tx.visarunTrip.deleteMany({
          where: {
            scheduleId: id,
            status: 'scheduled',
            isFromSchedule: true,
            departureDateTime: {
              gte: new Date(),
            },
            // Only delete trips without passengers
            passengers: {
              none: {},
            },
          },
        });
      }

      // Update the schedule
      await tx.visarunSchedule.update({
        where: { id },
        data: {
          ...updateData,
          updatedById: ctx.user?.id,
        },
      });

      // Generate new trips if needed
      if (needsToRegenerateTrips) {
        const finalDaysOfWeek = updateData.daysOfWeek ?? existingSchedule.daysOfWeek;
        const finalDepartureTime = updateData.departureTime ?? existingSchedule.departureTime;
        const finalAutoGeneratePeriodMonths =
          updateData.autoGeneratePeriodMonths ?? existingSchedule.autoGeneratePeriodMonths;

        // Generate new trips starting from today or validFrom, whichever is later
        const today = new Date();
        const startDate = finalValidFrom > today ? finalValidFrom : today;

        // Fetch existing trips for this route to avoid duplicates
        const existingTripsForRoute = await tx.visarunTrip.findMany({
          where: {
            routeId: existingSchedule.routeId,
          },
          select: {
            routeId: true,
            departureDateTime: true,
          },
        });

        const tripsData = generateTripsFromSchedule(
          id,
          existingSchedule.routeId,
          Array.isArray(finalDaysOfWeek) ? (finalDaysOfWeek as number[]) : [],
          finalDepartureTime,
          startDate,
          finalValidTo,
          finalAutoGeneratePeriodMonths,
          existingTripsForRoute
        );

        // Create all trips in bulk
        if (tripsData.length > 0) {
          await tx.visarunTrip.createMany({
            data: tripsData,
          });
        }
      }

      // Return the schedule with related data
      return await tx.visarunSchedule.findUnique({
        where: { id },
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
            take: 5,
            orderBy: {
              departureDateTime: 'asc',
            },
            where: {
              departureDateTime: {
                gte: new Date(),
              },
            },
          },
        },
      });
    });

    return {
      schedule: result,
      tripsRegenerated: needsToRegenerateTrips,
    };
  });
