import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import FormPageLayout from '@/components/Layout/Form';
import CombinedVisarunForm, { CombinedVisarunFormData } from '@/components/VisarunSchedule/Form';

// Define interfaces to avoid deep type recursion issues
interface RouteStop {
  cityId: string;
  pickupMode: string;
  arrivalTime: string | null;
  departureTime: string | null;
  arrivalNextDay: boolean | null;
  waitingDuration: number | null;
}

interface RouteTransport {
  transport: { id: string };
  isActive: boolean;
}

interface RoutePrice {
  seatClass: { id: string };
  price: number;
}

interface Route {
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

  const editMutation = trpc.visarunSchedule.edit.useMutation({
    onSuccess: () => {
      toast.success('Schedule updated successfully');
      refetchSchedule();
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  }) as any;

  const handleSubmit = async (data: CombinedVisarunFormData) => {
    if (!id) return;

    try {
      // Get departure time from first stop
      const departureTime = data.routeStops[0]?.departureTime || '';

      await editMutation.mutateAsync({
        id,
        daysOfWeek: data.daysOfWeek,
        departureTime: departureTime,
        validFrom: data.validFrom,
        validTo: data.validTo,
        autoGeneratePeriodMonths: data.autoGeneratePeriodMonths,
        isActive: data.isActive,
      });

      navigate('/visarun-schedules');
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error(
        `Failed to update schedule: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
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
          })) || [],
        transports:
          schedule.route?.transports?.map((rt: RouteTransport) => ({
            transportId: rt.transport.id,
            isActive: rt.isActive,
          })) || [],
        seatPrices:
          schedule.route?.prices?.map((price: RoutePrice) => ({
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
    <FormPageLayout title="Edit Visarun Schedule" onBack={handleCancel}>
      <CombinedVisarunForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        mode="edit"
      />
    </FormPageLayout>
  );
}
