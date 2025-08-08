import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/lib/trpc';
import { formatCurrency } from '@/utils/currency.js';
import { AlertTriangle, ArrowLeft, Edit, FileText, User, Package } from 'lucide-react';
import { getEditOrderRoute, getAllOrdersRoute } from '@/lib/routes';

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function ViewOrderPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: orderData,
    isLoading,
    error,
  } = trpc.order.getOne.useQuery({ id: id! }, { enabled: !!id });

  const order = orderData;

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading order details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <span>Error loading order: {error.message}</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="text-center">Order not found</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to={getAllOrdersRoute()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Order Details</h1>
            <p className="text-muted-foreground">Order ID: {order.id}</p>
          </div>
        </div>
        <Button asChild>
          <Link to={getEditOrderRoute({ id: order.id })}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Order
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Order Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge
                  className={
                    statusColors[order.status as keyof typeof statusColors] ||
                    'bg-gray-100 text-gray-800'
                  }
                >
                  {order.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-lg font-semibold">
                  {order.items
                    ? formatCurrency(
                        order.items.reduce(
                          (sum: number, item: { finalPrice: number }) => sum + item.finalPrice,
                          0
                        ),
                        'VND'
                      )
                    : 'N/A'}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p>{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Items Count</p>
                <p>{order.items?.length || 0} items</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="font-medium">
                {order.user.firstName} {order.user.middleName} {order.user.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p>{order.user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">User ID</p>
              <p className="font-mono text-sm">{order.user.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Items
          </CardTitle>
          <CardDescription>{order.items?.length || 0} item(s) in this order</CardDescription>
        </CardHeader>
        <CardContent>
          {order.items && order.items.length > 0 ? (
            <div className="space-y-4">
              {order.items.map(
                (
                  item: any // eslint-disable-line @typescript-eslint/no-explicit-any
                ) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{item.serviceType}</Badge>
                          <span className="text-sm text-muted-foreground">
                            Service ID: {item.serviceTypeId}
                          </span>
                        </div>

                        <div className="mb-2">
                          <p className="text-sm font-medium text-muted-foreground">Client</p>
                          <p>
                            {item.client.firstName || ''} {item.client.lastName || ''}
                          </p>
                          {item.client.citizenship && (
                            <p className="text-sm text-muted-foreground">
                              Citizenship: {item.client.citizenship.name}
                            </p>
                          )}
                        </div>

                        {item.note && (
                          <div className="mb-2">
                            <p className="text-sm font-medium text-muted-foreground">Note</p>
                            <p className="text-sm">{item.note}</p>
                          </div>
                        )}

                        {item.discountRule && (
                          <div className="mb-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Discount Rule
                            </p>
                            <p className="text-sm">
                              {item.discountRule.name} ({item.discountRule.discountType}:{' '}
                              {item.discountRule.discountValue})
                            </p>
                            {item.discountComment && (
                              <p className="text-xs text-muted-foreground">
                                {item.discountComment}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Base Price</p>
                            <p className="font-medium">{formatCurrency(item.basePrice, 'VND')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Discount</p>
                            <p className="font-medium text-green-600">
                              -{formatCurrency(item.discountAmount, 'VND')}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Final Price</p>
                            <p className="font-medium">{formatCurrency(item.finalPrice, 'VND')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}

              <Separator />

              <div className="flex justify-end">
                <div className="text-right space-y-1">
                  {order.items && (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Base Total:{' '}
                        {formatCurrency(
                          order.items.reduce((sum: number, item: any) => sum + item.basePrice, 0), // eslint-disable-line @typescript-eslint/no-explicit-any
                          'VND'
                        )}
                      </p>
                      <p className="text-sm text-green-600">
                        Total Discount: -
                        {formatCurrency(
                          order.items.reduce(
                            (sum: number, item: any) => sum + item.discountAmount, // eslint-disable-line @typescript-eslint/no-explicit-any
                            0
                          ),
                          'VND'
                        )}
                      </p>
                      <p className="text-lg font-semibold">
                        Final Total:{' '}
                        {formatCurrency(
                          order.items.reduce((sum: number, item: any) => sum + item.finalPrice, 0), // eslint-disable-line @typescript-eslint/no-explicit-any
                          'VND'
                        )}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No order items found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
