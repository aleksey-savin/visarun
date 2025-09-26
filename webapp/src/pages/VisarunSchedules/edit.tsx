import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import FormPageLayout from '@/components/Layout/Form';
import CombinedVisarunForm, { CombinedVisarunFormData } from '@/components/VisarunSchedule/Form';

// Define interfaces to avoid deep type recursion issues
interface RouteStop {
  id: string;
  cityId: string;
  pickupMode: string;
  arrivalTime: string | null;
  departureTime: string | null;
  arrivalNextDay: boolean | null;
  waitingDuration: number | null;
  stopOrder: number;
}

interface RouteTransport {
  id: string;
  transport: { id: string };
  isActive: boolean;
}

interface RoutePrice {
  id: string;
  seatClass: { id: string };
  price: number;
}

interface Route {
  id: string;
  stamp?: boolean;
  visa?: boolean;
  routeStops?: RouteStop[];
  transports?: RouteTransport[];
  prices?: RoutePrice[];
}

interface Schedule {
  id: string;
  daysOfWeek: number[];
  departureTime: string;
  validFrom: string;
  validTo: string | null;
  autoGeneratePeriodMonths: number;
  isActive: boolean;
  route?: Route;
}

type QueryResult = {
  data: { schedule: Schedule } | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

export default function EditVisarunSchedulePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  // Use unknown type assertion to bypass deep type recursion
  const queryResult = trpc.visarunSchedule.getOne.useQuery(
    { id: id!, includeTrips: false },
    { enabled: isEditing }
  ) as unknown as QueryResult;

  const { data: scheduleData, isLoading, error, refetch: refetchSchedule } = queryResult;

  // Schedule mutation
  const editScheduleMutation = trpc.visarunSchedule.edit.useMutation({
    onSuccess: () => {
      toast.success('Schedule updated successfully');
      refetchSchedule();
    },
    onError: (error: any) => {
      toast.error(`Error updating schedule: ${error.message}`);
    },
  }) as any;

  // Route mutations
  const editRouteMutation = trpc.visarunRoute.edit.useMutation() as any;
  const createRouteStopMutation = trpc.visarunRouteStop.create.useMutation() as any;
  const editRouteStopMutation = trpc.visarunRouteStop.edit.useMutation() as any;
  const deleteRouteStopMutation = trpc.visarunRouteStop.delete.useMutation() as any;
  const createRouteTransportMutation = trpc.visarunRouteTransport.create.useMutation() as any;
  const deleteRouteTransportMutation = trpc.visarunRouteTransport.delete.useMutation() as any;
  const createSeatPriceMutation = trpc.visarunSeatPrice.create.useMutation() as any;
  const editSeatPriceMutation = trpc.visarunSeatPrice.edit.useMutation() as any;
  const deleteSeatPriceMutation = trpc.visarunSeatPrice.delete.useMutation() as any;

  const handleSubmit = async (data: CombinedVisarunFormData) => {
    if (!id || !scheduleData?.schedule?.route) return;

    try {
      const route = scheduleData.schedule.route;
      const routeId = route.id;

      // Get departure time from first stop
      const departureTime = data.routeStops[0]?.departureTime || '';

      // 1. Update route basic info (stamp, visa)
      await editRouteMutation.mutateAsync({
        id: routeId,
        stamp: data.stamp,
        visa: data.visa,
        isActive: true,
      });

      // 2. Handle route stops
      await handleRouteStopsUpdate(routeId, route.routeStops || [], data.routeStops);

      // 3. Handle transports
      await handleTransportsUpdate(routeId, route.transports || [], data.transports);

      // 4. Handle seat prices
      await handleSeatPricesUpdate(routeId, route.prices || [], data.seatPrices || []);

      // 5. Update the schedule
      await editScheduleMutation.mutateAsync({
        id,
        daysOfWeek: data.daysOfWeek,
        departureTime: departureTime,
        validFrom: data.validFrom.toISOString(),
        validTo: data.validTo ? data.validTo.toISOString() : undefined,
        autoGeneratePeriodMonths: data.autoGeneratePeriodMonths,
        isActive: data.isActive,
      });

      navigate('/visarun-schedules');
    } catch (error) {
      console.error('Error updating schedule and route:', error);
      toast.error(
        `Failed to update schedule: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  };

  const handleRouteStopsUpdate = async (
    routeId: string,
    existingStops: RouteStop[],
    newStops: CombinedVisarunFormData['routeStops']
  ) => {
    // Create a map of existing stops by order for easier lookup
    const existingStopsMap = new Map(existingStops.map(stop => [stop.stopOrder, stop]));

    // Process each new stop
    for (let i = 0; i < newStops.length; i++) {
      const newStop = newStops[i];
      const stopOrder = i + 1;
      const existingStop = existingStopsMap.get(stopOrder);

      if (existingStop) {
        // Update existing stop if there are changes
        const hasChanges =
          existingStop.cityId !== newStop.cityId ||
          existingStop.pickupMode !== newStop.pickupMode ||
          existingStop.arrivalTime !== (newStop.arrivalTime || null) ||
          existingStop.departureTime !== (newStop.departureTime || null) ||
          existingStop.arrivalNextDay !== newStop.arrivalNextDay ||
          existingStop.waitingDuration !== (newStop.waitingDuration || null);

        if (hasChanges) {
          await editRouteStopMutation.mutateAsync({
            id: existingStop.id,
            stopType: newStop.stopType,
            pickupMode: newStop.pickupMode,
            arrivalTime: newStop.arrivalTime || undefined,
            departureTime: newStop.departureTime || undefined,
            arrivalNextDay: newStop.arrivalNextDay,
            waitingDuration: newStop.waitingDuration || undefined,
          });
        }
        existingStopsMap.delete(stopOrder);
      } else {
        // Create new stop
        await createRouteStopMutation.mutateAsync({
          routeId,
          cityId: newStop.cityId,
          stopOrder,
          stopType: newStop.stopType,
          pickupMode: newStop.pickupMode,
          arrivalTime: newStop.arrivalTime || undefined,
          departureTime: newStop.departureTime || undefined,
          arrivalNextDay: newStop.arrivalNextDay,
          waitingDuration: newStop.waitingDuration || undefined,
        });
      }
    }

    // Delete remaining existing stops that are no longer needed
    for (const [, existingStop] of existingStopsMap) {
      await deleteRouteStopMutation.mutateAsync({ id: existingStop.id });
    }
  };

  const handleTransportsUpdate = async (
    routeId: string,
    existingTransports: RouteTransport[],
    newTransports: CombinedVisarunFormData['transports']
  ) => {
    const existingTransportIds = new Set(existingTransports.map(t => t.transport.id));
    const newTransportIds = new Set(newTransports.map(t => t.transportId).filter(Boolean));

    // Delete removed transports
    for (const existingTransport of existingTransports) {
      if (!newTransportIds.has(existingTransport.transport.id)) {
        await deleteRouteTransportMutation.mutateAsync({ id: existingTransport.id });
      }
    }

    // Add new transports
    for (const newTransport of newTransports) {
      if (newTransport.transportId && !existingTransportIds.has(newTransport.transportId)) {
        await createRouteTransportMutation.mutateAsync({
          routeId,
          transportId: newTransport.transportId,
          isActive: newTransport.isActive,
        });
      }
    }
  };

  const handleSeatPricesUpdate = async (
    routeId: string,
    existingPrices: RoutePrice[],
    newPrices: CombinedVisarunFormData['seatPrices']
  ) => {
    const existingPricesMap = new Map(existingPrices.map(p => [p.seatClass.id, p]));
    const newPricesMap = new Map(
      (newPrices || []).filter(p => p.seatClassId && p.price > 0).map(p => [p.seatClassId, p])
    );

    // Delete removed prices
    for (const [seatClassId, existingPrice] of existingPricesMap) {
      if (!newPricesMap.has(seatClassId)) {
        await deleteSeatPriceMutation.mutateAsync({ id: existingPrice.id });
      }
    }

    // Add new prices or update existing ones
    for (const [seatClassId, newPrice] of newPricesMap) {
      const existingPrice = existingPricesMap.get(seatClassId);

      if (existingPrice) {
        // Update if price changed
        if (existingPrice.price !== newPrice.price) {
          await editSeatPriceMutation.mutateAsync({
            id: existingPrice.id,
            price: newPrice.price,
          });
        }
      } else {
        // Create new price
        await createSeatPriceMutation.mutateAsync({
          routeId,
          seatClassId,
          price: newPrice.price,
        });
      }
    }
  };

  const handleCancel = () => {
    navigate('/visarun-schedules');
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isEditing && error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <span>Error loading schedule: {error.message}</span>
        </div>
      </div>
    );
  }

  const schedule = scheduleData?.schedule;

  const initialData: Partial<CombinedVisarunFormData> | undefined = schedule
    ? {
        stamp: schedule.route?.stamp ?? false,
        visa: schedule.route?.visa ?? false,
        routeStops:
          schedule.route?.routeStops?.map((stop: RouteStop, index: number) => ({
            id: stop.id,
            cityId: stop.cityId,
            stopType:
              index === 0
                ? ('departure' as const)
                : index === (schedule.route?.routeStops?.length ?? 0) - 1
                  ? ('arrival' as const)
                  : ('intermediate' as const),
            pickupMode:
              stop.pickupMode === 'PICKUP_POINT'
                ? ('location' as const)
                : stop.pickupMode === 'DOOR_TO_DOOR'
                  ? ('address' as const)
                  : ('none' as const),
            arrivalTime: stop.arrivalTime || '',
            departureTime: stop.departureTime || '',
            arrivalNextDay: stop.arrivalNextDay ?? false,
            waitingDuration: stop.waitingDuration ?? undefined,
            stopOrder: stop.stopOrder,
          })) || [],
        transports:
          schedule.route?.transports?.map((rt: RouteTransport) => ({
            id: rt.id,
            transportId: rt.transport.id,
            isActive: rt.isActive,
          })) || [],
        seatPrices:
          schedule.route?.prices?.map((price: RoutePrice) => ({
            id: price.id,
            seatClassId: price.seatClass.id,
            price: price.price,
          })) || [],
        daysOfWeek: Array.isArray(schedule.daysOfWeek) ? (schedule.daysOfWeek as number[]) : [],
        departureTime: schedule.departureTime,
        validFrom: new Date(schedule.validFrom),
        validTo: schedule.validTo ? new Date(schedule.validTo) : undefined,
        autoGeneratePeriodMonths: schedule.autoGeneratePeriodMonths,
        isActive: schedule.isActive,
      }
    : undefined;

  return (
    <FormPageLayout>
      <CombinedVisarunForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        mode="edit"
      />
    </FormPageLayout>
  );
}
