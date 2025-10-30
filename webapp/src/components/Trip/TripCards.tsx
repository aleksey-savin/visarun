import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card } from '../ui/card';
import { trpc } from '@/lib/trpc';

import { Trip } from '@/types/trip';
import RouteStopsBadges from '../VisarunRoute/RouteStopsBadges';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';

interface TripCardProps {
  trip: Trip;
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TripCards = ({ trip, activeTab, setActiveTab }: TripCardProps) => {
  // Sort route stops by arrival time
  const sortedStops = [...trip.route.routeStops].sort((a, b) => {
    const timeA = a.departureTime || a.arrivalTime;
    const timeB = b.departureTime || b.arrivalTime;
    return timeA.localeCompare(timeB);
  });

  const { data: passengers } = trpc.visarunPassenger.getAll.useQuery({
    tripId: trip.id,
  });

  const tabValueChangeHandler = (value: string) => {
    if (trip) {
      setActiveTab(value);
    }
  };

  return (
    <Card
      className={cn(
        'flex flex-col justify-between p-2',
        sortedStops.filter(stop => stop.id === activeTab).length > 0 ? 'bg-secondary' : '',
        trip.status === 'completed' ? 'border-success' : ''
      )}
    >
      <div className="flex flex-wrap gap-2">
        <RouteStopsBadges trip={trip} />
      </div>

      <div className="flex flex-wrap justify-between items-end">
        <div className="space-y-2">
          <Label>Passengers seating</Label>
          <Tabs value={activeTab} onValueChange={tabValueChangeHandler}>
            <TabsList>
              {sortedStops
                .filter(stop => stop.stopType !== 'arrival')
                .map(stop => (
                  <TabsTrigger key={stop.id} value={stop.id}>
                    {stop.city.name}
                    <Badge variant="secondary" className="rounded-full text-xs bg-secondary">
                      {(passengers && passengers.filter(p => p.routeStopId === stop.id).length) ||
                        0}
                    </Badge>
                  </TabsTrigger>
                ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="self-end">
          <Badge>{trip.status}</Badge>
        </div>
      </div>
    </Card>
  );
};

export default TripCards;
