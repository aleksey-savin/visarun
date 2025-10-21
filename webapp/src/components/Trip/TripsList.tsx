import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { Trip } from '@/types/trip';
import { IconDisplay } from '@/components/ui/icon-display';
import { Armchair } from 'lucide-react';
import TripTabs from './TripTabs';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

import ClientBadge from '@/components/Client/ClientBadge';

interface TripsListProps {
  trips: Trip[];
}

const TripsList = ({ trips }: TripsListProps) => {
  const [activeTab, setActiveTab] = useState(trips[0]?.route.routeStops[0]?.id || '');

  // Find the trip and stop for the selected tab
  const selectedTripAndStop = activeTab
    ? (() => {
        for (const trip of trips) {
          const sortedStops = [...trip.route.routeStops].sort((a, b) => {
            const timeA = a.departureTime || a.arrivalTime;
            const timeB = b.departureTime || b.arrivalTime;
            return timeA.localeCompare(timeB);
          });
          const selectedStop = sortedStops.find(stop => stop.id === activeTab);
          if (selectedStop) {
            return { trip, stop: selectedStop };
          }
        }
        return null;
      })()
    : null;

  const { data: passengers } = trpc.visarunPassenger.getAll.useQuery(
    {
      tripId: selectedTripAndStop?.trip.id || '',
    },
    {
      enabled: !!selectedTripAndStop?.trip.id,
    }
  );

  if (trips.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-lg">No trips available for this date</p>
      </div>
    );
  }

  const stopPassengers = passengers?.filter(p => p.routeStopId === activeTab) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {trips.map(trip => (
          <TripTabs key={trip.id} trip={trip} activeTab={activeTab} setActiveTab={setActiveTab} />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          {activeTab && selectedTripAndStop && selectedTripAndStop.stop.stopType !== 'arrival' && (
            <div className="space-y-4">
              {(() => {
                // Group passengers by seatClass
                const groupedPassengers = stopPassengers
                  .filter(passenger => !passenger.tripTransportId)
                  .reduce(
                    (groups, passenger) => {
                      const seatClass = passenger.seatClass;
                      const seatClassKey = passenger.seatClassId || 'unknown';
                      if (!groups[seatClassKey]) {
                        groups[seatClassKey] = {
                          seatClass: seatClass,
                          passengers: [],
                        };
                      }
                      groups[seatClassKey].passengers.push(passenger);
                      return groups;
                    },
                    {} as Record<string, { seatClass: any; passengers: typeof stopPassengers }>
                  );

                return Object.keys(groupedPassengers).length > 0 ? (
                  Object.entries(groupedPassengers).map(
                    ([seatClassKey, { seatClass, passengers }]) => (
                      <Card key={seatClassKey} className="p-3 h-80 flex flex-col bg-secondary">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconDisplay
                              iconFilename={seatClass?.icon}
                              iconType="transport-seat"
                              alt={seatClass?.name}
                              size="md"
                              fallback={<Armchair className="h-6 w-6" />}
                            />
                            <h4 className="text-lg font-semibold">
                              {seatClass?.name || `Seat Class ${seatClassKey}`}
                            </h4>
                          </div>
                          <Badge variant="default" className="rounded-full">
                            {passengers.length}
                          </Badge>
                        </div>
                        <Separator />
                        <ScrollArea className="min-h-0">
                          <div className="space-y-2 pr-3">
                            {passengers.map(passenger => (
                              <div key={passenger.id} className="flex w-full">
                                <ClientBadge client={passenger.client} fullWidth={true} />
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </Card>
                    )
                  )
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground italic">
                        No passengers for this stop
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripsList;
