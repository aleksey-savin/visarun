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
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(getAllVisaCitizenshipSurchargesRoute())}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Visa Citizenship Surcharge Details</h1>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="h-8 bg-muted animate-pulse rounded w-1/3"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-1/4 mt-2"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-4 bg-muted animate-pulse rounded"></div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <div className="h-6 bg-muted animate-pulse rounded w-32"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(getAllVisaCitizenshipSurchargesRoute())}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Visa Citizenship Surcharge Details</h1>
          </div>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error Loading Surcharge</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error?.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data?.visaCitizenshipSurcharge) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(getAllVisaCitizenshipSurchargesRoute())}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Visa Citizenship Surcharge Details</h1>
          </div>
        </div>
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-700">Surcharge Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-600">The visa citizenship surcharge could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const surcharge = data.visaCitizenshipSurcharge;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(getAllVisaCitizenshipSurchargesRoute())}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Visa Citizenship Surcharge Details</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
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
                    {surcharge.visaType.name}
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
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-md border border-blue-200/50 dark:border-blue-800/50">
                  <p className="text-sm">
                    Citizens of <span className="font-semibold">{surcharge.citizenship.name}</span>{' '}
                    applying for a <span className="font-semibold">{surcharge.visaType.name}</span>{' '}
                    visa to <span className="font-semibold">{surcharge.country.name}</span> will be
                    charged an additional{' '}
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

        {/* Actions Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canUpdate && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    navigate(getEditVisaCitizenshipSurchargeRoute({ id: surcharge.id }))
                  }
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Surcharge
                </Button>
              )}
              {canDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full justify-start">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Surcharge
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Visa Citizenship Surcharge</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this visa citizenship surcharge for{' '}
                        {surcharge.citizenship.name} in {surcharge.country.name}? This action cannot
                        be undone.
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ViewVisaCitizenshipSurchargePage;
