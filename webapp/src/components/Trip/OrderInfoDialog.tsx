import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { formatCurrency } from '@/utils/currency';

interface OrderInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderInfo: any;
}

const OrderInfoDialog = ({ isOpen, onClose, orderInfo }: OrderInfoDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Information</DialogTitle>
        </DialogHeader>

        {orderInfo && (
          <div className="space-y-6">
            {/* Order Basic Info */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Order Details</h3>
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <span className="font-medium">Order ID:</span> {orderInfo.id}
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <Badge
                    className="ml-2"
                    variant={orderInfo.status === 'completed' ? 'default' : 'secondary'}
                  >
                    {orderInfo.status}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Created:</span>{' '}
                  {new Date(orderInfo.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Updated:</span>{' '}
                  {new Date(orderInfo.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Order Items */}
            {orderInfo.items && orderInfo.items.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Order Items</h3>
                <div className="space-y-4">
                  {Object.entries(
                    orderInfo.items
                      .sort((a: any, b: any) => {
                        // Primary clients first
                        if (a.client.isPrimary && !b.client.isPrimary) return -1;
                        if (!a.client.isPrimary && b.client.isPrimary) return 1;
                        // Then by client name
                        return `${a.client.lastName} ${a.client.firstName}`.localeCompare(
                          `${b.client.lastName} ${b.client.firstName}`
                        );
                      })
                      .reduce((groups: any, item: any) => {
                        const clientKey = `${item.client.id}-${item.client.lastName} ${item.client.firstName}`;
                        if (!groups[clientKey]) {
                          groups[clientKey] = {
                            client: item.client,
                            items: [],
                          };
                        }
                        groups[clientKey].items.push(item);
                        return groups;
                      }, {})
                  ).map(([clientKey, group]: [string, any]) => (
                    <div key={clientKey} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">
                          {`${group.client.lastName} ${group.client.firstName}`}
                        </h4>
                        {group.client.isPrimary && (
                          <Badge variant="outline" className="text-xs">
                            Primary
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2 ml-4">
                        {group.items.map((item: any, index: number) => (
                          <Card key={item.id || index} className="p-3">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <div className="text-sm">
                                  <div>{item.serviceType || 'N/A'}</div>
                                  {item.service?.serviceType && (
                                    <div>
                                      <span className="font-medium">Type:</span>{' '}
                                      {item.service.serviceType}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right text-sm">
                                  {formatCurrency(item.finalPrice || 0, 'VND')}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Total:</span>
                  <div className="text-lg font-semibold">
                    {formatCurrency(
                      orderInfo.items.reduce(
                        (sum: number, item: any) => sum + (item.finalPrice || 0),
                        0
                      ),
                      'VND'
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payment Information */}
            {orderInfo.orderPayments && orderInfo.orderPayments.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Payments</h3>
                <div className="space-y-2">
                  {orderInfo.orderPayments.map((payment: any, index: number) => (
                    <Card key={payment.id || index} className="p-3">
                      <div className="flex flex-wrap gap-2 text-sm justify-between">
                        {formatCurrency(payment.amount || 0, 'VND')}
                        <div className="text-foreground">{payment.paymentMethod || 'N/A'}</div>
                        {payment.paidAt && (
                          <div>{new Date(payment.paidAt).toLocaleDateString()}</div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Total Paid:</span>
                  <div className="text-lg font-semibold">
                    {formatCurrency(
                      orderInfo.orderPayments.reduce(
                        (sum: number, payment: any) => sum + (Number(payment.amount) || 0),
                        0
                      ),
                      'VND'
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderInfoDialog;
