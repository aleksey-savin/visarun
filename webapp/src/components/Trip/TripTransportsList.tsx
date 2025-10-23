import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { IconDisplay } from '@/components/ui/icon-display';
import { CircleCheck, LoaderCircle, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import TransportDropZone from './TransportDropZone';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';

interface TripTransport {
  id: string;
  driverName: string | null;
  driverPhone: string | null;
  vehicleNumber: string | null;
  createdAt: string;
  transport: {
    id: string;
    name: string;
    seatCount: number | null;
    transportType: {
      id: string;
      name: string;
      icon: string | null;
    };
  };
}

interface TripTransportsListProps {
  tripTransports: TripTransport[];
  tripId?: string;
}

const TripTransportsList = ({ tripTransports, tripId }: TripTransportsListProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transportToDelete, setTransportToDelete] = useState<string | null>(null);

  const utils = trpc.useContext();

  // State to store seat distributions for all transports
  const [seatDistributions, setSeatDistributions] = useState<Record<string, any>>({});
  const [loadingSeatDistributions, setLoadingSeatDistributions] = useState(false);

  // Fetch seat distributions when tripTransports change
  useEffect(() => {
    const fetchSeatDistributions = async () => {
      if (tripTransports.length === 0) return;

      setLoadingSeatDistributions(true);
      const distributionPromises = tripTransports.map(async tripTransport => {
        try {
          const result = await utils.transportSeatDistribution.getByTransport.fetch({
            transportId: tripTransport.transport.id,
          });
          return { transportId: tripTransport.transport.id, data: result };
        } catch (error) {
          console.error(
            `Failed to fetch seat distribution for transport ${tripTransport.transport.id}:`,
            error
          );
          return { transportId: tripTransport.transport.id, data: null };
        }
      });

      const results = await Promise.all(distributionPromises);
      const distributionsMap = results.reduce(
        (acc, result) => {
          if (result.data) {
            acc[result.transportId] = result.data;
          }
          return acc;
        },
        {} as Record<string, any>
      );

      setSeatDistributions(distributionsMap);
      setLoadingSeatDistributions(false);
    };

    fetchSeatDistributions();
  }, [tripTransports, utils.transportSeatDistribution]);

  // Get passengers for the trip to count by tripTransportId
  const passengersQuery = trpc.visarunPassenger.getAll.useQuery(tripId ? { tripId } : {}, {
    enabled: !!tripId,
  });

  const updatePassengerMutation = trpc.visarunPassenger.update.useMutation({
    onSuccess: () => {
      // Refetch passengers to update the UI
      utils.visarunPassenger.getAll.invalidate();
    },
    onError: error => {
      console.error('Failed to update passenger:', error.message);
    },
  });

  const deleteTripTransportMutation = trpc.visarunTripTransport.delete.useMutation({
    onSuccess: () => {
      setIsDeleteDialogOpen(false);
      setTransportToDelete(null);
      // Refetch trip transports to update the UI
      utils.visarunTripTransport.getByTripIds.invalidate();
      utils.visarunPassenger.getAll.invalidate();
    },
    onError: error => {
      console.error('Failed to delete transport:', error.message);
    },
  });

  const handleDeleteTransport = (transportId: string) => {
    setTransportToDelete(transportId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTransport = () => {
    if (transportToDelete) {
      deleteTripTransportMutation.mutate({ id: transportToDelete });
    }
  };

  if (!tripTransports || tripTransports.length === 0) {
    return null;
  }

  // Helper function to get seat distribution for a transport
  const getSeatDistributionForTransport = (transportId: string) => {
    const distributionData = seatDistributions[transportId];
    return distributionData?.seatDistribution || [];
  };

  // Helper function to get passenger count for a trip transport
  const getPassengerCountForTripTransport = (tripTransportId: string) => {
    if (!passengersQuery.data) return 0;
    return passengersQuery.data.filter(passenger => passenger.tripTransportId === tripTransportId)
      .length;
  };

  // Helper function to get passengers by trip transport and seat class
  const getPassengersByTripTransportAndSeatClass = (
    tripTransportId: string,
    seatClassId?: string
  ) => {
    if (!passengersQuery.data) return [];
    return passengersQuery.data.filter(
      passenger =>
        passenger.tripTransportId === tripTransportId &&
        (seatClassId ? passenger.seatClassId === seatClassId : true)
    );
  };

  // Handle passenger drop
  const handlePassengerDrop = async (
    passenger: { id: string; tripTransportId?: string | null; seatClassId?: string | null },
    tripTransportId: string,
    seatClassId?: string
  ) => {
    try {
      await updatePassengerMutation.mutateAsync({
        id: passenger.id,
        tripTransportId: tripTransportId,
        seatClassId: seatClassId,
        // Clear seat number when changing transport/class
        seatNumber: null,
      });
    } catch (error) {
      console.error('Failed to assign passenger to transport:', error);
    }
  };

  // Handle passenger removal from transport
  const handlePassengerRemove = async (passengerId: string) => {
    try {
      await updatePassengerMutation.mutateAsync({
        id: passengerId,
        tripTransportId: null,
        seatNumber: null,
      });
    } catch (error) {
      console.error('Failed to remove passenger from transport:', error);
    }
  };

  const canDeleteTransport = (tripTransportId: string) => {
    if (!passengersQuery.data) {
      return false;
    }
    return passengersQuery.data.filter(p => p.tripTransportId === tripTransportId).length > 0;
  };

  return (
    <>
      {tripTransports.map(tripTransport => (
        <Card key={tripTransport.id} className={cn('p-3 bg-secondary')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconDisplay
                iconFilename={tripTransport.transport.transportType.icon || ''}
                iconType="transport-type"
              />
              <span className="font-medium">{tripTransport.transport.name}</span>
              <Badge className="rounded-full">
                {`${getPassengerCountForTripTransport(tripTransport.id)} / ${tripTransport.transport.seatCount}`}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {tripTransport.transport?.seatCount &&
                getPassengerCountForTripTransport(tripTransport.id) >=
                  tripTransport.transport.seatCount && (
                  <CircleCheck className="w-6 h-6 text-emerald-600" />
                )}

              {tripTransport.transport?.seatCount &&
                getPassengerCountForTripTransport(tripTransport.id) <
                  tripTransport.transport.seatCount && (
                  <LoaderCircle className="w-6 h-6 text-warning" />
                )}

              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="h-8 w-8"
                disabled={canDeleteTransport(tripTransport.id)}
                hidden={canDeleteTransport(tripTransport.id)}
                onClick={() => handleDeleteTransport(tripTransport.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Separator />

          {/* Seat Distribution Drop Zones */}
          {getSeatDistributionForTransport(tripTransport.transport.id).length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {getSeatDistributionForTransport(tripTransport.transport.id).map(
                (distribution: any) => {
                  const passengers = getPassengersByTripTransportAndSeatClass(
                    tripTransport.id,
                    distribution.seatClass.id
                  );
                  return (
                    <TransportDropZone
                      key={distribution.id}
                      tripTransportId={tripTransport.id}
                      seatClass={{
                        id: distribution.seatClass.id,
                        name: distribution.seatClass.name,
                        icon: distribution.seatClass.icon ?? undefined,
                      }}
                      seatCount={distribution.seatCount}
                      occupiedCount={passengers.length}
                      passengers={passengers}
                      onDrop={handlePassengerDrop}
                      onRemove={handlePassengerRemove}
                      isLoading={updatePassengerMutation.isPending || loadingSeatDistributions}
                    />
                  );
                }
              )}
            </div>
          ) : (
            <TransportDropZone
              tripTransportId={tripTransport.id}
              seatCount={tripTransport.transport.seatCount || 0}
              occupiedCount={getPassengerCountForTripTransport(tripTransport.id)}
              passengers={getPassengersByTripTransportAndSeatClass(tripTransport.id)}
              onDrop={handlePassengerDrop}
              onRemove={handlePassengerRemove}
              isLoading={updatePassengerMutation.isPending || loadingSeatDistributions}
            />
          )}

          {(tripTransport.driverName ||
            tripTransport.driverPhone ||
            tripTransport.vehicleNumber) && (
            <div className="mt-3 pt-3 border-t space-y-1">
              {tripTransport.driverName && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Driver:</span>
                  <span>{tripTransport.driverName}</span>
                </div>
              )}
              {tripTransport.driverPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Phone:</span>
                  <span>{tripTransport.driverPhone}</span>
                </div>
              )}
              {tripTransport.vehicleNumber && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Vehicle:</span>
                  <span>{tripTransport.vehicleNumber}</span>
                </div>
              )}
            </div>
          )}
        </Card>
      ))}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transport</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this transport? This action cannot be undone.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteTripTransportMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteTransport}
              disabled={deleteTripTransportMutation.isPending}
            >
              {deleteTripTransportMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
          {deleteTripTransportMutation.error && (
            <div className="text-red-600 text-sm mt-2">
              Error: {deleteTripTransportMutation.error.message}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TripTransportsList;
