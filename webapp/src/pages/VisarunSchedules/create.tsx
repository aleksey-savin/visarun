import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import FormPageLayout from '@/components/Layout/Form';
import CombinedVisarunForm, { CombinedVisarunFormData } from '@/components/VisarunSchedule/Form';
import { getAllVisarunSchedulesRoute } from '@/lib/routes';

export default function CreateVisarunSchedulePage() {
  const navigate = useNavigate();

  // Mutations for creating route and related data
  const createRouteMutation = trpc.visarunRoute.create.useMutation();
  const createRouteStopMutation = trpc.visarunRouteStop.create.useMutation();
  const createRouteTransportMutation = trpc.visarunRouteTransport.create.useMutation();
  const createSeatPriceMutation = trpc.visarunSeatPrice.create.useMutation();
  const createScheduleMutation = trpc.visarunSchedule.create.useMutation();

  const handleSubmit = async (data: CombinedVisarunFormData) => {
    try {
      // Get departure time from first stop
      const departureTime = data.routeStops[0]?.departureTime || '';
      const dataWithDepartureTime = { ...data, departureTime };

      // Create the route first
      const routeResult = await createRouteMutation.mutateAsync({
        stamp: data.stamp,
        visa: data.visa,
        isActive: true,
      });

      const routeId = routeResult.route.id;

      // Create route stops
      for (let i = 0; i < data.routeStops.length; i++) {
        const stop = data.routeStops[i];
        await createRouteStopMutation.mutateAsync({
          routeId,
          cityId: stop.cityId,
          stopOrder: i + 1,
          stopType: stop.stopType,
          pickupMode: stop.pickupMode,
          arrivalTime: stop.arrivalTime || undefined,
          departureTime: stop.departureTime || undefined,
          arrivalNextDay: stop.arrivalNextDay,
          waitingDuration: stop.waitingDuration || undefined,
        });
      }

      // Create route transports
      for (const transport of data.transports) {
        if (transport.transportId) {
          await createRouteTransportMutation.mutateAsync({
            routeId,
            transportId: transport.transportId,
            isActive: transport.isActive,
          });
        }
      }

      // Create seat prices
      if (data.seatPrices && data.seatPrices.length > 0) {
        for (const seatPrice of data.seatPrices) {
          if (seatPrice.seatClassId && seatPrice.price > 0) {
            await createSeatPriceMutation.mutateAsync({
              routeId,
              seatClassId: seatPrice.seatClassId,
              price: seatPrice.price,
            });
          }
        }
      }

      // Create the schedule
      await createScheduleMutation.mutateAsync({
        routeId,
        daysOfWeek: dataWithDepartureTime.daysOfWeek,
        departureTime: departureTime,
        validFrom: dataWithDepartureTime.validFrom.toISOString(),
        validTo: dataWithDepartureTime.validTo
          ? dataWithDepartureTime.validTo.toISOString()
          : undefined,
        autoGeneratePeriodMonths: dataWithDepartureTime.autoGeneratePeriodMonths,
        isActive: dataWithDepartureTime.isActive,
      });

      toast.success('Schedule created successfully');
      navigate(getAllVisarunSchedulesRoute());
    } catch (error) {
      console.error('Error creating route and schedule:', error);
      toast.error(
        `Error creating schedule: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  };

  const handleCancel = () => {
    navigate('/visarun-schedules');
  };

  return (
    <FormPageLayout>
      <CombinedVisarunForm onSubmit={handleSubmit} onCancel={handleCancel} mode="create" />
    </FormPageLayout>
  );
}
