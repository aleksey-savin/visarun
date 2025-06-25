import { useNavigate, useParams } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import {
  getAllVisaCitizenshipSurchargesRoute,
  getEditVisaCitizenshipSurchargeRoute,
} from '../../lib/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { ArrowLeft, Edit, Trash2, DollarSign, FileText, Globe, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';

const ViewVisaCitizenshipSurchargePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // Permission checks
  const canUpdate = hasPermission('visaCitizenshipSurcharges.update');
  const canDelete = hasPermission('visaCitizenshipSurcharges.delete');

  const { data, error, isLoading, isError } = trpc.visaCitizenshipSurcharge.getOne.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const deleteVisaCitizenshipSurchargeMutation = trpc.visaCitizenshipSurcharge.delete.useMutation({
    onSuccess: () => {
      toast.success('Visa citizenship surcharge deleted successfully');
      navigate(getAllVisaCitizenshipSurchargesRoute());
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const handleDelete = () => {
    deleteVisaCitizenshipSurchargeMutation.mutate({ id: id! });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading visa citizenship surcharge...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error: {error?.message}</div>
        </div>
      </div>
    );
  }

  if (!data?.visaCitizenshipSurcharge) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Visa citizenship surcharge not found</div>
        </div>
      </div>
    );
  }

  const surcharge = data.visaCitizenshipSurcharge;

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(getAllVisaCitizenshipSurchargesRoute())}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Surcharges
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {canUpdate && (
            <Button
              variant="outline"
              onClick={() => navigate(getEditVisaCitizenshipSurchargeRoute({ id: surcharge.id }))}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Visa Citizenship Surcharge</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this visa citizenship surcharge for{' '}
                    {surcharge.citizenship.name} in {surcharge.country.name}? This action cannot be
                    undone.
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
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Surcharge Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Citizenship</label>
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  <span className="font-medium">{surcharge.citizenship.name}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Country</label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="font-medium">{surcharge.country.name}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Visa Type</label>
                <Badge variant="secondary" className="w-fit">
                  {surcharge.visaTypeId}
                </Badge>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Surcharge Amount
                </label>
                <div className="text-2xl font-bold text-green-600">
                  ${surcharge.surchargeAmount.toFixed(2)} USD
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Note</label>
              {surcharge.note ? (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{surcharge.note}</p>
                </div>
              ) : (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground italic">No additional notes</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Summary</label>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                <p className="text-sm">
                  Citizens of <span className="font-semibold">{surcharge.citizenship.name}</span>{' '}
                  applying for a <span className="font-semibold">{surcharge.visaTypeId}</span> visa
                  to <span className="font-semibold">{surcharge.country.name}</span> will be charged
                  an additional{' '}
                  <span className="font-semibold text-green-600">
                    ${surcharge.surchargeAmount.toFixed(2)} USD
                  </span>{' '}
                  surcharge.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Related Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Related Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Citizenship ID</label>
              <code className="text-xs bg-muted px-2 py-1 rounded">{surcharge.citizenshipId}</code>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Country ID</label>
              <code className="text-xs bg-muted px-2 py-1 rounded">{surcharge.countryId}</code>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Surcharge ID</label>
              <code className="text-xs bg-muted px-2 py-1 rounded">{surcharge.id}</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewVisaCitizenshipSurchargePage;
