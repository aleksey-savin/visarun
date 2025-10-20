import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';

import { Trip } from '@/types/trip';

interface TripCardProps {
  trip: Trip;
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TripCard = ({ trip, activeTab, setActiveTab }: TripCardProps) => {
  // Sort route stops by arrival time
  const sortedStops = [...trip.route.routeStops].sort((a, b) => {
    const timeA = a.departureTime || a.arrivalTime;
    const timeB = b.departureTime || b.arrivalTime;
    return timeA.localeCompare(timeB);
  });

  // Fetch passenger counts for each route stop
  const { data: passengerCounts } = trpc.visarunPassenger.getPassengerCountsByRouteStop.useQuery({
    tripId: trip.id,
  });

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList
        className="grid"
        style={{ gridTemplateColumns: `repeat(${sortedStops.length - 1}, 1fr)` }}
      >
        {sortedStops
          .filter(stop => stop.stopType !== 'arrival')
          .map(stop => (
            <TabsTrigger key={stop.id} value={stop.id} className="text-xs">
              {stop.city.name}
              <Badge variant="secondary" className="rounded-full text-xs bg-secondary">
                {passengerCounts?.[stop.id] || 0}
              </Badge>
            </TabsTrigger>
          ))}
      </TabsList>
    </Tabs>
  );
};

export default TripCard;
