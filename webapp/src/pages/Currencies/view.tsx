import { useNavigate, useParams } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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

const ViewCurrencyPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data, error, isLoading, isError } = trpc.currency.getOne.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const deleteMutation = trpc.currency.delete.useMutation({
    onSuccess: () => {
      toast.success('Currency deleted successfully');
      navigate('/currencies');
    },
    onError: error => {
      toast.error(error.message || 'Failed to delete currency');
    },
  });

  const handleDelete = () => {
    if (!id) return;
    deleteMutation.mutate({ id });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !data?.currency) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <h3 className="font-medium text-lg mb-2">Error Loading Currency</h3>
        <p>{error?.message || 'Currency not found'}</p>
      </div>
    );
  }

  const currency = data.currency;

  return (
    <div className="grid gap-6 p-6 pb-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/currencies/edit/${currency.id}`)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Currency</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this currency? This action cannot be undone and
                  may affect related order payments and exchange rates.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" />
            {currency.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Currency ID</h3>
                <p className="font-mono text-sm bg-muted p-2 rounded">{currency.id}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Currency Name</h3>
                <p className="text-lg font-medium">{currency.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Usage Statistics</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Order Payments:</span>
                    <Badge variant="secondary">{currency._count.orderPayments}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Exchange Rates:</span>
                    <Badge variant="outline">{currency._count.exchangeRates}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {(currency._count.orderPayments > 0 || currency._count.exchangeRates > 0) && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Usage Warning</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  This currency is currently being used in{' '}
                  {currency._count.orderPayments > 0 && (
                    <>
                      <strong>{currency._count.orderPayments}</strong> order payment
                      {currency._count.orderPayments > 1 ? 's' : ''}
                    </>
                  )}
                  {currency._count.orderPayments > 0 &&
                    currency._count.exchangeRates > 0 &&
                    ' and '}
                  {currency._count.exchangeRates > 0 && (
                    <>
                      <strong>{currency._count.exchangeRates}</strong> exchange rate
                      {currency._count.exchangeRates > 1 ? 's' : ''}
                    </>
                  )}
                  . Deleting it may affect related data.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewCurrencyPage;
