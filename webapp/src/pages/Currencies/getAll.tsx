import { useState } from 'react';
import { trpc } from '../../lib/trpcProvider';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Coins, Search, Eye, Edit, Trash2 } from 'lucide-react';
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
          <div className="hidden lg:block">
            <div className="overflow-x-auto rounded-md border border-muted">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted hover:bg-gray-800/50">
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

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {currencies.map((currency: Currency) => (
              <Card key={currency.id} className="border border-muted">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Link to={`/currencies/view/${currency.id}`} className="hover:underline flex-1">
                      <CardTitle className="text-base">
                        <div className="flex items-center space-x-2">
                          <Coins className="h-4 w-4 text-primary" />
                          <span className="font-medium text-foreground">{currency.name}</span>
                        </div>
                      </CardTitle>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Order Payments:</span>
                      <Badge variant="secondary">{currency._count.orderPayments}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Exchange Rates:</span>
                      <Badge variant="secondary">{currency._count.exchangeRates}</Badge>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/currencies/view/${currency.id}`)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/currencies/edit/${currency.id}`)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteCurrencyId(currency.id)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

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
