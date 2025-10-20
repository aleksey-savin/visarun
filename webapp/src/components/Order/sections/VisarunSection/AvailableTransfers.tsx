import { useState, useEffect } from 'react';
import { useVisarunTrips } from '@/hooks/useVisarunTrips';
import useOrderStore, { type StoreClient } from '@/stores/order/order-store';
import { CircleCheck, MapPinIcon } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import TripCard from './TripCard';
import CancelBookingDialog from './CancelBookingDialog';
import SeatSelectionDialog from './SeatSelectionDialog';
import BookingConfirmationDialog from './BookingConfirmationDialog';

const AvailableTransfers = ({ client }: { client: StoreClient }) => {
  const {
    preferredDepartureCity,
    preferredVisarunCountry,
    preferredDepartureDate,
    order,
    orderItems,
    visarunPassengers,
    setOrderItems,
    setVisarunPassengers,
    setSaveStatus,
  } = useOrderStore();

  const {
    data: trips,
    isLoading,
    error,
  } = useVisarunTrips({
    preferredDepartureCityId: preferredDepartureCity?.id,
    preferredVisarunCountryId: preferredVisarunCountry?.id,
    preferredDepartureDate,
  });

  const createOrderItemMutation = trpc.orderItem.create.useMutation();
  const createVisarunPassengerMutation = trpc.visarunPassenger.create.useMutation();
  const createTripTransportMutation = trpc.visarunTripTransport.create.useMutation();
  const deleteOrderItemMutation = trpc.orderItem.delete.useMutation();
  const deleteVisarunPassengerMutation = trpc.visarunPassenger.delete.useMutation();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [passengerToCancel, setPassengerToCancel] = useState<any>(null);
  const [seatSelectionDialogOpen, setSeatSelectionDialogOpen] = useState(false);
  const [selectedTripForSeat, setSelectedTripForSeat] = useState<any>(null);
  const [selectedTransportForSeat, setSelectedTransportForSeat] = useState<any>(null);
  const [selectedSeatClassForSeat, setSelectedSeatClassForSeat] = useState<any>(null);
  const [tripTransports, setTripTransports] = useState<any[]>([]);
  const [bookingConfirmationDialogOpen, setBookingConfirmationDialogOpen] = useState(false);
  const [selectedTripForBooking, setSelectedTripForBooking] = useState<any>(null);
  const [selectedSeatClassForBooking, setSelectedSeatClassForBooking] = useState<any>(null);
  const [selectedPriceForBooking, setSelectedPriceForBooking] = useState<any>(null);
  const [selectedSeatForBooking, setSelectedSeatForBooking] = useState<any>(null);
  const [selectedTripTransportForBooking, setSelectedTripTransportForBooking] = useState<any>(null);

  // Get all trip transports for the current trips
  const tripIds = trips?.map((trip: any) => trip.id) || [];

  // Filter passengers for this specific client
  const clientVisarunPassengers = visarunPassengers.filter(
    passenger => passenger.clientId === client.id
  );

  // Filter order items for this specific client
  const { data: allTripTransports } = trpc.visarunTripTransport.getByTripIds.useQuery(
    { tripIds },
    { enabled: tripIds.length > 0 }
  );

  // Update local state when trip transports are fetched
  useEffect(() => {
    if (allTripTransports) {
      setTripTransports(allTripTransports);
    }
  }, [allTripTransports]);

  const handleSelectTrip = async (trip: any, seatClass: any, price: any) => {
    // Check if client already has this specific trip + seatClass booked
    const existingBooking = clientVisarunPassengers.find(
      passenger => passenger.tripId === trip.id && passenger.seatClassId === seatClass?.id
    );

    if (existingBooking) {
      return;
    }

    // Check if any transport has seating chart
    const hasTransportWithSeatingChart = trip.route?.transports?.some(
      (routeTransport: any) => routeTransport.transport.seatingChart?.id
    );

    if (hasTransportWithSeatingChart) {
      // Open seat selection dialog
      const transportWithSeatingChart = trip.route.transports.find(
        (routeTransport: any) => routeTransport.transport.seatingChart?.id
      );

      setSelectedTripForSeat(trip);
      setSelectedTransportForSeat(transportWithSeatingChart.transport);
      setSelectedSeatClassForSeat(seatClass);
      setSeatSelectionDialogOpen(true);
      return;
    }

    // Show booking confirmation dialog
    setSelectedTripForBooking(trip);
    setSelectedSeatClassForBooking(seatClass);
    setSelectedPriceForBooking(price);
    setBookingConfirmationDialogOpen(true);
  };

  const createBooking = async (
    trip: any,
    seatClass: any,
    price: any,
    selectedSeat: any,
    tripTransport: any,
    pickupData?: {
      pickupLocationId?: string;
      pickupAddress?: string;
      specifyLater?: boolean;
      routeStopId?: string;
    }
  ) => {
    setSaveStatus('saving');

    try {
      let tripTransportId = tripTransport?.id;

      // Create trip transport if needed and seat is selected
      if (selectedSeat && !tripTransport) {
        const transportWithSeatingChart = trip.route.transports.find(
          (routeTransport: any) => routeTransport.transport.seatingChart?.id
        );

        if (transportWithSeatingChart) {
          const tripTransportData = await createTripTransportMutation.mutateAsync({
            tripId: trip.id,
            transportId: transportWithSeatingChart.transport.id,
          });

          tripTransportId = tripTransportData.tripTransport.id;
          setTripTransports(prev => [...prev, tripTransportData.tripTransport]);
        }
      }

      // First create OrderItem
      const orderItemData = await createOrderItemMutation.mutateAsync({
        orderId: order.id || '',
        clientId: client.id,
        serviceType: 'visarun',
        basePrice: Number(price) || 0,
        finalPrice: Number(price) || 0,
      });

      if (!orderItemData.orderItem) {
        console.error('Order item was not created');
        setSaveStatus('error');
        return;
      }

      // Add OrderItem to store
      setOrderItems([
        ...orderItems,
        {
          ...orderItemData.orderItem,
          createdAt: new Date(orderItemData.orderItem.createdAt),
          updatedAt: new Date(orderItemData.orderItem.updatedAt),
        },
      ]);

      // Then create VisarunPassenger
      const visarunPassengerData = await createVisarunPassengerMutation.mutateAsync({
        orderItemId: orderItemData.orderItem.id,
        tripId: trip.id,
        tripTransportId: tripTransportId,
        seatClassId: seatClass?.id,
        seatNumber: selectedSeat?.seatLabel,
        serviceType: 'visa',
        pickupLocationId: pickupData?.pickupLocationId,
        pickupAddress: pickupData?.specifyLater ? undefined : pickupData?.pickupAddress,
        routeStopId: pickupData?.routeStopId,
      });

      if (!visarunPassengerData.visarunPassenger) {
        console.error('Visarun passenger was not created');
        setSaveStatus('error');
        return;
      }

      // Add VisarunPassenger to store
      setVisarunPassengers([
        ...visarunPassengers,
        {
          ...(visarunPassengerData.visarunPassenger as any),
          createdAt: new Date((visarunPassengerData.visarunPassenger as any).createdAt),
          updatedAt: new Date((visarunPassengerData.visarunPassenger as any).updatedAt),
          trip: (visarunPassengerData.visarunPassenger as any).trip
            ? {
                ...(visarunPassengerData.visarunPassenger as any).trip,
                departureDateTime: new Date(
                  (visarunPassengerData.visarunPassenger as any).trip.departureDateTime
                ),
              }
            : (trip as any),
        },
      ]);

      setSaveStatus('saved');
    } catch (error) {
      console.error('Error creating visarun booking:', error);
      setSaveStatus('error');
    }
  };

  const handleBookingConfirm = async (bookingData: {
    pickupLocationId?: string;
    pickupAddress?: string;
    specifyLater?: boolean;
    routeStopId?: string;
  }) => {
    if (
      !selectedTripForBooking ||
      !selectedSeatClassForBooking ||
      selectedPriceForBooking === null
    ) {
      return;
    }

    await createBooking(
      selectedTripForBooking,
      selectedSeatClassForBooking,
      selectedPriceForBooking,
      selectedSeatForBooking,
      selectedTripTransportForBooking,
      bookingData
    );

    // Update tripTransports if new one was created
    if (
      selectedTripTransportForBooking &&
      !tripTransports.find(tt => tt.id === selectedTripTransportForBooking.id)
    ) {
      setTripTransports(prev => [...prev, selectedTripTransportForBooking]);
    }

    // Reset booking state
    setSelectedSeatForBooking(null);
    setSelectedTripTransportForBooking(null);
  };

  const handleSeatSelect = async (seat: any, tripTransport: any) => {
    // Store selected seat and tripTransport for later use
    setSelectedSeatForBooking(seat);
    setSelectedTripTransportForBooking(tripTransport);

    // Set trip data for booking confirmation
    setSelectedTripForBooking(selectedTripForSeat);
    setSelectedSeatClassForBooking(selectedSeatClassForSeat);

    // Find the original price from the trip data
    const originalPrice =
      selectedTripForSeat?.route?.prices?.find(
        (p: any) => p.seatClass?.id === selectedSeatClassForSeat?.id
      )?.price || 0;
    setSelectedPriceForBooking(originalPrice);

    // Close seat selection dialog and open booking confirmation
    setSeatSelectionDialogOpen(false);
    setBookingConfirmationDialogOpen(true);
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3">Loading ...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Error loading trips. Please try again later.
      </div>
    );
  }

  if (!trips || trips.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8">
        <MapPinIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">Scheduled trips not found</p>
        <p className="text-sm">Try changing the departure city, destination country, or date.</p>
      </div>
    );
  }

  const AvailableTripCard = ({
    trip,
    seatClass,
    price,
  }: {
    trip: any;
    seatClass: any;
    price: any;
  }) => {
    // Check if this specific trip + seatClass is already booked by the active client
    const isAlreadyBooked = clientVisarunPassengers.some(
      passenger => passenger.tripId === trip.id && passenger.seatClassId === seatClass?.id
    );

    const hasAnyBookingAtAll = clientVisarunPassengers.length > 0;

    const bookedPassenger = clientVisarunPassengers.find(
      passenger => passenger.tripId === trip.id && passenger.seatClassId === seatClass?.id
    );

    // Check if any transport has seating chart
    const hasTransportWithSeatingChart = trip.route?.transports?.some(
      (routeTransport: any) => routeTransport.transport.seatingChart?.id
    );

    // Count passengers for trip transports if seating chart exists
    let badgeContent: string | number = 0;
    if (hasTransportWithSeatingChart) {
      const transportWithSeatingChart = trip.route.transports.find(
        (routeTransport: any) => routeTransport.transport.seatingChart?.id
      );

      // Get all trip transports for this specific transport
      const currentTripTransports = tripTransports.filter(
        tt => tt.tripId === trip.id && tt.transportId === transportWithSeatingChart.transport.id
      );

      // Count total occupied seats across all trip transports for this transport type
      const passengersInTransport = visarunPassengers.filter(
        passenger =>
          passenger.tripId === trip.id &&
          passenger.seatNumber &&
          passenger.seatClassId === seatClass?.id &&
          currentTripTransports.some(tt => tt.id === passenger.tripTransportId)
      ).length;

      // Calculate total available seats (transport capacity * number of trip transports)
      const singleTransportSeats = transportWithSeatingChart?.transport?.seatCount || 0;
      const totalAvailableSeats = singleTransportSeats * Math.max(1, currentTripTransports.length);

      badgeContent =
        totalAvailableSeats > 0
          ? `${passengersInTransport} / ${totalAvailableSeats}`
          : passengersInTransport;
    } else {
      // Count total passengers for this trip (old behavior)
      badgeContent = visarunPassengers.filter(passenger => passenger.tripId === trip.id).length;
    }

    return (
      <TripCard
        trip={trip}
        seatClass={seatClass}
        price={price}
        badgeContent={badgeContent}
        buttonText={
          isAlreadyBooked ? 'Booked' : hasTransportWithSeatingChart ? 'Choose seat' : 'Book'
        }
        buttonIcon={isAlreadyBooked ? <CircleCheck className="h-4 w-4" /> : undefined}
        buttonVariant={isAlreadyBooked ? 'warning' : 'secondary'}
        onButtonClick={() => handleSelectTrip(trip, seatClass, price)}
        isButtonDisabled={hasAnyBookingAtAll}
        showCancelButton={isAlreadyBooked}
        onCancelClick={bookedPassenger ? () => handleCancelClick(bookedPassenger) : undefined}
        bookedPassenger={bookedPassenger}
      />
    );
  };

  // Check if there are trips on the selected date
  const selectedDate = preferredDepartureDate ? new Date(preferredDepartureDate) : null;
  const tripsOnSelectedDate = selectedDate
    ? trips.filter((trip: any) => {
        const tripDate = new Date(trip.departureDateTime);
        // Compare dates only, ignoring time and timezone differences
        const selectedYear = selectedDate.getFullYear();
        const selectedMonth = selectedDate.getMonth();
        const selectedDay = selectedDate.getDate();

        const tripYear = tripDate.getFullYear();
        const tripMonth = tripDate.getMonth();
        const tripDay = tripDate.getDate();

        return selectedYear === tripYear && selectedMonth === tripMonth && selectedDay === tripDay;
      })
    : trips;

  // If there are trips on selected date, show them normally
  if (tripsOnSelectedDate.length > 0) {
    const tripSeatCards = tripsOnSelectedDate.flatMap((trip: any) => {
      if (!trip.route.prices || trip.route.prices.length === 0) {
        return [
          {
            tripId: trip.id,
            trip,
            seatClass: null,
            price: null,
            key: `${trip.id}-no-class`,
          },
        ];
      }

      return trip.route.prices.map((priceInfo: any) => ({
        tripId: trip.id,
        trip,
        seatClass: priceInfo.seatClass,
        price: priceInfo.price,
        key: `${trip.id}-${priceInfo.seatClass.id}`,
      }));
    });

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tripSeatCards.map(
            ({
              trip,
              seatClass,
              price,
              key,
            }: {
              trip: any;
              seatClass: any;
              price: any;
              key: any;
            }) => (
              <AvailableTripCard key={key} trip={trip} seatClass={seatClass} price={price} />
            )
          )}
        </div>

        <SeatSelectionDialog
          open={seatSelectionDialogOpen}
          onOpenChange={setSeatSelectionDialogOpen}
          trip={selectedTripForSeat}
          transport={selectedTransportForSeat}
          seatClass={selectedSeatClassForSeat}
          onSeatSelect={handleSeatSelect}
          tripTransports={tripTransports.filter(tt => tt.tripId === selectedTripForSeat?.id)}
        />

        <BookingConfirmationDialog
          isOpen={bookingConfirmationDialogOpen}
          onOpenChange={setBookingConfirmationDialogOpen}
          trip={selectedTripForBooking}
          seatClass={selectedSeatClassForBooking}
          price={selectedPriceForBooking || 0}
          onConfirm={handleBookingConfirm}
          preferredDepartureCity={preferredDepartureCity}
        />

        <CancelBookingDialog
          isOpen={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          onConfirm={handleConfirmCancel}
        />
      </>
    );
  }

  // No trips on selected date, show recommended trips (1 before, 2 after)
  const tripsBefore = selectedDate
    ? trips
        .filter((trip: any) => new Date(trip.departureDateTime) < selectedDate)
        .sort(
          (a: any, b: any) =>
            new Date(b.departureDateTime).getTime() - new Date(a.departureDateTime).getTime()
        )
        .slice(0, 1)
    : [];

  const tripsAfter = selectedDate
    ? trips
        .filter((trip: any) => new Date(trip.departureDateTime) > selectedDate)
        .sort(
          (a: any, b: any) =>
            new Date(a.departureDateTime).getTime() - new Date(b.departureDateTime).getTime()
        )
        .slice(0, 2)
    : [];

  const createTripSeatCards = (trips: any[]) => {
    return trips.flatMap((trip: any) => {
      if (!trip.route.prices || trip.route.prices.length === 0) {
        return [
          {
            tripId: trip.id,
            trip,
            seatClass: null,
            price: null,
            key: `${trip.id}-no-class`,
          },
        ];
      }

      return trip.route.prices.map((priceInfo: any) => ({
        tripId: trip.id,
        trip,
        seatClass: priceInfo.seatClass,
        price: priceInfo.price,
        key: `${trip.id}-${priceInfo.seatClass.id}`,
      }));
    });
  };

  const beforeSeatCards = createTripSeatCards(tripsBefore);
  const afterSeatCards = createTripSeatCards(tripsAfter);

  return (
    <div className="space-y-6">
      {/* No exact matches message */}
      <div className="text-center text-muted-foreground p-4 bg-secondary/50 rounded-lg">
        <p className="text-sm">No transfers available on your selected date.</p>
        <p className="text-xs mt-1">Here are recommended alternatives:</p>
      </div>

      {/* Available Before Section */}
      {beforeSeatCards.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Available Before</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {beforeSeatCards.map(
              ({
                trip,
                seatClass,
                price,
                key,
              }: {
                trip: any;
                seatClass: any;
                price: any;
                key: any;
              }) => (
                <AvailableTripCard key={key} trip={trip} seatClass={seatClass} price={price} />
              )
            )}
          </div>
        </div>
      )}

      {/* Available After Section */}
      {afterSeatCards.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Available After</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {afterSeatCards.map(
              ({
                trip,
                seatClass,
                price,
                key,
              }: {
                trip: any;
                seatClass: any;
                price: any;
                key: any;
              }) => (
                <AvailableTripCard key={key} trip={trip} seatClass={seatClass} price={price} />
              )
            )}
          </div>
        </div>
      )}

      {/* No alternatives available */}
      {beforeSeatCards.length === 0 && afterSeatCards.length === 0 && (
        <div className="text-center text-muted-foreground p-8">
          <MapPinIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No alternative trips found</p>
          <p className="text-sm">
            Try changing the departure city, destination country, or date range.
          </p>
        </div>
      )}

      {/* Global dialogs - available for all return paths */}
      <SeatSelectionDialog
        open={seatSelectionDialogOpen}
        onOpenChange={setSeatSelectionDialogOpen}
        trip={selectedTripForSeat}
        transport={selectedTransportForSeat}
        seatClass={selectedSeatClassForSeat}
        onSeatSelect={handleSeatSelect}
        tripTransports={tripTransports.filter(tt => tt.tripId === selectedTripForSeat?.id)}
      />

      <BookingConfirmationDialog
        isOpen={bookingConfirmationDialogOpen}
        onOpenChange={setBookingConfirmationDialogOpen}
        trip={selectedTripForBooking}
        seatClass={selectedSeatClassForBooking}
        price={selectedPriceForBooking || 0}
        preferredDepartureCity={preferredDepartureCity}
        onConfirm={handleBookingConfirm}
      />

      <CancelBookingDialog
        isOpen={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
};

export default AvailableTransfers;
