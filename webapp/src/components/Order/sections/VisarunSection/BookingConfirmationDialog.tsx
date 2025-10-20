import React, { useState, useMemo } from 'react';
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
import { Loader2, MapPin } from 'lucide-react';

interface BookingConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trip: any;
  seatClass: any;
  price: number;
  onConfirm: (bookingData: {
    pickupLocationId?: string;
    pickupAddress?: string;
    specifyLater?: boolean;
  }) => Promise<void>;
}

const BookingConfirmationDialog = ({
  isOpen,
  onOpenChange,
  trip,

  onConfirm,
}: BookingConfirmationDialogProps) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('');
  const [specifyLater, setSpecifyLater] = useState(false);
  const [selectedPickupLocationId, setSelectedPickupLocationId] = useState<string>('');

  // Find departure stop
  const departureStop = trip?.route?.routeStops?.find((stop: any) => stop.stopType === 'departure');

  // Find all pickup locations in the same city as departure
  const departureCityPickupLocations = useMemo(() => {
    const allPickupLocations: any[] = [];

    trip?.route?.routeStops
      ?.filter((stop: any) => stop.city.id === departureStop?.city.id)
      ?.forEach((stop: any) => {
        stop.pickupLocations?.forEach((pl: any) => {
          if (!allPickupLocations.find(existing => existing.id === pl.pickupLocation.id)) {
            allPickupLocations.push(pl.pickupLocation);
          }
        });
      });

    return allPickupLocations;
  }, [trip?.route?.routeStops, departureStop?.city.id]);

  // Set default pickup location to first element
  React.useEffect(() => {
    if (departureCityPickupLocations.length > 0) {
      setSelectedPickupLocationId(departureCityPickupLocations[0].id);
    }
  }, [departureCityPickupLocations]);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      const bookingData: {
        pickupLocationId?: string;
        pickupAddress?: string;
        specifyLater?: boolean;
      } = {};

      if (departureStop?.pickupMode === 'address') {
        if (specifyLater) {
          bookingData.specifyLater = true;
        } else {
          bookingData.pickupAddress = pickupAddress;
        }
      } else if (departureStop?.pickupMode === 'location') {
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
    } catch (error) {
      console.error('Error confirming booking:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const isFormValid = () => {
    if (!departureStop) return true;

    if (departureStop.pickupMode === 'address') {
      return specifyLater || pickupAddress.trim().length > 0;
    } else if (departureStop.pickupMode === 'location') {
      return departureCityPickupLocations.length === 0 || selectedPickupLocationId.length > 0;
    }

    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Confirm Booking
          </DialogTitle>
          <DialogDescription>
            Please confirm your booking details and pickup information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pickup Information */}
          {departureStop && (
            <div className="space-y-3">
              {departureStop.pickupMode === 'address' && (
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

              {departureStop.pickupMode === 'location' && (
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
                      No pickup locations available for {departureStop?.city?.name}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isConfirming}>
            Cancel
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingConfirmationDialog;
