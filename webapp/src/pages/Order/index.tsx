import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { FilterContainer, FilterFields, FilterField } from '@/components/Filters';
import { formatCurrency } from '@/utils/currency.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { AlertTriangle, Edit, Search, Trash2, X, ShoppingCart, Plus } from 'lucide-react';
import { getEditOrderRoute } from '@/lib/routes';
import { ClientSearchModal } from '@/components/Client/client-search-modal.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type OrderStatus =
  | 'draft'
  | 'personal_data_verification'
  | 'payment_pending'
  | 'paid'
  | 'completed'
  | 'cancelled';

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AllOrdersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: ordersData,
    isLoading,
    error,
    refetch,
  } = trpc.order.getAll.useQuery({
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    search: debouncedSearchTerm || undefined,
  });

  const orders = ordersData?.orders || [];

  const deleteOrderMutation = trpc.order.delete.useMutation({
    onSuccess: () => {
      toast.success('Order deleted successfully');
      refetch();
    },
    onError: error => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleDeleteOrder = (id: string) => {
    deleteOrderMutation.mutate({ id });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
  };

  const handleCreateOrder = () => {
    setIsClientSearchOpen(true);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <span>Error loading orders: {error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <CardTitle className="sticky top-0 z-10 border-b flex py-1.5 px-6 justify-between gap-2">
        <div className="flex gap-2 items-center">
          <ShoppingCart />
          <span className="font-semibold">Orders</span>
        </div>
        <Button size="sm" onClick={handleCreateOrder} className="relative">
          Create Order
          <Plus />
        </Button>
      </CardTitle>
      <div className="grid gap-6 p-6 pb-0">
        <FilterContainer onClearFilters={resetFilters}>
          <FilterFields>
            <FilterField label="Search Orders">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by user name, or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </FilterField>

            <FilterField label="Status">
              <Select
                value={statusFilter}
                onValueChange={value => setStatusFilter(value as OrderStatus | 'ALL')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
          </FilterFields>
        </FilterContainer>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Orders ({orders.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No orders found matching your criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order: any) => (
                      <TableRow key={order.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Link
                            to={getEditOrderRoute({ id: order.id })}
                            className="hover:underline font-medium"
                          >
                            {order.user ? (
                              <div>
                                <div className="font-medium">
                                  {order.user.firstName} {order.user.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {order.user.email}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No user</span>
                            )}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {order.totals ? formatCurrency(order.totals.finalPrice, 'VND') : 'N/A'}
                        </TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              statusColors[order.status as keyof typeof statusColors] ||
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {order.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(getEditOrderRoute({ id: order.id }))}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Order</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this order? This action cannot
                                    be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <ClientSearchModal isOpen={isClientSearchOpen} onOpenChange={setIsClientSearchOpen} />
      </div>
    </>
  );
}
