import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Info, CheckCircle, AlertCircle, XCircle, X } from 'lucide-react';
import ClientBadge from '../Client/ClientBadge';

interface PassengersListCardProps {
  passengers: any[];
  showRemoveButton?: boolean;
  showInfoButton?: boolean;
  showPaymentStatus?: boolean;
  onRemove?: (passengerId: string) => void;
  onInfoClick?: (order: any) => void;
  isDraggable?: boolean;
  className?: string;
}

const PassengersListCard = ({
  passengers,
  showRemoveButton = false,
  showInfoButton = false,
  showPaymentStatus = false,
  onRemove,
  onInfoClick,
  isDraggable = false,
  className = '',
}: PassengersListCardProps) => {
  if (passengers.length === 0) return null;

  // Group passengers by order
  const passengersByOrder = passengers.reduce(
    (groups: Record<string, any[]>, passenger) => {
      const orderId = passenger.orderItem?.orderId || 'no-order';
      if (!groups[orderId]) {
        groups[orderId] = [];
      }
      groups[orderId].push(passenger);
      return groups;
    },
    {} as Record<string, any[]>
  );

  // Create cards for each order group
  return (
    <div className="space-y-2">
      {Object.entries(passengersByOrder).map(([orderId, orderPassengers]) => {
        // Multiple passengers - show as grouped card
        return (
          <Card
            key={orderId}
            className={`p-0 pe-2 bg-secondary border-purple-800 border-y-0 border-s-0 border-e-8 rounded-none ${
              isDraggable ? 'cursor-move hover:border-e-[24px] transition-all' : ''
            } ${className}`}
            draggable={isDraggable}
            onDragStart={e => {
              if (!isDraggable) return;
              // Store all passengers from this order for drag operation
              e.dataTransfer.setData(
                'application/json',
                JSON.stringify({
                  type: 'order-group',
                  passengers: orderPassengers,
                })
              );
              e.dataTransfer.effectAllowed = 'move';
              // Set passenger count for drag over validation
              e.dataTransfer.setData('text/passenger-count', orderPassengers.length.toString());
              // Set seat class data from first passenger for validation
              if (orderPassengers[0]?.seatClassId) {
                e.dataTransfer.setData('text/seat-class-id', orderPassengers[0].seatClassId);
              }
            }}
          >
            <div className="flex items-center gap-2 w-full">
              {showInfoButton && (
                <div className="flex-shrink-0 self-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={e => {
                      e.stopPropagation();
                      onInfoClick?.(orderPassengers[0]?.orderItem?.order);
                    }}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="space-y-1 flex-1 min-w-0">
                {orderPassengers
                  .sort((a, b) => {
                    // Primary clients first
                    if (a.client.isPrimary && !b.client.isPrimary) return -1;
                    if (!a.client.isPrimary && b.client.isPrimary) return 1;
                    return 0;
                  })
                  .map(passenger => (
                    <div
                      key={passenger.id}
                      className="flex items-center justify-between w-full gap-1"
                    >
                      <div className="flex-1">
                        <ClientBadge
                          client={passenger.client}
                          passenger={passenger}
                          fullWidth={true}
                          isDraggable={isDraggable}
                        />
                      </div>
                      {showRemoveButton && (
                        <Button variant="ghost" size="sm" onClick={() => onRemove?.(passenger.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
              </div>
              {showPaymentStatus && (
                <div className="flex-shrink-0">
                  {(() => {
                    // Calculate order total from first passenger only
                    const firstPassenger = orderPassengers[0];
                    if (!firstPassenger?.orderItem?.order?.items) {
                      return (
                        <span className="text-destructive">
                          <XCircle className="h-5 w-5" />
                        </span>
                      );
                    }

                    const orderTotal = firstPassenger.orderItem.order.items.reduce(
                      (sum: number, item: any) => sum + (item.finalPrice || 0),
                      0
                    );

                    const orderPayments = firstPassenger.orderItem.order.orderPayments || [];
                    const paymentsTotal = orderPayments.reduce(
                      (sum: number, payment: any) => sum + (Number(payment.amount) || 0),
                      0
                    );

                    let colorClass = 'text-destructive';
                    let icon = <XCircle className="h-5 w-5" />;
                    if (orderPayments.length > 0) {
                      if (paymentsTotal >= orderTotal) {
                        colorClass = 'text-success';
                        icon = <CheckCircle className="h-5 w-5" />;
                      } else {
                        colorClass = 'text-warning';
                        icon = <AlertCircle className="h-5 w-5" />;
                      }
                    }

                    return <span className={colorClass}>{icon}</span>;
                  })()}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default PassengersListCard;
