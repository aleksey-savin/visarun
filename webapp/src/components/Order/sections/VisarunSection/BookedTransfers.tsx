import { useState, useEffect } from 'react';
import useOrderStore, { type StoreClient } from '@/stores/order/order-store';
import { CircleCheck, MapPinIcon } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import TripCard from './TripCard';
import CancelBookingDialog from './CancelBookingDialog';

const BookedTransfers = ({ client }: { client: StoreClient }) => {
  const { visarunPassengers, orderItems, setOrderItems, setVisarunPassengers, setSaveStatus } =
    useOrderStore();

  // Filter passengers and order items for this specific client
  const clientVisarunPassengers = visarunPassengers.filter(
    passenger => passenger.clientId === client.id
  );
  const clientOrderItems = orderItems.filter(item => item.clientId === client.id);

  const deleteOrderItemMutation = trpc.orderItem.delete.useMutation();
  const deleteVisarunPassengerMutation = trpc.visarunPassenger.delete.useMutation();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [passengerToCancel, setPassengerToCancel] = useState<any>(null);
  const [tripTransports, setTripTransports] = useState<any[]>([]);

  // Get all trip transports for booked trips
  const bookedTripIds = clientVisarunPassengers.map((passenger: any) => passenger.tripId) || [];
  const { data: allTripTransports } = trpc.visarunTripTransport.getByTripIds.useQuery(
    { tripIds: bookedTripIds },
    { enabled: bookedTripIds.length > 0 }
  );

  // Update local state when trip transports are fetched
  useEffect(() => {
    if (allTripTransports) {
      setTripTransports(allTripTransports);
    }
  }, [allTripTransports]);

  const handleCancelClick = (passenger: any) => {
    setPassengerToCancel(passenger);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!passengerToCancel) return;

    setSaveStatus('saving');

    try {
      // Delete visarun passenger
      await deleteVisarunPassengerMutation.mutateAsync({ id: passengerToCancel.id });

      // Delete order item
      await deleteOrderItemMutation.mutateAsync({ id: passengerToCancel.orderItemId });

      // Remove from store
      setVisarunPassengers(visarunPassengers.filter(p => p.id !== passengerToCancel.id));
      setOrderItems(orderItems.filter(item => item.id !== passengerToCancel.orderItemId));

      setSaveStatus('saved');
    } catch (error) {
      console.error('Error canceling booking:', error);
      setSaveStatus('error');
    }
  };

  if (clientVisarunPassengers.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8">
        <MapPinIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">No transfers booked</p>
        <p className="text-sm">Select your preferred transfer options above to get started.</p>
      </div>
    );
  }

  const BookedTripCard = ({ passenger }: { passenger: any }) => {
    const orderItem = clientOrderItems.find(item => item.id === passenger.orderItemId);
    const { trip } = passenger;

    // Simple badge logic - if passenger has seat number, show seat-based counting
    let badgeContent: string | number = 0;

    if (passenger.seatNumber && passenger.tripTransportId) {
      // Count passengers with seat numbers for this specific trip transport
      const passengersWithSeats = clientVisarunPassengers.filter(
        p => p.tripTransportId === passenger.tripTransportId && p.seatNumber
      ).length;

      // Get transport from tripTransports data
      const tripTransport = tripTransports.find(tt => tt.id === passenger.tripTransportId);
      const totalSeats = tripTransport?.transport?.seatCount || 0;

      badgeContent =
        totalSeats > 0 ? `${passengersWithSeats} / ${totalSeats}` : passengersWithSeats;
    } else {
      // Fallback: count all passengers for this trip
      badgeContent = clientVisarunPassengers.filter(p => p.tripId === trip.id).length;
    }

    return (
      <TripCard
        trip={trip}
        bookedPassenger={passenger}
        seatClass={passenger.seatClass}
        price={orderItem?.finalPrice || 0}
        badgeContent={badgeContent}
        buttonText="Booked"
        buttonIcon={<CircleCheck className="h-4 w-4" />}
        buttonVariant="warning"
        onButtonClick={() => {}} // No action for booked items
        isButtonDisabled={true}
        showCancelButton={true}
        onCancelClick={() => handleCancelClick(passenger)}
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Booked Transfer</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clientVisarunPassengers.map(passenger => (
          <BookedTripCard key={passenger.id} passenger={passenger} />
        ))}
      </div>

      <CancelBookingDialog
        isOpen={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
};

export default BookedTransfers;
