import { useNavigate, useParams } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import { getAllVisaTypesRoute, getEditVisaTypeRoute } from '../../lib/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
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
  Settings,
  MapPin,
  CreditCard,
  TrendingUp,
  BarChart3,
  AlertCircle,
  Shield,
  Banknote,
  Timer,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { RequirementsList } from '@/components/Requirements';
import { useState } from 'react';
import { formatCurrency } from '@/utils/currency.js';
import { Skeleton } from '@/components/ui/skeleton';

const ViewVisaTypePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const [selectedTab, setSelectedTab] = useState('overview');

  const canUpdate = hasPermission('visaTypes.update');
  const canManageRequirements = hasPermission('requirements.create');

  const { data, error, isLoading, isError } = trpc.visaType.getOne.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  // Loading State
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-16" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (isError || !data?.visaType) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate(getAllVisaTypesRoute())}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Visa Type Details</h1>
            <p className="text-muted-foreground">View and manage visa type information</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error?.message || 'Visa type not found'}</AlertDescription>
        </Alert>

        <div className="mt-6">
          <Button variant="outline" onClick={() => navigate(getAllVisaTypesRoute())}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Visa Types
          </Button>
        </div>
      </div>
    );
  }

  const visaType = data.visaType;

  const getProcessingTimeText = () => {
    if (visaType.processingMode === 'fixed') {
      return `${visaType.processingValueFixed} ${visaType.processingUnit}`;
    } else {
      return `${visaType.processingValueMin}-${visaType.processingValueMax} ${visaType.processingUnit}`;
    }
  };

  const getEntryTypeBadge = () => {
    return visaType.isMultientry ? (
      <Badge variant="default" className="gap-1">
        <RefreshCw className="h-3 w-3" />
        Multi-entry
      </Badge>
    ) : (
      <Badge variant="secondary" className="gap-1">
        <ArrowLeft className="h-3 w-3" />
        Single-entry
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(getAllVisaTypesRoute())}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{visaType.name}</h1>
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{visaType.country.name}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getEntryTypeBadge()}
          {visaType.isMultientry && visaType.multientryExtraCost && (
            <Badge variant="outline" className="gap-1">
              <CreditCard className="h-3 w-3" />+
              {formatCurrency(visaType.multientryExtraCost, 'USD')}
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-fit">
          <TabsTrigger value="overview" className="gap-2">
            <FileText className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="requirements" className="gap-2">
            <Settings className="h-4 w-4" />
            Requirements
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>Core details and pricing for this visa type</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Service Cost
                      </label>
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-green-600" />
                        <span className="text-xl font-bold text-green-600">
                          {formatCurrency(visaType.serviceCost, 'VND')}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Entry Type
                      </label>
                      <div className="flex items-center gap-2">
                        {visaType.isMultientry ? (
                          <>
                            <RefreshCw className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-600">Multi-entry</span>
                          </>
                        ) : (
                          <>
                            <ArrowLeft className="h-4 w-4 text-gray-600" />
                            <span className="font-medium text-gray-600">Single-entry</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Country</label>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">{visaType.country.name}</span>
                      </div>
                    </div>
                  </div>

                  {visaType.isMultientry && visaType.multientryExtraCost && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900 dark:text-blue-100">
                          Multi-entry Surcharge
                        </span>
                      </div>
                      <p className="text-blue-700 dark:text-blue-200 text-sm">
                        Additional cost for multi-entry visa:{' '}
                        {formatCurrency(visaType.multientryExtraCost, 'USD')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Processing Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    Processing Information
                  </CardTitle>
                  <CardDescription>
                    Timeline and processing details for this visa type
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Processing Mode
                        </label>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-purple-600" />
                          <Badge
                            variant={visaType.processingMode === 'fixed' ? 'default' : 'secondary'}
                          >
                            {visaType.processingMode === 'fixed'
                              ? 'Fixed Duration'
                              : 'Approximate Range'}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Processing Time
                        </label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-indigo-600" />
                          <span className="font-semibold text-lg">{getProcessingTimeText()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Submission Day
                        </label>
                        <div className="flex items-center gap-2">
                          {visaType.submissionDayIncluded ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-green-600 font-medium">
                                Included in processing time
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span className="text-red-600 font-medium">
                                Not included in processing time
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Processing Timeline Visualization */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Processing Timeline
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span>Expected completion</span>
                        <span className="font-medium">{getProcessingTimeText()}</span>
                      </div>
                      <Progress value={75} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        Timeline is {visaType.processingMode === 'fixed' ? 'fixed' : 'approximate'}{' '}
                        and
                        {visaType.submissionDayIncluded ? ' includes' : ' excludes'} submission day
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Citizenship Surcharges */}
              {visaType.surcharges && visaType.surcharges.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Citizenship Surcharges
                    </CardTitle>
                    <CardDescription>Additional fees based on citizenship</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {visaType.surcharges.map(surcharge => (
                        <div
                          key={surcharge.id}
                          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border hover:bg-muted/70 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="font-medium flex items-center gap-2">
                              <Shield className="h-4 w-4 text-blue-600" />
                              {surcharge.surcharge.citizenship.name}
                            </div>
                            {surcharge.surcharge.note && (
                              <p className="text-sm text-muted-foreground">
                                {surcharge.surcharge.note}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="font-mono text-lg">
                            +{formatCurrency(surcharge.surcharge.surchargeAmount, 'USD')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {canUpdate && (
                    <Button
                      className="w-full justify-start"
                      onClick={() => navigate(getEditVisaTypeRoute({ id: visaType.id }))}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Visa Type
                    </Button>
                  )}
                  {canManageRequirements && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setSelectedTab('requirements')}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Requirements
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setSelectedTab('analytics')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Applications</span>
                    </div>
                    <Badge variant="secondary">{visaType._count?.visaApplications || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Client Visas</span>
                    </div>
                    <Badge variant="secondary">{visaType._count?.clientVisas || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">Surcharges</span>
                    </div>
                    <Badge variant="secondary">{visaType.surcharges?.length || 0}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Key Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">ID</span>
                    <code className="block text-xs bg-muted p-2 rounded font-mono">
                      {visaType.id}
                    </code>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Country</span>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span className="text-sm font-medium">{visaType.country.name}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Processing</span>
                    <div className="flex items-center gap-2">
                      <Timer className="h-3 w-3" />
                      <span className="text-sm font-medium">{getProcessingTimeText()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Requirements</h2>
              <p className="text-muted-foreground">
                Manage requirements for {visaType.name} in {visaType.country.name}
              </p>
            </div>
          </div>
          <RequirementsList visaTypeId={visaType.id} compact={false} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{visaType._count?.visaApplications || 0}</div>
                <p className="text-xs text-muted-foreground">Applications submitted</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Visas</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{visaType._count?.clientVisas || 0}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    (visaType._count?.visaApplications || 0) * visaType.serviceCost,
                    'VND'
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Estimated total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Surcharges</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{visaType.surcharges?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Citizenship surcharges</p>
              </CardContent>
            </Card>
          </div>

          {/* Processing Time Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Processing Information</CardTitle>
              <CardDescription>Current processing timeline and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Processing Mode</span>
                    <Badge variant={visaType.processingMode === 'fixed' ? 'default' : 'secondary'}>
                      {visaType.processingMode === 'fixed' ? 'Fixed' : 'Range'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Duration</span>
                    <span className="font-mono">{getProcessingTimeText()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Submission Day</span>
                    {visaType.submissionDayIncluded ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Included
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Excluded
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Service Cost</span>
                    <span className="font-mono font-bold text-green-600">
                      {formatCurrency(visaType.serviceCost, 'VND')}
                    </span>
                  </div>
                  {visaType.isMultientry && visaType.multientryExtraCost && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Multi-entry Extra</span>
                      <span className="font-mono font-bold text-blue-600">
                        +{formatCurrency(visaType.multientryExtraCost, 'USD')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ViewVisaTypePage;
