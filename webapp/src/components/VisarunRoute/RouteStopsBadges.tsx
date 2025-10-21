import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

const RouteStopsBadges = ({ trip }: any) => {
  return (
    <>
      {trip.route.routeStops
        ?.sort((a: any, b: any) => {
          // Sort by departure time, or arrival time if departure time is not available
          const timeA = a.departureTime || a.arrivalTime;
          const timeB = b.departureTime || b.arrivalTime;
          return timeA.localeCompare(timeB);
        })
        .reduce((uniqueStops: any[], stop: any) => {
          // Only add stop if this city hasn't been added yet
          const cityAlreadyExists = uniqueStops.some(
            existingStop => existingStop.city.name === stop.city.name
          );
          if (!cityAlreadyExists) {
            uniqueStops.push(stop);
          }
          return uniqueStops;
        }, [])
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
    </>
  );
};

export default RouteStopsBadges;
