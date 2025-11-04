import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import SeatingChartVisualization from '@/components/Transport/SeatingChartVisualization';
import { trpc } from '@/lib/trpc';
import { Loader2, MapPin } from 'lucide-react';

interface BookingConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trip: any;
  transport?: any;
  seatClass: any;
  price: number;
  preferredDepartureCity?: any;
  tripTransports?: any[];
  onConfirm: (bookingData: {
    pickupLocationId?: string;
    pickupAddress?: string;
    specifyLater?: boolean;
    routeStopId?: string;
    selectedSeat?: any;
    tripTransport?: any;
  }) => Promise<void>;
}

interface Seat {
  id: string;
  seatLabel: string;
  seatClassId: string;
  isAvailable: boolean;
  isOccupied?: boolean;
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

const BookingConfirmationDialog = ({
  isOpen,
  onOpenChange,
  trip,
  seatClass,
  preferredDepartureCity,
  onConfirm,
}: BookingConfirmationDialogProps) => {
  const transports = trip ? trip.transports : [];
  const selectedTransport = transports[transports.length - 1];

  const [isConfirming, setIsConfirming] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('');
  const [specifyLater, setSpecifyLater] = useState(false);
  const [selectedPickupLocationId, setSelectedPickupLocationId] = useState<string>('');

  // Seat selection state
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [isCreatingTripTransport, setIsCreatingTripTransport] = useState(false);
  const [showSeatSelection, setShowSeatSelection] = useState(false);

  const seatingChart = selectedTransport ? selectedTransport.transport?.seatingChart : null;

  const hasSeatingChart = Boolean(selectedTransport?.id && seatingChart);

  // Get occupied seats for the trip transport
  const { data: occupiedSeats, isLoading: occupiedSeatsLoading } =
    trpc.visarunPassenger.getOccupiedSeatsByTripTransport.useQuery(
      { tripId: trip?.id, transportId: selectedTransport?.id },
      {
        enabled: Boolean(!!trip?.id && !!selectedTransport?.id && hasSeatingChart),
      }
    );

  // Set initial view based on whether there's a seating chart
  useEffect(() => {
    if (isOpen) {
      setShowSeatSelection(Boolean(hasSeatingChart && seatingChart));
    }
  }, [isOpen, hasSeatingChart, seatingChart]);

  // Find the departure stop that matches the preferred departure city
  const selectedDepartureStop = useMemo(() => {
    if (!trip?.route?.routeStops) {
      return undefined;
    }

    // First try to find stop that matches the preferred departure city
    if (preferredDepartureCity?.id) {
      const matchingStop = trip.route.routeStops.find(
        (stop: any) =>
          stop.cityId === preferredDepartureCity.id &&
          (stop.stopType === 'departure' || stop.stopType === 'intermediate')
      );

      if (matchingStop) {
        return matchingStop;
      }
    }

    // Fallback to first departure stop
    return trip.route.routeStops.find((stop: any) => stop.stopType === 'departure');
  }, [trip?.route?.routeStops, preferredDepartureCity]);

  // Find all pickup locations in the selected departure city
  const departureCityPickupLocations = useMemo(() => {
    const allPickupLocations: any[] = [];

    trip?.route?.routeStops
      ?.filter((stop: any) => stop.city.id === selectedDepartureStop?.city.id)
      ?.forEach((stop: any) => {
        stop.pickupLocations?.forEach((pl: any) => {
          if (!allPickupLocations.find(existing => existing.id === pl.pickupLocation.id)) {
            allPickupLocations.push(pl.pickupLocation);
          }
        });
      });

    return allPickupLocations;
  }, [trip?.route?.routeStops, selectedDepartureStop?.city.id]);

  // Set default pickup location to first element
  useEffect(() => {
    if (departureCityPickupLocations.length > 0) {
      setSelectedPickupLocationId(departureCityPickupLocations[0].id);
    }
  }, [departureCityPickupLocations]);

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
                  isOccupied: occupiedSeatNumbers.has(seat.seatLabel),
                })) || [],
            })) || [],
        })) || [],
    };
  };

  const handleSeatClick = (seat: Seat) => {
    if (!seat.isAvailable || seat.driverSeat || seat.isOccupied) return;

    // Filter seats by selected seat class
    if (seatClass && seat.seatClassId !== seatClass.id) {
      return;
    }

    setSelectedSeat(seat);
  };

  const handleSeatSelectionNext = async () => {
    if (!selectedSeat) return;

    setShowSeatSelection(false);
    setIsCreatingTripTransport(false);
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      const bookingData: {
        pickupLocationId?: string;
        pickupAddress?: string;
        specifyLater?: boolean;
        routeStopId?: string;
        selectedSeat?: any;
      } = {
        routeStopId: selectedDepartureStop?.id,
      };

      // Add seat selection data if applicable
      if (selectedSeat) {
        bookingData.selectedSeat = selectedSeat;
        // asdf
      }

      if (selectedDepartureStop?.pickupMode === 'address') {
        if (specifyLater) {
          bookingData.specifyLater = true;
        } else {
          bookingData.pickupAddress = pickupAddress;
        }
      } else if (selectedDepartureStop?.pickupMode === 'location') {
        bookingData.pickupLocationId = selectedPickupLocationId;
      }

      await onConfirm(bookingData);
      onOpenChange(false);

      // Reset form
      setPickupAddress('');
      setSpecifyLater(false);
      setSelectedPickupLocationId(
        departureCityPickupLocations.length > 0 ? departureCityPickupLocations[0].id : ''
      );
      setSelectedSeat(null);
      setShowSeatSelection(Boolean(hasSeatingChart && seatingChart));
    } catch (error) {
      console.error('Error confirming booking:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleBack = () => {
    if (!showSeatSelection && hasSeatingChart && seatingChart) {
      setShowSeatSelection(true);
    }
  };

  const handleCancel = () => {
    setSelectedSeat(null);
    setPickupAddress('');
    setSpecifyLater(false);
    setShowSeatSelection(Boolean(hasSeatingChart && seatingChart));
    onOpenChange(false);
  };

  const updatedSeatingChart = updateSeatingChartAvailability(seatingChart);

  const isFormValid = () => {
    if (!selectedDepartureStop) return true;

    if (selectedDepartureStop.pickupMode === 'address') {
      return specifyLater || pickupAddress.trim().length > 0;
    } else if (selectedDepartureStop.pickupMode === 'location') {
      return departureCityPickupLocations.length === 0 || selectedPickupLocationId.length > 0;
    }

    return true;
  };

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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={showSeatSelection ? 'max-w-4xl max-h-[90vh] overflow-y-auto' : 'max-w-md'}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {showSeatSelection ? (
              'Choose Your Seat'
            ) : (
              <>
                <MapPin className="h-5 w-5" />
                Confirm Booking
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {showSeatSelection ? (
              <>
                Select your preferred seat for the trip from{' '}
                {trip?.route?.routeStops?.[0]?.city?.name} to{' '}
                {trip?.route?.routeStops?.[trip.route.routeStops.length - 1]?.city?.name}
              </>
            ) : (
              'Please confirm your booking details and pickup information.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {showSeatSelection ? (
            <>
              {/* Trip and transport info */}
              <div className="flex flex-wrap gap-4 items-center justify-end">
                <Badge className="rounded-full">
                  {occupiedSeatsCount}/{totalSeats}
                </Badge>
              </div>

              {/* Loading state */}
              {(occupiedSeatsLoading || isCreatingTripTransport) && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">
                    {isCreatingTripTransport
                      ? 'Creating new transport...'
                      : 'Loading seating chart...'}
                  </span>
                </div>
              )}

              {/* No seating chart available */}
              {!seatingChart && (
                <div className="text-center text-muted-foreground p-8">
                  <div className="text-lg font-medium mb-2">No seating chart available</div>
                  <div className="text-sm">Transport ID: {selectedTransport?.id}</div>
                </div>
              )}

              {/* Seating chart */}
              {updatedSeatingChart &&
                updatedSeatingChart.floors &&
                updatedSeatingChart.floors.length > 0 && (
                  <SeatingChartVisualization
                    seatingChart={updatedSeatingChart}
                    onSeatClick={handleSeatClick}
                    selectedSeatId={selectedSeat?.id}
                  />
                )}

              {/* Empty seating chart */}
              {seatingChart && (!seatingChart.floors || seatingChart.floors.length === 0) && (
                <div className="text-center text-muted-foreground p-8">
                  <div className="text-lg font-medium mb-2">Empty seating chart</div>
                  <div className="text-sm">This transport has no configured seats</div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Show departure city info */}
              {selectedDepartureStop && (
                <div className="flex flex-col gap-1">
                  <Label className="text-sm text-muted-foreground">Departing from</Label>
                  <div className="text-sm font-medium">
                    {selectedDepartureStop.city.name}
                    {selectedDepartureStop.stopType === 'intermediate' && ' (Intermediate Stop)'}
                  </div>
                </div>
              )}

              {/* Show selected seat info if applicable */}
              {selectedSeat && (
                <div className="flex flex-col gap-1">
                  <Label className="text-sm text-muted-foreground">Selected Seat</Label>
                  <div className="flex gap-2 items-center">
                    <Badge>{selectedSeat.seatLabel}</Badge>
                    <Badge variant="outline">{selectedSeat.seatClass.name}</Badge>
                    {selectedSeat.isWindow && <Badge variant="outline">Window</Badge>}
                    {selectedSeat.isAisle && <Badge variant="outline">Aisle</Badge>}
                    {selectedSeat.isEmergency && <Badge variant="outline">Emergency Exit</Badge>}
                  </div>
                </div>
              )}

              {/* Pickup Information */}
              {selectedDepartureStop && (
                <div className="space-y-3">
                  {selectedDepartureStop.pickupMode === 'address' && (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="specify-later" className="text-sm">
                          Specify pickup address later
                        </Label>
                        <Switch
                          id="specify-later"
                          checked={specifyLater}
                          onCheckedChange={setSpecifyLater}
                        />
                      </div>

                      {!specifyLater && (
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="pickup-address" className="text-sm">
                            Pickup Address
                          </Label>
                          <Input
                            id="pickup-address"
                            placeholder="Enter your pickup address"
                            value={pickupAddress}
                            onChange={e => setPickupAddress(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {selectedDepartureStop.pickupMode === 'location' && (
                    <div className="flex flex-col gap-1">
                      <Label className="text-sm">Pickup Location</Label>
                      {departureCityPickupLocations.length > 0 ? (
                        <Select
                          value={selectedPickupLocationId}
                          onValueChange={setSelectedPickupLocationId}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select pickup location" />
                          </SelectTrigger>
                          <SelectContent>
                            {departureCityPickupLocations.map((location: any) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm text-muted-foreground mt-1 p-2 bg-secondary rounded">
                          No pickup locations available for {selectedDepartureStop?.city?.name}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          {showSeatSelection ? (
            <>
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleSeatSelectionNext}
                disabled={!selectedSeat || isCreatingTripTransport}
              >
                {isCreatingTripTransport ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Next'
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={hasSeatingChart ? handleBack : handleCancel}
                disabled={isConfirming}
              >
                {hasSeatingChart ? 'Back' : 'Cancel'}
              </Button>
              <Button onClick={handleConfirm} disabled={isConfirming || !isFormValid()}>
                {isConfirming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Confirming...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingConfirmationDialog;
