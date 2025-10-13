import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Armchair, Trash2 } from 'lucide-react';

import { IconDisplay } from '@/components/ui/icon-display';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/currency';

interface TripCardProps {
  trip: any;
  seatClass: any;
  price: number;
  badgeContent?: string | number;
  buttonText: string;
  buttonVariant?: any;
  onButtonClick: () => void;
  isButtonDisabled?: boolean;
  buttonIcon?: React.ReactNode;
  showCancelButton?: boolean;
  onCancelClick?: () => void;
}

const TripCard = ({
  trip,
  seatClass,
  price,
  badgeContent = 0,
  buttonText,
  buttonVariant = 'secondary',
  onButtonClick,
  isButtonDisabled = false,
  buttonIcon,
  showCancelButton = false,
  onCancelClick,
}: TripCardProps) => {
  return (
    <Card className="bg-secondary p-3">
      <div className="flex flex-col space-y-3">
        <div className="flex flex-col space-y-3">
          <div className="flex justify-between">
            <IconDisplay
              iconFilename={seatClass?.icon}
              iconType="transport-seat"
              alt={seatClass?.name}
              fallback={<Armchair className="h-6 w-6" />}
            />
            <Badge variant="default" className="rounded-xl">
              {badgeContent}
            </Badge>
          </div>

          <div className="flex items-start gap-3">
            {/* Route stops badges */}
            <div className="flex flex-wrap gap-2 flex-1">
              {trip.route.routeStops
                ?.sort((a: any, b: any) => {
                  // Sort by departure time, or arrival time if departure time is not available
                  const timeA = a.departureTime || a.arrivalTime;
                  const timeB = b.departureTime || b.arrivalTime;
                  return timeA.localeCompare(timeB);
                })
                .map((stop: any) => {
                  const isFirst = stop.stopType === 'departure';
                  const isLast = stop.stopType === 'arrival';

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
                    ? 'secondary-green' // Green for departure
                    : isLast
                      ? 'secondary-pink' // Pink for arrival
                      : 'secondary-blue'; // Blue for intermediate

                  return (
                    <div className="flex flex-row items-center" key={stop.id}>
                      <Badge variant={badgeVariant} className={`text-xs px-2 py-1 rounded-r-none`}>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">
                            {displayDate} • {displayTime}
                          </span>
                        </div>
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={cn(
                          `text-xs px-2 py-1 rounded-l-none bg-secondary border border-l-0 border-[#3F3F46]`,
                          isLast ? 'rounded-r-none border-r-0' : ''
                        )}
                      >
                        <span>{stop.city.name}</span>
                      </Badge>
                      {isLast && stop.waitingDuration && (
                        <Badge variant="secondary" className="rounded-l-none bg-[#3F3F46]">
                          {Math.round(stop.waitingDuration / 60)}h.
                        </Badge>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <div className="font-semibold text-primary flex-shrink-0">{formatCurrency(price)}</div>
            <div className="flex-1 flex gap-2">
              <Button
                size="sm"
                variant={buttonVariant}
                className={showCancelButton ? 'flex-1' : 'w-full'}
                onClick={onButtonClick}
                disabled={isButtonDisabled}
              >
                {buttonText}
                {buttonIcon && buttonIcon}
              </Button>
              {showCancelButton && onCancelClick && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="px-3"
                  onClick={onCancelClick}
                  title="Cancel booking"
                >
                  Cancel <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TripCard;
