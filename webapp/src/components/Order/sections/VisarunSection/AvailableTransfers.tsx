import { useVisarunTrips } from '@/hooks/useVisarunTrips';
import useOrderStore from '@/stores/order/order-store';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPinIcon, Armchair } from 'lucide-react';

import { IconDisplay } from '@/components/ui/icon-display';

const AvailableTransfers = () => {
  const { preferredDepartureCity, preferredVisarunCountry, preferredDepartureDate } =
    useOrderStore();

  const {
    data: trips,
    isLoading,
    error,
  } = useVisarunTrips({
    preferredDepartureCityId: preferredDepartureCity?.id,
    preferredVisarunCountryId: preferredVisarunCountry?.id,
    preferredDepartureDate,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3">Loading ...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Error loading trips. Please try again later.
      </div>
    );
  }

  if (!trips || trips.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8">
        <MapPinIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">Scheduled trips not found</p>
        <p className="text-sm">Try changing the departure city, destination country, or date.</p>
      </div>
    );
  }

  const formatPrice = (price: any) => {
    if (typeof price === 'number') {
      return price.toLocaleString('ru-RU');
    }
    if (typeof price === 'string') {
      return parseFloat(price).toLocaleString('ru-RU');
    }
    return '0';
  };

  // Создаем массив карточек для каждой комбинации поездка + класс места
  const tripSeatCards = trips.flatMap((trip: any) => {
    // Если у маршрута нет цен, показываем одну карточку без класса места
    if (!trip.route.prices || trip.route.prices.length === 0) {
      return [
        {
          tripId: trip.id,
          trip,
          seatClass: null,
          price: null,
          key: `${trip.id}-no-class`,
        },
      ];
    }

    // Создаем карточку для каждого класса места
    return trip.route.prices.map((priceInfo: any) => ({
      tripId: trip.id,
      trip,
      seatClass: priceInfo.seatClass,
      price: priceInfo.price,
      key: `${trip.id}-${priceInfo.seatClass.id}`,
    }));
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tripSeatCards.map(
        ({ trip, seatClass, price, key }: { trip: any; seatClass: any; price: any; key: any }) => (
          <Card key={key} className="bg-secondary p-3">
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-start gap-3">
                <IconDisplay
                  iconFilename={seatClass.icon}
                  iconType="transport-seat"
                  alt={seatClass.name}
                  fallback={<Armchair className="h-6 w-6" />}
                />

                {/* Route stops badges */}
                <div className="flex flex-wrap gap-1 flex-1 justify-end">
                  {trip.route.routeStops?.map((stop: any, index: any) => {
                    const isFirst = index === 0;
                    const isLast = index === trip.route.routeStops.length - 1;

                    // Format time
                    const formatTime = (timeString: string) => {
                      if (!timeString) return '';
                      return timeString.slice(0, 5); // HH:MM format
                    };

                    // Format date
                    const formatDate = (date: Date) => {
                      return date.toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      });
                    };

                    // Calculate actual date/time for this stop
                    const departureDateTime = new Date(trip.departureDateTime);
                    // Show departure time for all stops except the last one, arrival time for the last stop
                    const stopTime = isLast ? stop.arrivalTime : stop.departureTime;
                    const displayTime = formatTime(stopTime);
                    const displayDate = formatDate(departureDateTime);

                    const badgeVariant = isFirst
                      ? 'default' // Green for departure
                      : isLast
                        ? 'secondary' // Pink for arrival
                        : 'outline'; // Blue for intermediate

                    const badgeClass = isFirst
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : isLast
                        ? 'bg-pink-500 text-white hover:bg-pink-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600';

                    return (
                      <Badge
                        key={stop.id}
                        variant={badgeVariant}
                        className={`text-xs px-2 py-1 ${badgeClass}`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="font-medium">
                            {displayDate} • {displayTime}
                          </span>
                          <span>{stop.city.name}</span>
                          {isLast && stop.waitingDuration && (
                            <span className="ml-1 opacity-90">
                              {Math.round(stop.waitingDuration / 60)}ч.
                            </span>
                          )}
                        </div>
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Информация о классе места и цене */}
              {seatClass && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  {price && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Стоимость:</span>
                      <span className="font-semibold text-primary">{formatPrice(price)} ₽</span>
                    </div>
                  )}
                </div>
              )}

              {/* Примечания если есть */}
              {trip.notes && (
                <div className="text-xs bg-muted/30 p-2 rounded">
                  <strong>Примечания:</strong> {trip.notes}
                </div>
              )}

              {/* Кнопка выбора */}
              <div className="pt-2">
                <Button size="sm" variant="outline" className="w-full text-xs">
                  Выбрать{seatClass ? ` ${seatClass.name}` : ''}
                </Button>
              </div>
            </div>
          </Card>
        )
      )}
    </div>
  );
};

export default AvailableTransfers;
