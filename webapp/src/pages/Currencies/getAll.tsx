import { useState } from 'react';
import { trpc } from '../../lib/trpcProvider';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Coins, Search, Eye, Edit, Trash2, Plus } from 'lucide-react';
import { FilterContainer, FilterFields, FilterField } from '@/components/Filters';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Define a type for the currency based on your Prisma schema
type Currency = {
  id: string;
  name: string;
  _count: {
    orderPayments: number;
    exchangeRates: number;
  };
};

const AllCurrenciesPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteCurrencyId, setDeleteCurrencyId] = useState<string | null>(null);

  const { data, error, isLoading, isError, refetch } = trpc.currency.getAll.useQuery({
    search: searchTerm,
  });

  const deleteMutation = trpc.currency.delete.useMutation({
    onSuccess: () => {
      refetch();
      setDeleteCurrencyId(null);
    },
    onError: error => {
      console.error('Failed to delete currency:', error);
    },
  });

  const handleDelete = (currencyId: string) => {
    deleteMutation.mutate({ id: currencyId });
  };

  const currencies = data?.currencies || [];

  const resetFilters = () => {
    setSearchTerm('');
  };

  return (
    <div className="grid gap-6 p-6 pb-0">
      <FilterContainer onClearFilters={resetFilters}>
        <FilterFields>
          <FilterField label="Search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </FilterField>
        </FilterFields>
      </FilterContainer>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Currencies ({currencies.length})
              {data?.total && currencies.length !== data.total && (
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  of {data.total} total
                </span>
              )}
            </CardTitle>
            <Button onClick={() => navigate('/currencies/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Currency
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {isError && (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <h3 className="font-medium text-lg mb-2">Error Loading Currencies</h3>
              <p>{error.message}</p>
            </div>
          )}

          {currencies.length === 0 && !isLoading && !isError ? (
            <div className="text-center py-8 text-muted-foreground">
              No currencies found. Create one to get started.
            </div>
          ) : (
            <>
              {/* Table view (hidden on mobile) */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Currency Name</TableHead>
                        <TableHead className="w-[120px]">Order Payments</TableHead>
                        <TableHead className="w-[120px]">Exchange Rates</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currencies.map((currency: Currency) => (
                        <TableRow key={currency.id} className="hover:bg-muted/50">
                          <TableCell>
                            <Link
                              to={`/currencies/view/${currency.id}`}
                              className="flex items-center space-x-2 font-medium hover:underline"
                            >
                              <Coins className="h-4 w-4 text-primary" />
                              <span>{currency.name}</span>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{currency._count.orderPayments}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{currency._count.exchangeRates}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/currencies/view/${currency.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/currencies/edit/${currency.id}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteCurrencyId(currency.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Card view (visible only on mobile) */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {currencies.map((currency: Currency) => (
                  <Card key={currency.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="px-4 py-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Coins className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{currency.name}</h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/currencies/view/${currency.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/currencies/edit/${currency.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteCurrencyId(currency.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between items-end">
                        <div className="text-sm text-muted-foreground">
                          <div>Order Payments: {currency._count.orderPayments}</div>
                          <div>Exchange Rates: {currency._count.exchangeRates}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCurrencyId} onOpenChange={() => setDeleteCurrencyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Currency</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this currency? This action cannot be undone and may
              affect related order payments and exchange rates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCurrencyId && handleDelete(deleteCurrencyId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AllCurrenciesPage;
