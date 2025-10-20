import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SeatingChartVisualization from '@/components/Transport/SeatingChartVisualization';
import { trpc } from '@/lib/trpc';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SeatSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: any;
  transport: any;
  seatClass: any;

  onSeatSelect: (seat: any, tripTransport: any) => void;
  tripTransports: any[];
}

interface Seat {
  id: string;
  seatLabel: string;
  seatClassId: string;
  isAvailable: boolean;
  isAisle: boolean;
  isWindow: boolean;
  isEmergency: boolean;
  driverSeat: boolean;
  seatClass: {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    color?: string;
  };
}

const SeatSelectionDialog: React.FC<SeatSelectionDialogProps> = ({
  open,
  onOpenChange,
  trip,
  transport,
  seatClass,
  onSeatSelect,
  tripTransports,
}) => {
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [availableTripTransport, setAvailableTripTransport] = useState<any>(null);
  const [isCreatingTripTransport, setIsCreatingTripTransport] = useState(false);

  // Get seating chart for the transport
  const {
    data: seatingChartData,
    isLoading: seatingChartLoading,
    error: seatingChartError,
  } = trpc.transport.getSeatingChart.useQuery(
    { transportId: transport?.id },
    {
      enabled: open && !!transport?.id,
    }
  );

  const seatingChart = seatingChartData?.seatingChart;

  const createTripTransportMutation = trpc.visarunTripTransport.create.useMutation();

  // Fallback test seating chart for development

  // Find or create available trip transport
  useEffect(() => {
    if (tripTransports && transport) {
      // Find existing trip transport for this transport
      const existingTripTransport = tripTransports.find(
        tt => tt.transportId === transport.id && tt.isActive
      );

      if (existingTripTransport) {
        setAvailableTripTransport(existingTripTransport);
      } else {
        // Will need to create new trip transport
        setAvailableTripTransport(null);
      }
    }
  }, [tripTransports, transport]);

  // Get occupied seats for the trip transport
  const { data: occupiedSeats, isLoading: occupiedSeatsLoading } =
    trpc.visarunPassenger.getOccupiedSeats.useQuery(
      { tripTransportId: availableTripTransport?.id },
      {
        enabled: !!availableTripTransport?.id,
      }
    );

  // Update seat availability based on occupied seats
  const updateSeatingChartAvailability = (chart: any) => {
    if (!chart || !occupiedSeats || !chart.floors) return chart;

    const occupiedSeatNumbers = new Set(occupiedSeats.map((p: any) => p.seatNumber));

    return {
      ...chart,
      floors:
        chart.floors?.map((floor: any) => ({
          ...floor,
          rows:
            floor.rows?.map((row: any) => ({
              ...row,
              seats:
                row.seats?.map((seat: any) => ({
                  ...seat,
                  isAvailable: seat.isAvailable && !occupiedSeatNumbers.has(seat.seatLabel),
                })) || [],
            })) || [],
        })) || [],
    };
  };

  const handleSeatClick = (seat: Seat) => {
    if (!seat.isAvailable || seat.driverSeat) return;

    // Filter seats by selected seat class
    if (seatClass && seat.seatClassId !== seatClass.id) {
      return;
    }

    setSelectedSeat(seat);
  };

  const handleSave = async () => {
    if (!selectedSeat) return;

    try {
      let tripTransportToUse = availableTripTransport;

      // Check if current transport is full and we need to create a new one
      if (!availableTripTransport) {
        setIsCreatingTripTransport(true);

        const newTripTransport = await createTripTransportMutation.mutateAsync({
          tripId: trip.id,
          transportId: transport.id,
        });

        tripTransportToUse = newTripTransport.tripTransport;
        setAvailableTripTransport(tripTransportToUse);
      } else {
        // Check if current transport will be full after this booking
        const currentOccupiedSeats = occupiedSeats?.length || 0;
        const totalTransportSeats = transport?.seatCount || 0;

        // If this would be the last seat, we should prepare for next booking
        if (currentOccupiedSeats + 1 >= totalTransportSeats) {
          // This is the last available seat - future bookings will need new transport
          toast.info('This transport is now full. Future bookings will create a new transport.');
        }
      }

      onSeatSelect(selectedSeat, tripTransportToUse);
      onOpenChange(false);
      setSelectedSeat(null);
    } catch (error) {
      console.error('Error creating trip transport:', error);
      toast.error('Failed to create trip transport. Please try again.');
    } finally {
      setIsCreatingTripTransport(false);
    }
  };

  const handleCancel = () => {
    setSelectedSeat(null);
    onOpenChange(false);
  };

  const updatedSeatingChart = updateSeatingChartAvailability(seatingChart);

  // Count total and occupied seats
  const totalSeats =
    updatedSeatingChart?.floors?.reduce(
      (total: number, floor: any) =>
        total +
          floor.rows?.reduce(
            (rowTotal: number, row: any) =>
              rowTotal +
                row.seats?.filter(
                  (seat: any) => !seat.driverSeat && seat.seatClassId === seatClass?.id
                ).length || 0,
            0
          ) || 0,
      0
    ) || 0;

  const occupiedSeatsCount = occupiedSeats?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Your Seat</DialogTitle>
          <DialogDescription>
            Select your preferred seat for the trip from {trip?.route?.routeStops?.[0]?.city?.name}{' '}
            to {trip?.route?.routeStops?.[trip.route.routeStops.length - 1]?.city?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Trip and transport info */}
          <div className="flex flex-wrap gap-4 items-center">
            <Badge variant="outline">
              {new Date(trip?.departureDateTime).toLocaleDateString()} -{' '}
              {new Date(trip?.departureDateTime).toLocaleTimeString()}
            </Badge>
            <Badge variant="secondary">{transport?.name}</Badge>
            {seatClass && <Badge variant="outline">{seatClass.name}</Badge>}
            <Badge variant="outline">
              Occupied: {occupiedSeatsCount}/{totalSeats}
            </Badge>
          </div>

          {/* Selected seat info */}
          {selectedSeat && (
            <div className="p-4 bg-secondary/50 rounded-lg">
              <h4 className="font-medium mb-2">Selected Seat</h4>
              <div className="flex gap-2 items-center">
                <Badge>{selectedSeat.seatLabel}</Badge>
                <Badge variant="outline">{selectedSeat.seatClass.name}</Badge>
                {selectedSeat.isWindow && <Badge variant="outline">Window</Badge>}
                {selectedSeat.isAisle && <Badge variant="outline">Aisle</Badge>}
                {selectedSeat.isEmergency && <Badge variant="outline">Emergency Exit</Badge>}
              </div>
            </div>
          )}

          {/* Loading state */}
          {(seatingChartLoading || occupiedSeatsLoading || isCreatingTripTransport) && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">
                {isCreatingTripTransport ? 'Creating new transport...' : 'Loading seating chart...'}
              </span>
            </div>
          )}

          {/* Error state */}
          {seatingChartError && (
            <div className="text-center text-red-600 p-4">
              Error loading seating chart: {seatingChartError.message}
              <br />
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-red-500 text-white rounded"
              >
                Retry
              </button>
            </div>
          )}

          {/* No seating chart available */}
          {!seatingChartLoading && !seatingChartError && !seatingChart && (
            <div className="text-center text-muted-foreground p-8">
              <div className="text-lg font-medium mb-2">No seating chart available</div>
              <div className="text-sm">Transport ID: {transport?.id}</div>
            </div>
          )}

          {/* Seating chart */}
          {updatedSeatingChart &&
            updatedSeatingChart.floors &&
            updatedSeatingChart.floors.length > 0 &&
            !seatingChartLoading && (
              <SeatingChartVisualization
                seatingChart={updatedSeatingChart}
                onSeatClick={handleSeatClick}
                selectedSeatId={selectedSeat?.id}
              />
            )}

          {/* Empty seating chart */}
          {seatingChart &&
            (!seatingChart.floors || seatingChart.floors.length === 0) &&
            !seatingChartLoading && (
              <div className="text-center text-muted-foreground p-8">
                <div className="text-lg font-medium mb-2">Empty seating chart</div>
                <div className="text-sm">This transport has no configured seats</div>
              </div>
            )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedSeat || isCreatingTripTransport}>
            {isCreatingTripTransport ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Save Selection'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SeatSelectionDialog;
