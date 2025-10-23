import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { Trip } from '@/types/trip';
import { IconDisplay } from '@/components/ui/icon-display';
import { Armchair } from 'lucide-react';
import TripCards from './TripCards';
import TripTransportsList from './TripTransportsList';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import PassengersListCard from './PassengersListCard';
import OrderInfoDialog from './OrderInfoDialog';

import { Button } from '../ui/button';

interface TripsListProps {
  trips: Trip[];
}

const TripsList = ({ trips }: TripsListProps) => {
  const [activeTab, setActiveTab] = useState(trips[0]?.route.routeStops[0]?.id || '');
  const [selectedTransport, setSelectedTransport] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOrderInfoDialogOpen, setIsOrderInfoDialogOpen] = useState(false);
  const [selectedOrderInfo, setSelectedOrderInfo] = useState<any>(null);

  const [formData, setFormData] = useState({
    driverName: '',
    driverPhone: '',
    vehicleNumber: '',
  });

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

  const { data: tripTransports } = trpc.visarunTripTransport.getByTripIds.useQuery(
    {
      tripIds: selectedTripAndStop?.trip.id ? [selectedTripAndStop.trip.id] : [],
    },
    {
      enabled: !!selectedTripAndStop?.trip.id,
    }
  );

  const utils = trpc.useContext();
  const createTripTransportMutation = trpc.visarunTripTransport.create.useMutation({
    onSuccess: () => {
      // Reset form and close dialog
      setFormData({
        driverName: '',
        driverPhone: '',
        vehicleNumber: '',
      });
      setIsDialogOpen(false);
      setSelectedTransport(null);
      // Refetch passengers data and trip transports to update the UI
      utils.visarunPassenger.getAll.invalidate();
      utils.visarunTripTransport.getByTripIds.invalidate();
    },
    onError: error => {
      console.error('Failed to add transport:', error.message);
      // You can add toast notification here if available
    },
  });

  if (trips.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-lg">No trips available for this date</p>
      </div>
    );
  }

  const stopPassengers = passengers?.filter(p => p.routeStopId === activeTab) || [];

  const addTransportHandler = () => {
    if (!selectedTransport || !selectedTripAndStop?.trip.id) {
      console.warn('No transport selected or trip not found');
      return;
    }
    setIsDialogOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransport || !selectedTripAndStop?.trip.id) {
      console.warn('Missing required data for transport creation');
      return;
    }

    createTripTransportMutation.mutate({
      tripId: selectedTripAndStop.trip.id,
      transportId: selectedTransport,
      driverName: formData.driverName.trim() || undefined,
      driverPhone: formData.driverPhone.trim() || undefined,
      vehicleNumber: formData.vehicleNumber.trim() || undefined,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {trips.map(trip => (
          <TripCards key={trip.id} trip={trip} activeTab={activeTab} setActiveTab={setActiveTab} />
        ))}
      </div>
      <Separator />
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
                            <PassengersListCard
                              passengers={passengers}
                              showInfoButton={true}
                              showPaymentStatus={true}
                              isDraggable={true}
                              onInfoClick={order => {
                                setSelectedOrderInfo(order);
                                setIsOrderInfoDialogOpen(true);
                              }}
                            />
                          </div>
                        </ScrollArea>
                      </Card>
                    )
                  )
                ) : (
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-sm text-muted-foreground text-center">
                        No passengers for this stop
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          )}
        </div>
        {stopPassengers.length > 0 && (
          <div className="col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <TripTransportsList
                tripTransports={tripTransports || []}
                tripId={selectedTripAndStop?.trip.id}
              />
              <Card className=" p-3 h-fit">
                <div className="flex flex-wrap gap-2">
                  {selectedTripAndStop?.trip.route?.transports?.map(transport => (
                    <Button
                      className="flex gap-2 items-center"
                      key={transport.id}
                      variant={selectedTransport === transport.id ? 'accent' : 'secondary'}
                      value={transport.id}
                      onClick={() =>
                        setSelectedTransport(
                          selectedTransport === transport.id ? null : transport.id
                        )
                      }
                    >
                      <IconDisplay
                        iconFilename={transport.transportType.icon}
                        iconType="transport-type"
                      />
                      <span>{transport.name}</span>
                      <span>
                        <Badge className="rounded-full text-xs">{transport.seatCount}</Badge>
                      </span>
                    </Button>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button onClick={addTransportHandler} disabled={!selectedTransport}>
                    Add Transport
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Transport Details</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="driverName">Driver Name</Label>
              <Input
                id="driverName"
                value={formData.driverName}
                onChange={e => handleInputChange('driverName', e.target.value)}
                placeholder="Enter driver name (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverPhone">Driver Phone</Label>
              <Input
                id="driverPhone"
                value={formData.driverPhone}
                onChange={e => handleInputChange('driverPhone', e.target.value)}
                placeholder="Enter driver phone (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleNumber">Vehicle Number</Label>
              <Input
                id="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={e => handleInputChange('vehicleNumber', e.target.value)}
                placeholder="Enter vehicle number (optional)"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={createTripTransportMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createTripTransportMutation.isPending}>
                {createTripTransportMutation.isPending ? 'Adding...' : 'Add Transport'}
              </Button>
            </DialogFooter>
            {createTripTransportMutation.error && (
              <div className="text-red-600 text-sm mt-2">
                Error: {createTripTransportMutation.error.message}
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      <OrderInfoDialog
        isOpen={isOrderInfoDialogOpen}
        onClose={() => setIsOrderInfoDialogOpen(false)}
        orderInfo={selectedOrderInfo}
      />
    </div>
  );
};

export default TripsList;
