import { useState } from 'react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { CheckCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Separator } from '../ui/separator';
import TransportReportUpload from './TransportReportUpload';
import { formatCurrency } from '@/utils/currency';

interface TripTransport {
  id: string;
  driverName: string | null;
  driverPhone: string | null;
  vehicleNumber: string | null;
  status: string;
  createdAt: string;
  reportUrl: string | null;
  transport: {
    id: string;
    name: string;
    seatCount: number | null;
    transportType: {
      id: string;
      name: string;
      icon: string | null;
    };
  };
}

interface OrderPaymentsConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTransportId: string | null;
  tripTransports: TripTransport[];
  passengersData: any[];
  tripId?: string;
  onConfirm: () => Promise<void>;
}

const OrderPaymentsConfirmationDialog = ({
  isOpen,
  onClose,
  selectedTransportId,
  tripTransports,
  passengersData,
  tripId,
  onConfirm,
}: OrderPaymentsConfirmationDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const utils = trpc.useContext();

  const createOrderPaymentMutation = trpc.orderPayment.create.useMutation({
    onError: error => {
      console.error('Failed to create payment:', error.message);
    },
  });

  const editTripTransportMutation = trpc.visarunTripTransport.edit.useMutation({
    onSuccess: () => {
      utils.visarunTripTransport.getByTripIds.invalidate();
    },
    onError: error => {
      console.error('Failed to update transport status:', error.message);
    },
  });

  const editTripMutation = trpc.visarunTrip.edit.useMutation({
    onSuccess: () => {
      utils.visarunTrip.getAll.invalidate();
    },
    onError: error => {
      console.error('Failed to update trip status:', error.message);
    },
  });

  const handleConfirm = async () => {
    if (!selectedTransportId || !passengersData) return;

    setIsProcessing(true);
    try {
      // Get primary passengers for this transport
      const primaryPassengers = passengersData.filter(
        passenger =>
          passenger.tripTransportId === selectedTransportId && passenger.client?.isPrimary === true
      );

      // Get unique orders from primary clients
      const uniqueOrders = new Map();
      primaryPassengers.forEach(passenger => {
        if (passenger.orderItem?.order) {
          uniqueOrders.set(passenger.orderItem.order.id, passenger.orderItem.order);
        }
      });

      // Create cash payments for each order
      const paymentPromises = Array.from(uniqueOrders.values()).map(async (order: any) => {
        const totalOrderItems =
          order.items?.reduce((sum: number, item: any) => {
            const finalPrice = item?.finalPrice;
            return sum + (typeof finalPrice === 'number' ? finalPrice : 0);
          }, 0) || 0;

        const existingPayments =
          order.orderPayments?.reduce((sum: number, payment: any) => {
            const amount = payment?.amount;
            const numericAmount =
              typeof amount === 'string'
                ? parseFloat(amount)
                : typeof amount === 'number'
                  ? amount
                  : 0;
            return sum + (isNaN(numericAmount) ? 0 : numericAmount);
          }, 0) || 0;

        const remainingAmount = totalOrderItems - existingPayments;

        if (remainingAmount > 0) {
          return createOrderPaymentMutation.mutateAsync({
            orderId: order.id,
            amount: remainingAmount,
            paymentMethod: 'cash' as const,
            confirmPaymentWithoutDocument: true,
          });
        }
      });

      // Wait for all payments to be created
      await Promise.all(paymentPromises.filter(Boolean));

      // Update transport status to completed
      await editTripTransportMutation.mutateAsync({
        id: selectedTransportId,
        status: 'completed',
      });

      // Check if this is the last transport - if so, complete the trip
      const otherTransports = tripTransports.filter(t => t.id !== selectedTransportId);
      const allOtherTransportsCompleted = otherTransports.every(t => t.status === 'completed');

      console.log('Transport completion check:', {
        selectedTransportId,
        otherTransports: otherTransports.map(t => ({ id: t.id, status: t.status })),
        allOtherTransportsCompleted,
        tripId,
      });

      if (allOtherTransportsCompleted && tripId) {
        console.log('Completing trip:', tripId);
        await editTripMutation.mutateAsync({
          id: tripId,
          status: 'completed',
        });
      }

      // Call parent onConfirm callback
      await onConfirm();

      // Close dialog and refetch data
      onClose();
      utils.visarunPassenger.getAll.invalidate();
      utils.visarunTripTransport.getByTripIds.invalidate();
    } catch (error) {
      console.error('Failed to confirm payments:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedTransport = tripTransports.find(t => t.id === selectedTransportId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Confirm Payments</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 py-4 space-y-4">
          {selectedTransportId &&
            passengersData &&
            (() => {
              // Get primary passengers for selected transport
              const primaryPassengers = passengersData.filter(
                passenger =>
                  passenger.tripTransportId === selectedTransportId &&
                  passenger.client?.isPrimary === true
              );

              // Get unique orders from primary clients
              const uniqueOrders = new Map();
              primaryPassengers.forEach(passenger => {
                if (passenger.orderItem?.order) {
                  uniqueOrders.set(passenger.orderItem.order.id, passenger.orderItem.order);
                }
              });

              return (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Upload transport report and confirm cash payments for the following orders. This
                    will mark the transport as completed:
                  </p>

                  <Separator />

                  {Array.from(uniqueOrders.values()).map((order: any) => {
                    const totalOrderItems =
                      order.items?.reduce((sum: number, item: any) => {
                        const finalPrice = item?.finalPrice;
                        return sum + (typeof finalPrice === 'number' ? finalPrice : 0);
                      }, 0) || 0;

                    const existingPayments =
                      order.orderPayments?.reduce((sum: number, payment: any) => {
                        const amount = payment?.amount;
                        const numericAmount =
                          typeof amount === 'string'
                            ? parseFloat(amount)
                            : typeof amount === 'number'
                              ? amount
                              : 0;
                        return sum + (isNaN(numericAmount) ? 0 : numericAmount);
                      }, 0) || 0;

                    const remainingAmount = totalOrderItems - existingPayments;

                    // Find the primary client for this order
                    const primaryClient = primaryPassengers.find(
                      passenger => passenger.orderItem?.order?.id === order.id
                    )?.client;

                    return (
                      <Card key={order.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="font-medium">
                              {primaryClient?.firstName} {primaryClient?.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Order ID: {order.id.slice(-8)}
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-sm">
                              Total: {formatCurrency(totalOrderItems, 'VND')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Paid: {formatCurrency(existingPayments, 'VND')}
                            </div>
                            {remainingAmount > 0 && (
                              <div className="font-medium text-orange-600">
                                Cash payment: {formatCurrency(remainingAmount, 'VND')}
                              </div>
                            )}
                            {remainingAmount <= 0 && (
                              <div className="text-sm text-emerald-600 flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                Fully paid
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}

                  {/* Payment Summary */}
                  {(() => {
                    const grandTotalOrderItems = Array.from(uniqueOrders.values()).reduce(
                      (sum: number, order: any) => {
                        const totalOrderItems =
                          order.items?.reduce((itemSum: number, item: any) => {
                            const finalPrice = item?.finalPrice;
                            return itemSum + (typeof finalPrice === 'number' ? finalPrice : 0);
                          }, 0) || 0;
                        return sum + totalOrderItems;
                      },
                      0
                    );

                    const grandTotalExistingPayments = Array.from(uniqueOrders.values()).reduce(
                      (sum: number, order: any) => {
                        const existingPayments =
                          order.orderPayments?.reduce((paymentSum: number, payment: any) => {
                            const amount = payment?.amount;
                            const numericAmount =
                              typeof amount === 'string'
                                ? parseFloat(amount)
                                : typeof amount === 'number'
                                  ? amount
                                  : 0;
                            return paymentSum + (isNaN(numericAmount) ? 0 : numericAmount);
                          }, 0) || 0;
                        return sum + existingPayments;
                      },
                      0
                    );

                    const grandTotalCashPayments =
                      grandTotalOrderItems - grandTotalExistingPayments;

                    return (
                      <Card className="p-4 bg-secondary">
                        <div className="flex justify-between items-center">
                          <div className="font-semibold">Total Summary</div>
                          <div className="text-right space-y-1">
                            <div className="text-sm">
                              Grand Total: {formatCurrency(grandTotalOrderItems, 'VND')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Already Paid: {formatCurrency(grandTotalExistingPayments, 'VND')}
                            </div>
                            {grandTotalCashPayments > 0 && (
                              <div className="font-semibold text-orange-600">
                                Cash Payments: {formatCurrency(grandTotalCashPayments, 'VND')}
                              </div>
                            )}
                            {grandTotalCashPayments <= 0 && (
                              <div className="text-sm text-emerald-600 flex items-center gap-1 justify-end">
                                <CheckCircle className="h-4 w-4" />
                                All payments complete
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })()}

                  <Separator />
                  {/* Transport Report Upload */}
                  <div className="space-y-2">
                    {(() => {
                      if (!selectedTransport) {
                        return (
                          <div className="text-sm text-muted-foreground">Transport not found</div>
                        );
                      }
                      return <TransportReportUpload tripTransport={selectedTransport} />;
                    })()}
                  </div>
                </div>
              );
            })()}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Confirm Payments'}
          </Button>
          {(createOrderPaymentMutation.error ||
            editTripTransportMutation.error ||
            editTripMutation.error) && (
            <div className="text-red-600 text-sm mt-2">
              Error:{' '}
              {createOrderPaymentMutation.error?.message ||
                editTripTransportMutation.error?.message ||
                editTripMutation.error?.message}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderPaymentsConfirmationDialog;
