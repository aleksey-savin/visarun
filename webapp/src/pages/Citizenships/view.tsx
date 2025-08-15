import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import { getAllCitizenshipsRoute, getEditCitizenshipRoute } from '../../lib/routes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Users,
  Edit,
  Star,
  DollarSign,
  Plus,
  Trash2,
  Globe,
  MapPin,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Plane,
  Ban,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currency.js';
import { Skeleton } from '@/components/ui/skeleton';

const ViewCitizenshipPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [visaFreeDialogOpen, setVisaFreeDialogOpen] = useState(false);
  const [blacklistDialogOpen, setBlacklistDialogOpen] = useState(false);
  const [surchargeDialogOpen, setSurchargeDialogOpen] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [stampDuration, setStampDuration] = useState(30);
  const [visaTypeId, setVisaTypeId] = useState('');
  const [surchargeAmount, setSurchargeAmount] = useState(0);
  const [surchargeNote, setSurchargeNote] = useState('');
  const [surchargeCountryId, setSurchargeCountryId] = useState('');

  const { data, error, isLoading, isError, refetch } = trpc.citizenship.getOne.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const { data: countriesData } = trpc.country.getAll.useQuery();

  const createVisaFreeMutation = trpc.visaFree.create.useMutation({
    onSuccess: () => {
      toast.success('Visa-free access added successfully');
      refetch();
      setVisaFreeDialogOpen(false);
      setSelectedCountryId('');
      setStampDuration(30);
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const deleteVisaFreeMutation = trpc.visaFree.delete.useMutation({
    onSuccess: () => {
      toast.success('Visa-free access removed successfully');
      refetch();
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const createBlacklistMutation = trpc.blacklisted.create.useMutation({
    onSuccess: () => {
      toast.success('Country blacklisted successfully');
      refetch();
      setBlacklistDialogOpen(false);
      setSelectedCountryId('');
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const deleteBlacklistMutation = trpc.blacklisted.delete.useMutation({
    onSuccess: () => {
      toast.success('Country removed from blacklist successfully');
      refetch();
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const createSurchargeMutation = trpc.visaCitizenshipSurcharge.create.useMutation({
    onSuccess: () => {
      toast.success('Citizenship surcharge added successfully');
      refetch();
      setSurchargeDialogOpen(false);
      setVisaTypeId('');
      setSurchargeAmount(0);
      setSurchargeNote('');
      setSurchargeCountryId('');
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const deleteSurchargeMutation = trpc.visaCitizenshipSurcharge.delete.useMutation({
    onSuccess: () => {
      toast.success('Citizenship surcharge removed successfully');
      refetch();
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const handleAddVisaFree = () => {
    if (!selectedCountryId || stampDuration <= 0) {
      toast.error('Please select a country and enter valid duration');
      return;
    }
    createVisaFreeMutation.mutate({
      citizenshipId: id!,
      countryId: selectedCountryId,
      stampDuration,
    });
  };

  const handleAddBlacklist = () => {
    if (!selectedCountryId) {
      toast.error('Please select a country');
      return;
    }
    createBlacklistMutation.mutate({
      citizenshipId: id!,
      countryId: selectedCountryId,
    });
  };

  const handleAddSurcharge = () => {
    if (!surchargeCountryId) {
      toast.error('Please select a country');
      return;
    }
    if (!visaTypeId || surchargeAmount <= 0) {
      toast.error('Please enter visa type ID and valid surcharge amount');
      return;
    }
    createSurchargeMutation.mutate({
      citizenshipId: id!,
      countryId: surchargeCountryId,
      visaTypeIds: [visaTypeId],
      surchargeAmount,
      note: surchargeNote || undefined,
    });
  };

  const getAvailableCountriesForVisaFree = () => {
    if (!countriesData?.countries || !data?.citizenship) return [];
    const visaFreeCountryIds = data.citizenship.visaFree.map(vf => vf.countryId);
    const blacklistedCountryIds = data.citizenship.blacklisted.map(bl => bl.countryId);
    return countriesData.countries.filter(
      country =>
        !visaFreeCountryIds.includes(country.id) && !blacklistedCountryIds.includes(country.id)
    );
  };

  const getAvailableCountriesForBlacklist = () => {
    if (!countriesData?.countries || !data?.citizenship) return [];
    const visaFreeCountryIds = data.citizenship.visaFree.map(vf => vf.countryId);
    const blacklistedCountryIds = data.citizenship.blacklisted.map(bl => bl.countryId);
    return countriesData.countries.filter(
      country =>
        !visaFreeCountryIds.includes(country.id) && !blacklistedCountryIds.includes(country.id)
    );
  };

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
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
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
  if (isError || !data?.citizenship) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate(getAllCitizenshipsRoute())}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Citizenship Details</h1>
            <p className="text-muted-foreground">View and manage citizenship information</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error?.message || 'Citizenship not found'}</AlertDescription>
        </Alert>

        <div className="mt-6">
          <Button variant="outline" onClick={() => navigate(getAllCitizenshipsRoute())}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Citizenships
          </Button>
        </div>
      </div>
    );
  }

  const { citizenship } = data;

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" onClick={() => navigate(getAllCitizenshipsRoute())}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-4xl">{citizenship.emoji}</div>
            <h1 className="text-3xl font-bold tracking-tight">{citizenship.name}</h1>
            <Badge variant="secondary" className="font-mono">
              {citizenship.abbreviation}
            </Badge>
            {citizenship.favourite && (
              <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-200">
                <Star className="h-3 w-3 fill-current" />
                Favourite
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">Manage visa requirements and travel access</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-fit">
          <TabsTrigger value="overview" className="gap-2">
            <Globe className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="access" className="gap-2">
            <Plane className="h-4 w-4" />
            Travel Access
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
                    <Users className="h-5 w-5" />
                    Citizenship Information
                  </CardTitle>
                  <CardDescription>Basic details and travel capabilities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{citizenship.emoji}</span>
                        <span className="text-lg font-semibold">{citizenship.name}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Abbreviation
                      </label>
                      <Badge variant="outline" className="w-fit font-mono text-lg">
                        {citizenship.abbreviation}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="flex items-center gap-2">
                        {citizenship.favourite ? (
                          <>
                            <Star className="h-4 w-4 text-yellow-600 fill-current" />
                            <span className="text-yellow-600 font-medium">Favourite</span>
                          </>
                        ) : (
                          <>
                            <Globe className="h-4 w-4 text-gray-600" />
                            <span className="text-gray-600 font-medium">Standard</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Travel Access Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="h-5 w-5" />
                    Travel Access Summary
                  </CardTitle>
                  <CardDescription>Overview of visa-free access and restrictions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-900 dark:text-green-100">
                          Visa-Free Access
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-green-600">
                        {citizenship.visaFree?.length || 0}
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-200">countries</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Ban className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-900 dark:text-red-100">
                          Blacklisted
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-red-600">
                        {citizenship.blacklisted?.length || 0}
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-200">countries</p>
                    </div>
                    <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-amber-600" />
                        <span className="font-semibold text-amber-900 dark:text-amber-100">
                          Surcharges
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-amber-600">
                        {citizenship.surcharges?.length || 0}
                      </div>
                      <p className="text-sm text-amber-700 dark:text-amber-200">active</p>
                    </div>
                  </div>

                  {/* Travel Freedom Score */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Travel Freedom Score</span>
                      <span className="text-sm text-muted-foreground">
                        {citizenship.visaFree?.length || 0} /{' '}
                        {countriesData?.countries?.length || 0}
                      </span>
                    </div>
                    <Progress
                      value={
                        countriesData?.countries?.length
                          ? ((citizenship.visaFree?.length || 0) / countriesData.countries.length) *
                            100
                          : 0
                      }
                      className="h-3"
                    />
                    <p className="text-xs text-muted-foreground">
                      Percentage of countries with visa-free access
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="default"
                    className="w-full justify-start"
                    onClick={() => navigate(getEditCitizenshipRoute({ id: citizenship.id }))}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Citizenship
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setSelectedTab('access')}
                  >
                    <Plane className="h-4 w-4 mr-2" />
                    Manage Travel Access
                  </Button>
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
                    <span className="text-sm text-muted-foreground">Visa-Free</span>
                    <Badge variant="default">{citizenship.visaFree?.length || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Blacklisted</span>
                    <Badge variant="destructive">{citizenship.blacklisted?.length || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Surcharges</span>
                    <Badge variant="secondary">{citizenship.surcharges?.length || 0}</Badge>
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
                      {citizenship.id}
                    </code>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Priority</span>
                    <div className="flex items-center gap-2">
                      {citizenship.favourite ? (
                        <Star className="h-3 w-3 text-yellow-600 fill-current" />
                      ) : (
                        <Globe className="h-3 w-3" />
                      )}
                      <span className="text-sm font-medium">
                        {citizenship.favourite ? 'Favourite' : 'Standard'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="access" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visa-Free Access */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Visa-Free Access
                    </CardTitle>
                    <CardDescription>Countries allowing visa-free entry</CardDescription>
                  </div>
                  <Dialog open={visaFreeDialogOpen} onOpenChange={setVisaFreeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Visa-Free Access</DialogTitle>
                        <DialogDescription>
                          Grant visa-free access to a new country for this citizenship.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Select value={selectedCountryId} onValueChange={setSelectedCountryId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a country" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableCountriesForVisaFree().map(country => (
                                <SelectItem key={country.id} value={country.id}>
                                  {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="duration">Stamp Duration (days)</Label>
                          <Input
                            id="duration"
                            type="number"
                            value={stampDuration}
                            onChange={e => setStampDuration(parseInt(e.target.value) || 0)}
                            min={1}
                            max={365}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setVisaFreeDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddVisaFree}>Add Access</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {citizenship.visaFree?.length ? (
                    citizenship.visaFree.map(visaFree => (
                      <div
                        key={`${visaFree.countryId}-${visaFree.stampDuration}`}
                        className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
                      >
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {visaFree.country.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {visaFree.stampDuration} days
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            deleteVisaFreeMutation.mutate({
                              citizenshipId: id!,
                              countryId: visaFree.countryId,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No visa-free access granted</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Blacklisted Countries */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Ban className="h-5 w-5 text-red-600" />
                      Blacklisted Countries
                    </CardTitle>
                    <CardDescription>Countries with travel restrictions</CardDescription>
                  </div>
                  <Dialog open={blacklistDialogOpen} onOpenChange={setBlacklistDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Blacklisted Country</DialogTitle>
                        <DialogDescription>
                          Add a country to the blacklist for this citizenship.
                        </DialogDescription>
                      </DialogHeader>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Select value={selectedCountryId} onValueChange={setSelectedCountryId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a country" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableCountriesForBlacklist().map(country => (
                              <SelectItem key={country.id} value={country.id}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setBlacklistDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleAddBlacklist}>
                          Add to Blacklist
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {citizenship.blacklisted?.length ? (
                    citizenship.blacklisted.map(blacklisted => (
                      <div
                        key={blacklisted.country?.id}
                        className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800"
                      >
                        <div className="font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {blacklisted.country.name}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            deleteBlacklistMutation.mutate({
                              citizenshipId: id!,
                              countryId: blacklisted.countryId,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Ban className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No countries blacklisted</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Citizenship Surcharges */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-amber-600" />
                      Surcharges
                    </CardTitle>
                    <CardDescription>Additional fees for visa types</CardDescription>
                  </div>
                  <Dialog open={surchargeDialogOpen} onOpenChange={setSurchargeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Citizenship Surcharge</DialogTitle>
                        <DialogDescription>
                          Add an additional fee for specific visa types for this citizenship.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="surcharge-country">Country</Label>
                          <Select value={surchargeCountryId} onValueChange={setSurchargeCountryId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a country" />
                            </SelectTrigger>
                            <SelectContent>
                              {countriesData?.countries.map(country => (
                                <SelectItem key={country.id} value={country.id}>
                                  {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="visa-type">Visa Type ID</Label>
                          <Input
                            id="visa-type"
                            value={visaTypeId}
                            onChange={e => setVisaTypeId(e.target.value)}
                            placeholder="Enter visa type ID"
                          />
                        </div>
                        <div>
                          <Label htmlFor="amount">Surcharge Amount (VND)</Label>
                          <Input
                            id="amount"
                            type="number"
                            min="0"
                            step="1"
                            value={surchargeAmount}
                            onChange={e => setSurchargeAmount(parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="note">Note (optional)</Label>
                          <Textarea
                            id="note"
                            value={surchargeNote}
                            onChange={e => setSurchargeNote(e.target.value)}
                            placeholder="Optional note or description"
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSurchargeDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddSurcharge}>Add Surcharge</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {citizenship.surcharges?.length ? (
                    citizenship.surcharges.map(surcharge => (
                      <div
                        key={surcharge.id}
                        className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="h-4 w-4" />
                            <span className="font-medium">{surcharge.country.name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {surcharge.visaTypes.map(vt => vt.visaType.name).join(', ')}
                          </div>
                          {surcharge.note && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {surcharge.note}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {formatCurrency(surcharge.surchargeAmount, 'VND')}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteSurchargeMutation.mutate({ id: surcharge.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No surcharges configured</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visa-Free Access</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {citizenship.visaFree?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">countries accessible</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Restrictions</CardTitle>
                <Ban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {citizenship.blacklisted?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">blacklisted countries</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Surcharges</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {citizenship.surcharges?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">additional fees</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Freedom Score</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {countriesData?.countries?.length
                    ? Math.round(
                        ((citizenship.visaFree?.length || 0) / countriesData.countries.length) * 100
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">travel freedom</p>
              </CardContent>
            </Card>
          </div>

          {/* Travel Access Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Travel Access Breakdown</CardTitle>
              <CardDescription>Detailed analysis of travel capabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Visa-Free Access</span>
                    <span className="text-sm text-muted-foreground">
                      {citizenship.visaFree?.length || 0} countries
                    </span>
                  </div>
                  <Progress
                    value={
                      countriesData?.countries?.length
                        ? ((citizenship.visaFree?.length || 0) / countriesData.countries.length) *
                          100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Restricted Access</span>
                    <span className="text-sm text-muted-foreground">
                      {citizenship.blacklisted?.length || 0} countries
                    </span>
                  </div>
                  <Progress
                    value={
                      countriesData?.countries?.length
                        ? ((citizenship.blacklisted?.length || 0) /
                            countriesData.countries.length) *
                          100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
              </div>

              {/* Surcharge Analysis */}
              {citizenship.surcharges && citizenship.surcharges.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Surcharge Analysis</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Total Surcharges</span>
                      <div className="text-lg font-semibold">
                        {formatCurrency(
                          citizenship.surcharges.reduce(
                            (sum, surcharge) => sum + surcharge.surchargeAmount,
                            0
                          ),
                          'VND'
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Average Surcharge</span>
                      <div className="text-lg font-semibold">
                        {formatCurrency(
                          citizenship.surcharges.length > 0
                            ? citizenship.surcharges.reduce(
                                (sum, surcharge) => sum + surcharge.surchargeAmount,
                                0
                              ) / citizenship.surcharges.length
                            : 0,
                          'VND'
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ViewCitizenshipPage;
