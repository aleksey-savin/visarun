import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Users, Armchair, AlertTriangle } from 'lucide-react';
import { IconDisplay } from '../ui/icon-display';
import { Card } from '../ui/card';
import PassengersListCard from './PassengersListCard';
import OrderInfoDialog from './OrderInfoDialog';

interface TransportDropZoneProps {
  tripTransportId: string;
  seatClass?: {
    id: string;
    name: string;
    icon?: string;
  };
  seatCount: number;
  occupiedCount: number;
  passengers: any[];
  onDrop: (passenger: any, tripTransportId: string, seatClassId?: string) => Promise<void>;
  onRemove: (passengerId: string) => Promise<void>;
  isLoading?: boolean;
}

const TransportDropZone = ({
  tripTransportId,
  seatClass,
  seatCount,
  occupiedCount,
  passengers,
  onDrop,
  onRemove,
  isLoading = false,
}: TransportDropZoneProps) => {
  const [isOrderInfoDialogOpen, setIsOrderInfoDialogOpen] = useState(false);
  const [selectedOrderInfo, setSelectedOrderInfo] = useState<any>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [draggedPassengerCount, setDraggedPassengerCount] = useState(1);

  const availableSeats = seatCount - occupiedCount;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();

    // Check if this is a group drag by looking at custom data type
    const isGroupDrag = e.dataTransfer.types.includes('text/passenger-count');
    let passengerCount = 1;

    if (isGroupDrag) {
      try {
        const countStr = e.dataTransfer.getData('text/passenger-count');
        passengerCount = parseInt(countStr) || 1;
      } catch {
        passengerCount = 1;
      }
    }

    setDraggedPassengerCount(passengerCount);
    const insufficientSeats = passengerCount > availableSeats;

    e.dataTransfer.dropEffect = insufficientSeats ? 'none' : 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set dragOver to false if we're actually leaving the drop zone
    // Check if the related target is not a child of this element
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
      setDraggedPassengerCount(1);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setDraggedPassengerCount(1);
    setIsDropping(true);

    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));

      // Check if it's a group of passengers or a single passenger
      if (dragData.type === 'order-group' && dragData.passengers) {
        // Check if we have enough seats for the entire group
        if (dragData.passengers.length > availableSeats) {
          setErrorMessage(
            `Not enough seats available. Need ${dragData.passengers.length} seats, but only ${availableSeats} available.`
          );
          setShowError(true);
          setTimeout(() => setShowError(false), 3000);
          return;
        }

        // Handle group drop - process each passenger individually
        for (const passenger of dragData.passengers) {
          // Check seat class compatibility for each passenger
          if (seatClass && passenger.seatClassId && passenger.seatClassId !== seatClass.id) {
            setErrorMessage(
              `Some passengers are assigned to a different seat class and cannot be moved here`
            );
            setShowError(true);
            setTimeout(() => setShowError(false), 3000);
            return;
          }

          // Process each passenger individually
          await onDrop(passenger, tripTransportId, seatClass?.id);
        }
      } else {
        // Handle single passenger drop
        const passengerData = dragData;

        // Check if passenger is being moved to a different seat class they're not assigned to
        if (seatClass && passengerData.seatClassId && passengerData.seatClassId !== seatClass.id) {
          setErrorMessage(
            `Passenger is assigned to a different seat class and cannot be moved here`
          );
          setShowError(true);
          setTimeout(() => setShowError(false), 3000);
          return;
        }

        await onDrop(passengerData, tripTransportId, seatClass?.id);
      }
    } catch (error) {
      console.error('Failed to drop passenger:', error);
    } finally {
      setIsDropping(false);
    }
  };

  return (
    <Card
      className={cn('bg-secondary p-3', seatCount <= passengers.length ? 'border-emerald-600' : '')}
    >
      <div className="flex gap-2 items-center">
        <Badge className="rounded-full">
          {occupiedCount}/{seatCount}
        </Badge>
        <IconDisplay iconFilename={seatClass?.icon} iconType="transport-seat" />
        <span>{seatClass?.name}</span>
      </div>
      <Card
        className={cn(
          'bg-secondary border-2 p-3 transition-all duration-200 min-h-[120px]',
          seatCount <= passengers.length ? '' : 'border-dashed',
          isDragOver && seatCount > passengers.length
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/30',
          isDropping && 'opacity-50',
          isLoading && 'pointer-events-none opacity-50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drop zone content */}
        {isDragOver && seatCount > passengers.length && (
          <div
            className={cn(
              'flex items-center justify-center text-center text-sm text-muted-foreground'
            )}
          >
            <div className="text-primary">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p>Drop passenger{draggedPassengerCount > 1 ? 's' : ''} here</p>
              <p className="text-xs">{availableSeats} seats available</p>
              {seatClass && (
                <p className="text-xs text-muted-foreground mt-1">
                  Only {seatClass.name} class passengers
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error message */}
        {!isDragOver && showError && (
          <div className="flex flex-col justify-center items-center text-center text-destructive">
            <AlertTriangle className="h-6 w-6 mx-auto" />
            <p className="text-sm font-medium">Cannot drop here!</p>
            <p className="text-xs">{errorMessage}</p>
          </div>
        )}

        {/* Passengers list */}
        {((!isDragOver && !showError && passengers.length > 0) ||
          seatCount <= passengers.length) && (
          <PassengersListCard
            passengers={passengers}
            showInfoButton={true}
            showPaymentStatus={true}
            showRemoveButton={true}
            onRemove={onRemove}
            isDraggable={false}
            onInfoClick={order => {
              setSelectedOrderInfo(order);
              setIsOrderInfoDialogOpen(true);
            }}
          />
        )}

        {/* Empty state */}
        {!isDragOver && passengers.length === 0 && (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <div>
              <Armchair className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No passengers assigned</p>
              <p className="text-xs">Drag passengers here</p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isDropping && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
              <span>Assigning passenger...</span>
            </div>
          </div>
        )}
      </Card>
      <OrderInfoDialog
        isOpen={isOrderInfoDialogOpen}
        onClose={() => setIsOrderInfoDialogOpen(false)}
        orderInfo={selectedOrderInfo}
      />
    </Card>
  );
};

export default TransportDropZone;
