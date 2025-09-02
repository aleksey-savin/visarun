import { useParams, useNavigate } from 'react-router-dom';
import { type ViewVisaApplicationRouteParams, getAllVisaApplicationsRoute } from '../../lib/routes';
import { trpc } from '../../lib/trpcProvider';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Stamp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ViewVisaApplicationPage = () => {
  const { id } = useParams() as ViewVisaApplicationRouteParams;
  const navigate = useNavigate();

  // Query to get visa application details
  const { data, error, isLoading, isError } = trpc.visaApplication.getOne.useQuery({ id });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShortDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string, visaApplication?: any) => {
    switch (status) {
      case 'pending_submit':
        return {
          variant: 'secondary' as const,
          className: 'bg-blue-500 hover:bg-blue-500',
          text: 'Pending Submit',
          icon: Clock,
        };
      case 'awaiting_approval':
        return {
          variant: 'secondary' as const,
          className: visaApplication?.stampIsRecieved
            ? 'bg-green-500 hover:bg-green-500'
            : 'bg-yellow-500 hover:bg-yellow-500 text-black',
          text: visaApplication?.stampIsRecieved ? 'Stamp Received' : 'Awaiting Approval',
          icon: visaApplication?.stampIsRecieved ? Stamp : Clock,
        };
      case 'approved':
        return {
          variant: 'default' as const,
          className: 'bg-green-500 hover:bg-green-500',
          text: 'Approved',
          icon: CheckCircle,
        };
      case 'pending_refund':
        return {
          variant: 'secondary' as const,
          className: 'bg-orange-500 hover:bg-orange-500',
          text: 'Pending Refund',
          icon: Clock,
        };
      case 'refunded':
        return {
          variant: 'outline' as const,
          className: 'bg-gray-500 hover:bg-gray-500',
          text: 'Refunded',
          icon: CheckCircle,
        };
      case 'cancelled':
        return {
          variant: 'outline' as const,
          className: '',
          text: 'Cancelled',
          icon: XCircle,
        };
      case 'denied':
        return {
          variant: 'destructive' as const,
          className: 'bg-red-500 hover:bg-red-500',
          text: 'Denied',
          icon: XCircle,
        };
      default:
        return {
          variant: 'outline' as const,
          className: '',
          text: 'Unknown',
          icon: Clock,
        };
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-8 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Visa Application Details</h1>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-8 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Visa Application Details</h1>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading visa application: {error.message}</p>
            <Button variant="secondary" onClick={() => navigate(getAllVisaApplicationsRoute())}>
              Back to Applications
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.visaApplication) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-8 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Visa Application Details</h1>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Visa application not found</p>
            <Button variant="secondary" onClick={() => navigate(getAllVisaApplicationsRoute())}>
              Back to Applications
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { visaApplication } = data;
  const statusBadge = getStatusBadge(visaApplication.status, visaApplication);
  const StatusIcon = statusBadge.icon;

  const clientName =
    `${visaApplication.orderItem?.client?.firstName || ''} ${visaApplication.orderItem?.client?.lastName || ''}`.trim();

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => navigate(getAllVisaApplicationsRoute())}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Visa Application Details</h1>
            <p className="text-muted-foreground">Application for {clientName}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={statusBadge.variant} className={statusBadge.className}>
            <StatusIcon className="w-4 h-4 mr-1" />
            {statusBadge.text}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Application Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Application Code</label>
              <p className="text-lg font-mono">
                {visaApplication.applicationCode || 'Not assigned'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Country</label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{visaApplication.country?.name}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Visa Type</label>
                <div className="mt-1">
                  {visaApplication.visaType && (
                    <Badge variant="secondary" className="bg-blue-600 border-blue-600 text-white">
                      {visaApplication.visaType.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Multi-entry</label>
                <p className="mt-1">{visaApplication.isMultientry ? 'Yes' : 'No'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Submitted by Agent
                </label>
                <p className="mt-1">{visaApplication.submittedByAgent ? 'Yes' : 'No'}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Planned Entry Date
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(visaApplication.plannedCountryEntryDate)}</span>
              </div>
            </div>

            {visaApplication.stampIsRecieved && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Stamp Status</label>
                <div className="flex items-center gap-2 mt-1">
                  <Stamp className="h-4 w-4 text-green-600" />
                  <Badge
                    variant="secondary"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    Stamp Received
                  </Badge>
                </div>
              </div>
            )}

            {visaApplication.note && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Notes</label>
                <p className="mt-1 p-3 bg-muted rounded-lg">{visaApplication.note}</p>
              </div>
            )}

            {visaApplication.statusNote && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status Notes</label>
                <p className="mt-1 p-3 bg-muted rounded-lg">{visaApplication.statusNote}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Client Name</label>
              <p className="text-lg">{clientName}</p>
            </div>

            {visaApplication.orderItem?.client?.citizenship && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Citizenship</label>
                <p className="mt-1">{visaApplication.orderItem.client.citizenship.name}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">Order ID</label>
              <p className="font-mono">{visaApplication.orderItem?.order?.id}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Order Status</label>
              <Badge variant="secondary" className="mt-1">
                {visaApplication.orderItem?.order?.status}
              </Badge>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Order Created</label>
              <p className="mt-1">{formatShortDate(visaApplication.orderItem?.order?.createdAt)}</p>
            </div>

            {visaApplication.visaType && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Service Cost</label>
                <p className="text-lg font-semibold">${visaApplication.visaType.serviceCost}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Client Visas Count
              </label>
              <p className="mt-1">{visaApplication.clientVisas?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Order Created</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(visaApplication.orderItem?.order?.createdAt)}
                  </p>
                </div>
              </div>

              {visaApplication.clientVisas && visaApplication.clientVisas.length > 0 && (
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Latest Visa Issued</p>
                    <p className="text-sm text-muted-foreground">
                      Valid from {formatDate(visaApplication.clientVisas[0].validFrom)} to{' '}
                      {formatDate(visaApplication.clientVisas[0].validTo)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="secondary" onClick={() => navigate(getAllVisaApplicationsRoute())}>
          Back to Applications
        </Button>
        <Button onClick={() => navigate(`/visa-applications/edit/${id}`)}>Edit Application</Button>
      </div>
    </div>
  );
};

export default ViewVisaApplicationPage;
