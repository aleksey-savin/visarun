import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import FormPageLayout from '@/components/Layout/Form';
import CombinedVisarunForm, { CombinedVisarunFormData } from '@/components/VisarunSchedule/Form';
import { useQueryClient } from '@tanstack/react-query';

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
  pickupLocations?: Array<{
    pickupLocation: {
      id: string;
      name: string;
    };
  }>;
}

interface RouteTransport {
  id: string;
  transport: { id: string };
  isActive: boolean;
  isDefault: boolean;
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
  const queryClient = useQueryClient();
  const isEditing = !!id;

  // Use unknown type assertion to bypass deep type recursion
  const queryResult = trpc.visarunSchedule.getOne.useQuery(
    { id: id!, includeTrips: false },
    { enabled: isEditing }
  ) as unknown as QueryResult;

  const { data: scheduleData, isLoading, error } = queryResult;

  // Schedule mutation
  const editScheduleMutation = trpc.visarunSchedule.edit.useMutation({
    onSuccess: () => {
      // Invalidate the query cache so fresh data is fetched on next edit
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast.error(`Error updating schedule: ${error.message}`);
    },
  }) as any;

  // Route mutations
  const editRouteMutation = trpc.visarunRoute.edit.useMutation() as any;
  const createRouteTransportMutation = trpc.visarunRouteTransport.create.useMutation() as any;
  const editRouteTransportMutation = trpc.visarunRouteTransport.edit.useMutation() as any;
  const deleteRouteTransportMutation = trpc.visarunRouteTransport.delete.useMutation() as any;
  const createSeatPriceMutation = trpc.visarunSeatPrice.create.useMutation() as any;
  const editSeatPriceMutation = trpc.visarunSeatPrice.edit.useMutation() as any;
  const deleteSeatPriceMutation = trpc.visarunSeatPrice.delete.useMutation() as any;

  const handleSubmit = async (data: CombinedVisarunFormData) => {
    if (!id || !scheduleData?.schedule?.route) {
      toast.error('No schedule data found');
      return;
    }

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

      // 2. Handle transports
      await handleTransportsUpdate(routeId, route.transports || [], data.transports);

      // 3. Handle seat prices
      await handleSeatPricesUpdate(routeId, route.prices || [], data.seatPrices || []);

      // 4. Update the schedule with route stops
      await editScheduleMutation.mutateAsync({
        id,
        daysOfWeek: data.daysOfWeek,
        departureTime: departureTime,
        validFrom: data.validFrom.toISOString(),
        validTo: data.validTo ? data.validTo.toISOString() : undefined,
        autoGeneratePeriodMonths: data.autoGeneratePeriodMonths,
        isActive: data.isActive,
        routeStops: data.routeStops.map((stop, index) => ({
          ...stop,
          stopOrder: index + 1,
        })),
      });

      toast.success('Schedule updated successfully');
      navigate(-1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      // Handle specific transport removal error
      if (errorMessage.includes('Cannot remove transport from route with active schedules')) {
        toast.error(
          'Cannot update transports: This route has existing trips that prevent transport changes. ' +
            'To fix this, the backend needs to be updated to automatically clean up scheduled trips without passengers when transport changes are made. ' +
            'Please contact your administrator.',
          {
            duration: 10000,
          }
        );
      } else {
        toast.error(`Failed to update schedule: ${errorMessage}`);
      }
      // Don't throw the error so the form can remain open for retry
    }
  };

  const handleTransportsUpdate = async (
    routeId: string,
    existingTransports: RouteTransport[],
    newTransports: CombinedVisarunFormData['transports']
  ) => {
    const newTransportIds = new Set(newTransports.map(t => t.transportId).filter(Boolean));
    const existingTransportsMap = new Map(existingTransports.map(t => [t.transport.id, t]));

    // Delete removed transports
    for (const existingTransport of existingTransports) {
      if (!newTransportIds.has(existingTransport.transport.id)) {
        await deleteRouteTransportMutation.mutateAsync({ id: existingTransport.id });
      }
    }

    // Add new transports or update existing ones
    for (const newTransport of newTransports) {
      if (newTransport.transportId) {
        const existingTransport = existingTransportsMap.get(newTransport.transportId);

        if (existingTransport) {
          // Update existing transport if isDefault or isActive changed
          if (
            existingTransport.isDefault !== newTransport.isDefault ||
            existingTransport.isActive !== newTransport.isActive
          ) {
            await editRouteTransportMutation.mutateAsync({
              id: existingTransport.id,
              isActive: newTransport.isActive,
              isDefault: newTransport.isDefault,
            });
          }
        } else {
          // Create new transport
          const createData = {
            routeId,
            transportId: newTransport.transportId,
            isActive: newTransport.isActive,
            isDefault: newTransport.isDefault,
          };

          await createRouteTransportMutation.mutateAsync(createData);
        }
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
          const updateData = {
            id: existingPrice.id,
            price: newPrice.price,
          };

          await editSeatPriceMutation.mutateAsync(updateData);
        }
      } else {
        // Create new price
        const createData = {
          routeId,
          seatClassId,
          price: newPrice.price,
        };

        await createSeatPriceMutation.mutateAsync(createData);
      }
    }
  };

  const handleCancel = () => {
    navigate(-1);
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
          schedule.route?.routeStops?.map((stop: RouteStop, index: number) => {
            const mappedStop = {
              id: stop.id,
              cityId: stop.cityId,
              stopType:
                index === 0
                  ? ('departure' as const)
                  : index === (schedule.route?.routeStops?.length ?? 0) - 1
                    ? ('arrival' as const)
                    : ('intermediate' as const),
              pickupMode: (stop.pickupMode as 'location' | 'address') || 'location',
              pickupLocationId: stop.pickupLocations?.[0]?.pickupLocation?.id || undefined,
              arrivalTime: stop.arrivalTime || '',
              departureTime: stop.departureTime || '',
              arrivalNextDay: stop.arrivalNextDay ?? false,
              waitingDuration: stop.waitingDuration ?? undefined,
              stopOrder: stop.stopOrder,
            };

            return mappedStop;
          }) || [],
        transports:
          schedule.route?.transports?.map((rt: RouteTransport) => ({
            id: rt.id,
            transportId: rt.transport.id,
            isActive: rt.isActive,
            isDefault: rt.isDefault,
          })) || [],
        seatPrices:
          schedule.route?.prices?.map((price: RoutePrice) => ({
            id: price.id,
            seatClassId: price.seatClass.id,
            price: typeof price.price === 'string' ? parseFloat(price.price) : price.price,
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
