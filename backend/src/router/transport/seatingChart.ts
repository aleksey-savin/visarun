import {
  transportCreateProcedure,
  transportUpdateProcedure,
  transportDeleteProcedure,
  transportReadProcedure,
} from '../../lib/trpc.js';
import { z } from 'zod';

// Input schemas
export const zGetSeatingChartInput = z.object({
  transportId: z.string().uuid(),
});

export const zCreateSeatingChartInput = z.object({
  transportId: z.string().uuid(),
  floors: z.array(
    z.object({
      floorNumber: z.number().int().min(1),
      name: z.string().optional(),
      rows: z.array(
        z.object({
          rowNumber: z.number().int().min(1),
          rowLabel: z.string().optional(),
          seats: z.array(
            z.object({
              seatLabel: z.string().min(1),
              seatClassId: z.string().uuid(),
              isAvailable: z.boolean().default(true),
              isAisle: z.boolean().default(false),
              isWindow: z.boolean().default(false),
              isEmergency: z.boolean().default(false),
              driverSeat: z.boolean().default(false),
            })
          ),
        })
      ),
    })
  ),
});

export const zUpdateSeatingChartInput = z.object({
  transportId: z.string().uuid(),
  floors: z.array(
    z.object({
      floorNumber: z.number().int().min(1),
      name: z.string().optional(),
      rows: z.array(
        z.object({
          rowNumber: z.number().int().min(1),
          rowLabel: z.string().optional(),
          seats: z.array(
            z.object({
              seatLabel: z.string().min(1),
              seatClassId: z.string().uuid(),
              isAvailable: z.boolean().default(true),
              isAisle: z.boolean().default(false),
              isWindow: z.boolean().default(false),
              isEmergency: z.boolean().default(false),
              driverSeat: z.boolean().default(false),
            })
          ),
        })
      ),
    })
  ),
});

export const zDeleteSeatingChartInput = z.object({
  transportId: z.string().uuid(),
});

// Get seating chart
export const getSeatingChartTrpcRoute = transportReadProcedure
  .input(zGetSeatingChartInput)
  .query(async ({ input, ctx }) => {
    const seatingChart = await ctx.prisma.transportSeatingChart.findUnique({
      where: { transportId: input.transportId },
      include: {
        floors: {
          orderBy: { floorNumber: 'asc' },
          include: {
            rows: {
              orderBy: { rowNumber: 'asc' },
              include: {
                seats: {
                  orderBy: { seatLabel: 'asc' },
                  include: {
                    seatClass: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!seatingChart) {
      return { seatingChart: null };
    }

    // Calculate statistics
    const totalSeats = seatingChart.floors.reduce(
      (floorSum, floor) =>
        floorSum + floor.rows.reduce((rowSum, row) => rowSum + row.seats.length, 0),
      0
    );

    const availableSeats = seatingChart.floors.reduce(
      (floorSum, floor) =>
        floorSum +
        floor.rows.reduce(
          (rowSum, row) =>
            rowSum + row.seats.filter(seat => seat.isAvailable && !seat.driverSeat).length,
          0
        ),
      0
    );

    const seatClassCounts = seatingChart.floors.reduce(
      (counts, floor) => {
        floor.rows.forEach(row => {
          row.seats.forEach(seat => {
            if (!seat.driverSeat) {
              const className = seat.seatClass.name;
              counts[className] = (counts[className] || 0) + 1;
            }
          });
        });
        return counts;
      },
      {} as Record<string, number>
    );

    return {
      seatingChart,
      statistics: {
        totalSeats,
        availableSeats,
        driverSeats: totalSeats - availableSeats,
        seatClassCounts,
      },
    };
  });

// Create seating chart
export const createSeatingChartTrpcRoute = transportCreateProcedure
  .input(zCreateSeatingChartInput)
  .mutation(async ({ input, ctx }) => {
    // Check if transport exists
    const transport = await ctx.prisma.transport.findUnique({
      where: { id: input.transportId },
    });

    if (!transport) {
      throw new Error('Transport not found');
    }

    // Check if seating chart already exists
    const existingChart = await ctx.prisma.transportSeatingChart.findUnique({
      where: { transportId: input.transportId },
    });

    if (existingChart) {
      throw new Error('Seating chart already exists for this transport');
    }

    // Create seating chart with all nested data
    const seatingChart = await ctx.prisma.transportSeatingChart.create({
      data: {
        transportId: input.transportId,
        floors: {
          create: input.floors.map(floor => ({
            floorNumber: floor.floorNumber,
            name: floor.name,
            rows: {
              create: floor.rows.map(row => ({
                rowNumber: row.rowNumber,
                rowLabel: row.rowLabel,
                seats: {
                  create: row.seats.map(seat => ({
                    seatLabel: seat.seatLabel,
                    seatClassId: seat.seatClassId,
                    isAvailable: seat.driverSeat ? false : seat.isAvailable,
                    isAisle: seat.isAisle,
                    isWindow: seat.isWindow,
                    isEmergency: seat.isEmergency,
                    driverSeat: seat.driverSeat,
                  })),
                },
              })),
            },
          })),
        },
      },
      include: {
        floors: {
          orderBy: { floorNumber: 'asc' },
          include: {
            rows: {
              orderBy: { rowNumber: 'asc' },
              include: {
                seats: {
                  orderBy: { seatLabel: 'asc' },
                  include: {
                    seatClass: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Transport seating chart is now created (no need to update hasSeatingChart flag)

    return { seatingChart };
  });

// Update seating chart
export const updateSeatingChartTrpcRoute = transportUpdateProcedure
  .input(zUpdateSeatingChartInput)
  .mutation(async ({ input, ctx }) => {
    // Check if seating chart exists
    const existingChart = await ctx.prisma.transportSeatingChart.findUnique({
      where: { transportId: input.transportId },
    });

    if (!existingChart) {
      throw new Error('Seating chart not found for this transport');
    }

    // Delete existing chart and create new one (easier than complex updates)
    await ctx.prisma.transportSeatingChart.delete({
      where: { transportId: input.transportId },
    });

    const seatingChart = await ctx.prisma.transportSeatingChart.create({
      data: {
        transportId: input.transportId,
        floors: {
          create: input.floors.map(floor => ({
            floorNumber: floor.floorNumber,
            name: floor.name,
            rows: {
              create: floor.rows.map(row => ({
                rowNumber: row.rowNumber,
                rowLabel: row.rowLabel,
                seats: {
                  create: row.seats.map(seat => ({
                    seatLabel: seat.seatLabel,
                    seatClassId: seat.seatClassId,
                    isAvailable: seat.driverSeat ? false : seat.isAvailable,
                    isAisle: seat.isAisle,
                    isWindow: seat.isWindow,
                    isEmergency: seat.isEmergency,
                    driverSeat: seat.driverSeat,
                  })),
                },
              })),
            },
          })),
        },
      },
      include: {
        floors: {
          orderBy: { floorNumber: 'asc' },
          include: {
            rows: {
              orderBy: { rowNumber: 'asc' },
              include: {
                seats: {
                  orderBy: { seatLabel: 'asc' },
                  include: {
                    seatClass: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return { seatingChart };
  });

// Delete seating chart
export const deleteSeatingChartTrpcRoute = transportDeleteProcedure
  .input(zDeleteSeatingChartInput)
  .mutation(async ({ input, ctx }) => {
    const existingChart = await ctx.prisma.transportSeatingChart.findUnique({
      where: { transportId: input.transportId },
    });

    if (!existingChart) {
      throw new Error('Seating chart not found for this transport');
    }

    // Delete seating chart (cascades to floors, rows, and seats)
    await ctx.prisma.transportSeatingChart.delete({
      where: { transportId: input.transportId },
    });

    // Transport seating chart is now deleted (seatingChart relation will be null)

    return { success: true };
  });
