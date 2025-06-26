import { useNavigate, useParams } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import { getAllVisaTypesRoute, getEditVisaTypeRoute } from '../../lib/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Edit,
  Globe,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  FileText,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

const ViewVisaTypePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();

  const canUpdate = hasPermission('visaTypes.update');

  const { data, error, isLoading, isError } = trpc.visaType.getOne.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(getAllVisaTypesRoute())}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Visa Type Details</h1>
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

  if (isError || !data?.visaType) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(getAllVisaTypesRoute())}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Visa Type Details</h1>
          </div>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error Loading Visa Type</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error?.message || 'Visa type not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const visaType = data.visaType;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(getAllVisaTypesRoute())}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Visa Type Details</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{visaType.name}</CardTitle>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{visaType.country.name}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Service Cost:</span>
                    <span className="font-mono font-medium">
                      ${visaType.serviceCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Entry Type:</span>
                    <Badge variant={visaType.isMultientry ? 'default' : 'secondary'}>
                      {visaType.isMultientry ? 'Multi-entry' : 'Single-entry'}
                    </Badge>
                  </div>
                </div>

                {visaType.isMultientry && visaType.multientryExtraCost && (
                  <div className="mt-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Multi-entry Extra Cost:</span>
                    <span className="font-mono font-medium">
                      ${visaType.multientryExtraCost.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Processing Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Processing Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Processing Mode:</span>
                    <Badge variant="outline">
                      {visaType.processingMode === 'fixed' ? 'Fixed' : 'Approximate'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Processing Time:</span>
                    <span className="font-medium">
                      {visaType.processingMode === 'fixed'
                        ? `${visaType.processingValueFixed} ${visaType.processingUnit}`
                        : `${visaType.processingValueMin}-${visaType.processingValueMax} ${visaType.processingUnit}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {visaType.submissionDayIncluded ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      Submission day {visaType.submissionDayIncluded ? 'included' : 'not included'}{' '}
                      in processing time
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions & Statistics Sidebar */}
        <div className="space-y-6">
          {canUpdate && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full justify-start"
                  onClick={() => navigate(getEditVisaTypeRoute({ id: visaType.id }))}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Visa Type
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Applications</span>
                </div>
                <span className="font-semibold">{visaType._count?.visaApplications || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Client Visas</span>
                </div>
                <span className="font-semibold">{visaType._count?.clientVisas || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Surcharges</span>
                </div>
                <span className="font-semibold">{visaType.surcharges?.length || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Surcharges */}
          {visaType.surcharges && visaType.surcharges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Citizenship Surcharges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {visaType.surcharges.map(surcharge => (
                    <div
                      key={surcharge.id}
                      className="flex justify-between items-center p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{surcharge.citizenship.name}</div>
                        {surcharge.note && (
                          <div className="text-sm text-muted-foreground">{surcharge.note}</div>
                        )}
                      </div>
                      <div className="font-mono font-semibold">
                        ${surcharge.surchargeAmount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewVisaTypePage;
