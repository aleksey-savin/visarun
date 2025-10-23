import { visarunTripReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { AppContext } from '../../lib/ctx.js';

export const zGetAllVisarunTripsTrpcInput = z
  .object({
    routeId: z.string().uuid().optional(),
    scheduleId: z.string().uuid().optional(),
    status: z.enum(['scheduled', 'in_process', 'completed']).optional(),
    departureFrom: z
      .string()
      .transform(str => new Date(str))
      .optional(),
    departureTo: z
      .string()
      .transform(str => new Date(str))
      .optional(),
    isFromSchedule: z.boolean().optional(),
    // Новые параметры для фильтрации по предпочтениям клиента
    preferredDepartureCityId: z.string().uuid().optional(),
    preferredVisarunCountryId: z.string().uuid().optional(),
    preferredDepartureDate: z
      .string()
      .transform(str => new Date(str))
      .optional(),
    limit: z.number().int().min(1).max(100).optional().default(20),
    offset: z.number().int().min(0).optional().default(0),
  })
  .optional();

export const getAllVisarunTripsTrpcRoute = visarunTripReadProcedure
  .input(zGetAllVisarunTripsTrpcInput)
  .query(async ({ input, ctx }) => {
    // Если есть параметры для умного поиска поездок
    if (
      input?.preferredDepartureCityId &&
      input?.preferredVisarunCountryId &&
      input?.preferredDepartureDate
    ) {
      return await getSmartVisarunTrips({
        preferredDepartureCityId: input.preferredDepartureCityId,
        preferredVisarunCountryId: input.preferredVisarunCountryId,
        preferredDepartureDate: input.preferredDepartureDate,
        ctx,
      });
    }

    // Стандартный поиск поездок
    const where = {
      ...(input?.routeId && { routeId: input.routeId }),
      ...(input?.scheduleId && { scheduleId: input.scheduleId }),
      ...(input?.status && { status: input.status }),
      ...(input?.isFromSchedule !== undefined && { isFromSchedule: input.isFromSchedule }),
      ...((input?.departureFrom || input?.departureTo) && {
        departureDateTime: {
          ...(input.departureFrom && { gte: input.departureFrom }),
          ...(input.departureTo && { lte: input.departureTo }),
        },
      }),
    };

    const trips = await ctx.prisma.visarunTrip.findMany({
      where,
      skip: input?.offset ?? 0,
      take: input?.limit ?? 999,
      orderBy: {
        departureDateTime: 'asc',
      },
      include: {
        route: {
          select: {
            id: true,
            name: true,
            prices: {
              select: {
                id: true,
                price: true,
                seatClass: {
                  select: {
                    id: true,
                    name: true,
                    icon: true,
                  },
                },
              },
            },
            transports: {
              where: {
                isActive: true,
              },
              select: {
                id: true,
                transport: {
                  select: {
                    id: true,
                    name: true,
                    seatCount: true,
                    transportType: {
                      select: {
                        id: true,
                        icon: true,
                        name: true,
                      },
                    },
                    seatingChart: {
                      select: {
                        id: true,
                        transportId: true,
                      },
                    },
                  },
                },
              },
            },
            routeStops: {
              select: {
                id: true,
                cityId: true,
                stopType: true,
                pickupMode: true,
                arrivalTime: true,
                departureTime: true,
                waitingDuration: true,
                city: {
                  select: {
                    id: true,
                    name: true,
                    country: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
                pickupLocations: {
                  select: {
                    id: true,
                    pickupLocation: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                arrivalTime: 'asc',
              },
            },
          },
        },
        schedule: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Flatten transports array to remove nested structure
    const flattenedTrips = trips.map(trip => ({
      ...trip,
      route: {
        ...trip.route,
        transports: trip.route.transports.map(t => t.transport),
      },
    }));

    return flattenedTrips;
  });

// Функция для умного поиска поездок на основе предпочтений клиента
async function getSmartVisarunTrips(params: {
  preferredDepartureCityId: string;
  preferredVisarunCountryId: string;
  preferredDepartureDate: Date;
  ctx: AppContext;
}) {
  const { preferredDepartureCityId, preferredVisarunCountryId, preferredDepartureDate, ctx } =
    params;
  // Найти подходящие маршруты
  const suitableRoutes = await ctx.prisma.visarunRoute.findMany({
    where: {
      isActive: true,
      routeStops: {
        some: {
          AND: [
            // Есть остановка (departure или intermediate) в предпочитаемом городе
            {
              cityId: preferredDepartureCityId,
              stopType: {
                in: ['departure', 'intermediate'],
              },
            },
          ],
        },
      },
      AND: {
        routeStops: {
          some: {
            // И есть остановка прибытия в предпочитаемой стране
            city: {
              countryId: preferredVisarunCountryId,
            },
            stopType: 'arrival',
          },
        },
      },
    },
    select: {
      id: true,
    },
  });

  const routeIds = suitableRoutes.map(route => route.id);

  if (routeIds.length === 0) {
    return [];
  }

  // Начало и конец предпочитаемой даты (работаем только с датами, игнорируем время)
  const targetDate = new Date(preferredDepartureDate);

  // Создаем начало и конец дня в UTC, чтобы избежать проблем с часовыми поясами
  const startOfDay = new Date(
    Date.UTC(
      targetDate.getUTCFullYear(),
      targetDate.getUTCMonth(),
      targetDate.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );

  const endOfDay = new Date(
    Date.UTC(
      targetDate.getUTCFullYear(),
      targetDate.getUTCMonth(),
      targetDate.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );

  // 1. Сначала ищем поездки в статусе scheduled на выбранную дату
  const scheduledTripsOnDate = await ctx.prisma.visarunTrip.findMany({
    where: {
      routeId: {
        in: routeIds,
      },
      status: 'scheduled',
      departureDateTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: {
      departureDateTime: 'asc',
    },
    include: {
      route: {
        select: {
          id: true,
          name: true,
          prices: {
            select: {
              id: true,
              price: true,
              seatClass: {
                select: {
                  id: true,
                  name: true,
                  icon: true,
                },
              },
            },
          },
          transports: {
            where: {
              isActive: true,
            },
            select: {
              id: true,
              transport: {
                select: {
                  id: true,
                  name: true,
                  seatCount: true,
                  transportType: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  seatingChart: {
                    select: {
                      id: true,
                      transportId: true,
                    },
                  },
                },
              },
            },
          },
          routeStops: {
            select: {
              id: true,
              cityId: true,
              stopType: true,
              pickupMode: true,
              arrivalTime: true,
              departureTime: true,
              waitingDuration: true,
              city: {
                select: {
                  id: true,
                  name: true,
                  country: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              pickupLocations: {
                select: {
                  id: true,
                  pickupLocation: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              arrivalTime: 'asc',
            },
          },
        },
      },
      schedule: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Flatten transports for scheduled trips on date
  const flattenedScheduledTrips = scheduledTripsOnDate.map(trip => ({
    ...trip,
    route: {
      ...trip.route,
      transports: trip.route.transports.map(t => t.transport),
    },
  }));

  // Если есть поездки на выбранную дату - возвращаем их
  if (flattenedScheduledTrips.length > 0) {
    return flattenedScheduledTrips;
  }

  // 2. Если нет поездок на выбранную дату, ищем ближайшие
  // Ближайшую до выбранной даты
  const tripBefore = await ctx.prisma.visarunTrip.findFirst({
    where: {
      routeId: {
        in: routeIds,
      },
      status: 'scheduled',
      departureDateTime: {
        lt: startOfDay,
      },
    },
    orderBy: {
      departureDateTime: 'desc', // Ближайшая к дате (самая поздняя из тех что раньше)
    },
    include: {
      route: {
        select: {
          id: true,
          name: true,
          prices: {
            select: {
              id: true,
              price: true,
              seatClass: {
                select: {
                  id: true,
                  name: true,
                  icon: true,
                },
              },
            },
          },
          transports: {
            where: {
              isActive: true,
            },
            select: {
              id: true,
              transport: {
                select: {
                  id: true,
                  name: true,
                  seatCount: true,
                  transportType: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  seatingChart: {
                    select: {
                      id: true,
                      transportId: true,
                    },
                  },
                },
              },
            },
          },
          routeStops: {
            select: {
              id: true,
              cityId: true,
              stopType: true,
              pickupMode: true,
              arrivalTime: true,
              departureTime: true,
              waitingDuration: true,
              city: {
                select: {
                  id: true,
                  name: true,
                  country: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              pickupLocations: {
                select: {
                  id: true,
                  pickupLocation: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              arrivalTime: 'asc',
            },
          },
        },
      },
      schedule: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Две поездки после выбранной даты
  const tripsAfter = await ctx.prisma.visarunTrip.findMany({
    where: {
      routeId: {
        in: routeIds,
      },
      status: 'scheduled',
      departureDateTime: {
        gt: endOfDay,
      },
    },
    orderBy: {
      departureDateTime: 'asc', // Ближайшие к дате
    },
    take: 2,
    include: {
      route: {
        select: {
          id: true,
          name: true,
          prices: {
            select: {
              id: true,
              price: true,
              seatClass: {
                select: {
                  id: true,
                  name: true,
                  icon: true,
                },
              },
            },
          },
          transports: {
            where: {
              isActive: true,
            },
            select: {
              id: true,
              transport: {
                select: {
                  id: true,
                  name: true,
                  seatCount: true,
                  transportType: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  seatingChart: {
                    select: {
                      id: true,
                      transportId: true,
                    },
                  },
                },
              },
            },
          },
          routeStops: {
            select: {
              id: true,
              cityId: true,
              stopType: true,
              pickupMode: true,
              arrivalTime: true,
              departureTime: true,
              waitingDuration: true,
              city: {
                select: {
                  id: true,
                  name: true,
                  country: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              pickupLocations: {
                select: {
                  id: true,
                  pickupLocation: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              arrivalTime: 'asc',
            },
          },
        },
      },
      schedule: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Flatten transports and combine results
  const result = [];
  if (tripBefore) {
    result.push({
      ...tripBefore,
      route: {
        ...tripBefore.route,
        transports: tripBefore.route.transports.map(t => t.transport),
      },
    });
  }
  result.push(
    ...tripsAfter.map(trip => ({
      ...trip,
      route: {
        ...trip.route,
        transports: trip.route.transports.map(t => t.transport),
      },
    }))
  );

  // Сортируем по дате отправления
  return result.sort((a, b) => a.departureDateTime.getTime() - b.departureDateTime.getTime());
}
