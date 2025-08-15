import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Switch } from '@/components/ui/switch';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  ArrowLeft,
  Edit,
  Globe,
  Plus,
  DollarSign,
  MapPin,
  Trash2,
  Save,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  Plane,
  Ban,
  BarChart3,
  FileText,
  Star,
} from 'lucide-react';

import { trpc } from '@/lib/trpcProvider';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { getAllCountriesRoute, getEditCountryRoute } from '@/lib/routes';

import { Skeleton } from '@/components/ui/skeleton';

const ViewCountryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Permission checks
  const canCreateCities = hasPermission('cities.create');
  const canUpdateCities = hasPermission('cities.update');
  const canDeleteCities = hasPermission('cities.delete');

  // Visa Citizenship Surcharge permissions
  const canCreateSurcharges = hasPermission('visaCitizenshipSurcharges.create');
  const canDeleteSurcharges = hasPermission('visaCitizenshipSurcharges.delete');

  const [visaFreeDialogOpen, setVisaFreeDialogOpen] = useState(false);
  const [blacklistDialogOpen, setBlacklistDialogOpen] = useState(false);
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [surchargeDialogOpen, setSurchargeDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<{
    id: string;
    name: string;
    isActive: boolean;
  } | null>(null);
  const [selectedCitizenshipId, setSelectedCitizenshipId] = useState('');
  const [stampDuration, setStampDuration] = useState(30);
  const [cityName, setCityName] = useState('');
  const [cityIsActive, setCityIsActive] = useState(true);
  const [surchargeVisaTypeIds, setSurchargeVisaTypeIds] = useState<string[]>([]);
  const [surchargeAmount, setSurchargeAmount] = useState<number>(0);
  const [surchargeNote, setSurchargeNote] = useState('');

  const { data, error, isLoading, isError, refetch } = trpc.country.getOne.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const { data: citizenshipsData } = trpc.citizenship.getAll.useQuery({});

  const createVisaFreeMutation = trpc.visaFree.create.useMutation({
    onSuccess: () => {
      toast.success('Visa-free access added successfully');
      refetch();
      setVisaFreeDialogOpen(false);
      setSelectedCitizenshipId('');
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
      toast.success('Citizenship blacklisted successfully');
      refetch();
      setBlacklistDialogOpen(false);
      setSelectedCitizenshipId('');
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const deleteBlacklistMutation = trpc.blacklisted.delete.useMutation({
    onSuccess: () => {
      toast.success('Citizenship removed from blacklist successfully');
      refetch();
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const createCityMutation = trpc.city.create.useMutation({
    onSuccess: () => {
      toast.success('City added successfully');
      refetch();
      setCityDialogOpen(false);
      setCityName('');
      setCityIsActive(true);
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const updateCityMutation = trpc.city.edit.useMutation({
    onSuccess: () => {
      toast.success('City updated successfully');
      refetch();
      setEditingCity(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteCityMutation = trpc.city.delete.useMutation({
    onSuccess: () => {
      toast.success('City deleted successfully');
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
      setSurchargeVisaTypeIds([]);
      setSurchargeAmount(0);
      setSurchargeNote('');
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
    if (!selectedCitizenshipId || stampDuration <= 0) {
      toast.error('Please select a citizenship and enter valid duration');
      return;
    }
    createVisaFreeMutation.mutate({
      citizenshipId: selectedCitizenshipId,
      countryId: id!,
      stampDuration,
    });
  };

  const handleAddBlacklist = () => {
    if (!selectedCitizenshipId) {
      toast.error('Please select a citizenship');
      return;
    }
    createBlacklistMutation.mutate({
      citizenshipId: selectedCitizenshipId,
      countryId: id!,
    });
  };

  const handleAddCity = () => {
    if (!cityName.trim()) {
      toast.error('Please enter a city name');
      return;
    }
    createCityMutation.mutate({
      countryId: id!,
      name: cityName.trim(),
      isActive: cityIsActive,
    });
  };

  const handleUpdateCity = () => {
    if (!editingCity) return;
    updateCityMutation.mutate({
      id: editingCity.id,
      name: editingCity.name,
      isActive: editingCity.isActive,
      countryId: id!,
    });
  };

  const handleAddSurcharge = () => {
    if (!selectedCitizenshipId || surchargeVisaTypeIds.length === 0 || surchargeAmount <= 0) {
      toast.error('Please fill all required fields');
      return;
    }
    createSurchargeMutation.mutate({
      citizenshipId: selectedCitizenshipId,
      countryId: id!,
      visaTypeIds: surchargeVisaTypeIds,
      surchargeAmount,
      note: surchargeNote || undefined,
    });
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
          {[1, 2, 3, 4].map(i => (
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
  if (isError || !data?.country) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate(getAllCountriesRoute())}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Country Details</h1>
            <p className="text-muted-foreground">View and manage country information</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error?.message || 'Country not found'}</AlertDescription>
        </Alert>

        <div className="mt-6">
          <Button variant="outline" onClick={() => navigate(getAllCountriesRoute())}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Countries
          </Button>
        </div>
      </div>
    );
  }

  const { country } = data;

  const getAvailableCitizenshipsForVisaFree = () => {
    if (!citizenshipsData?.citizenships || !country) return [];
    const visaFreeCitizenshipIds = country.visaFree.map(vf => vf.citizenshipId);
    const blacklistedCitizenshipIds = country.blacklisted.map(bl => bl.citizenshipId);
    return citizenshipsData.citizenships.filter(
      citizenship =>
        !visaFreeCitizenshipIds.includes(citizenship.id) &&
        !blacklistedCitizenshipIds.includes(citizenship.id)
    );
  };

  const getAvailableCitizenshipsForBlacklist = () => {
    if (!citizenshipsData?.citizenships || !country) return [];
    const visaFreeCitizenshipIds = country.visaFree.map(vf => vf.citizenshipId);
    const blacklistedCitizenshipIds = country.blacklisted.map(bl => bl.citizenshipId);
    return citizenshipsData.citizenships.filter(
      citizenship =>
        !visaFreeCitizenshipIds.includes(citizenship.id) &&
        !blacklistedCitizenshipIds.includes(citizenship.id)
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" onClick={() => navigate(getAllCountriesRoute())}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{country.name}</h1>
          </div>
          <p className="text-muted-foreground">Manage country settings and visa requirements</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-fit">
          <TabsTrigger value="overview" className="gap-2">
            <Globe className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="access" className="gap-2">
            <Plane className="h-4 w-4" />
            Visa Access
          </TabsTrigger>
          <TabsTrigger value="cities" className="gap-2">
            <Building2 className="h-4 w-4" />
            Cities
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
              {/* Country Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Country Information
                  </CardTitle>
                  <CardDescription>Basic details and configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Name</label>
                      <p className="text-lg font-semibold">{country.name}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Abbreviation
                      </label>
                      <Badge variant="outline" className="w-fit font-mono text-lg">
                        {country.name?.substring(0, 3).toUpperCase() || 'N/A'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="flex items-center gap-2">
                        {country.favourite ? (
                          <>
                            <Star className="h-4 w-4 text-yellow-600 fill-current" />
                            <span className="text-yellow-600 font-medium">Featured</span>
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

              {/* Statistics Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Statistics Summary
                  </CardTitle>
                  <CardDescription>Overview of visa access and country data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-900 dark:text-green-100">
                          Visa-Free Access
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-green-600">
                        {country.visaFree?.length || 0}
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-200">citizenships</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Ban className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-900 dark:text-red-100">
                          Blacklisted
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-red-600">
                        {country.blacklisted?.length || 0}
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-200">citizenships</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-900 dark:text-blue-100">
                          Cities
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-blue-600">
                        {country.cities?.length || 0}
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-200">registered</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-purple-900 dark:text-purple-100">
                          Visa Types
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-purple-600">0</div>
                      <p className="text-sm text-purple-700 dark:text-purple-200">available</p>
                    </div>
                    <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-amber-600" />
                        <span className="font-semibold text-amber-900 dark:text-amber-100">
                          Surcharges
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-amber-600">
                        {country.surcharges?.length || 0}
                      </div>
                      <p className="text-sm text-amber-700 dark:text-amber-200">active</p>
                    </div>
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
                    onClick={() => navigate(getEditCountryRoute({ id: country.id }))}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Country
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setSelectedTab('access')}
                  >
                    <Plane className="h-4 w-4 mr-2" />
                    Manage Visa Access
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setSelectedTab('cities')}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Manage Cities
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Country ID</span>
                    <code className="block text-xs bg-muted p-2 rounded font-mono">
                      {country.id}
                    </code>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <div className="flex items-center gap-2">
                      <Globe className="h-3 w-3" />
                      <span className="text-sm font-medium">Active</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="access" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visa-Free Access */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Visa-Free Access
                    </CardTitle>
                    <CardDescription>Citizenships with visa-free entry</CardDescription>
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
                          Grant visa-free access to a citizenship for this country.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="citizenship">Citizenship</Label>
                          <Select
                            value={selectedCitizenshipId}
                            onValueChange={setSelectedCitizenshipId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a citizenship" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableCitizenshipsForVisaFree().map(citizenship => (
                                <SelectItem key={citizenship.id} value={citizenship.id}>
                                  {citizenship.emoji} {citizenship.name}
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
                  {country.visaFree?.length ? (
                    country.visaFree.map(visaFree => (
                      <div
                        key={visaFree.citizenshipId}
                        className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
                      >
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {visaFree.citizenship.name}
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
                              citizenshipId: visaFree.citizenshipId,
                              countryId: id!,
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

            {/* Blacklisted Citizenships */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Ban className="h-5 w-5 text-red-600" />
                      Blacklisted Citizenships
                    </CardTitle>
                    <CardDescription>Citizenships with restricted access</CardDescription>
                  </div>
                  <Dialog open={blacklistDialogOpen} onOpenChange={setBlacklistDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Blacklisted Citizenship</DialogTitle>
                        <DialogDescription>
                          Restrict access for a citizenship to this country.
                        </DialogDescription>
                      </DialogHeader>
                      <div>
                        <Label htmlFor="citizenship">Citizenship</Label>
                        <Select
                          value={selectedCitizenshipId}
                          onValueChange={setSelectedCitizenshipId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a citizenship" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableCitizenshipsForBlacklist().map(citizenship => (
                              <SelectItem key={citizenship.id} value={citizenship.id}>
                                {citizenship.emoji} {citizenship.name}
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
                  {country.blacklisted?.length ? (
                    country.blacklisted.map(blacklisted => (
                      <div
                        key={blacklisted.citizenshipId}
                        className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800"
                      >
                        <div className="font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {blacklisted.citizenship.name}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            deleteBlacklistMutation.mutate({
                              citizenshipId: blacklisted.citizenshipId,
                              countryId: id!,
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
                      <p>No citizenships blacklisted</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Citizenship Surcharges */}
            {canCreateSurcharges && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-amber-600" />
                        Citizenship Surcharges
                      </CardTitle>
                      <CardDescription>Additional fees based on citizenship</CardDescription>
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
                            Add additional fees for specific visa types based on citizenship.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="citizenship">Citizenship</Label>
                            <Select
                              value={selectedCitizenshipId}
                              onValueChange={setSelectedCitizenshipId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a citizenship" />
                              </SelectTrigger>
                              <SelectContent>
                                {citizenshipsData?.citizenships?.map(citizenship => (
                                  <SelectItem key={citizenship.id} value={citizenship.id}>
                                    {citizenship.emoji} {citizenship.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="visa-types">Visa Type IDs</Label>
                            <Input
                              id="visa-types"
                              value={surchargeVisaTypeIds.join(', ')}
                              onChange={(e: any) =>
                                setSurchargeVisaTypeIds(
                                  e.target.value
                                    .split(',')
                                    .map((s: string) => s.trim())
                                    .filter(Boolean)
                                )
                              }
                              placeholder="Enter visa type IDs separated by commas"
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
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label htmlFor="note">Note (optional)</Label>
                            <Input
                              id="note"
                              value={surchargeNote}
                              onChange={(e: any) => setSurchargeNote(e.target.value)}
                              placeholder="Optional note or description"
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
                    {country.surcharges?.length ? (
                      country.surcharges.map(surcharge => (
                        <div
                          key={surcharge.id}
                          className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="h-4 w-4" />
                              <span className="font-medium">{surcharge.citizenship.name}</span>
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
                              {surcharge.surchargeAmount.toLocaleString()} VND
                            </Badge>
                            {canDeleteSurcharges && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteSurchargeMutation.mutate({ id: surcharge.id })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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
            )}
          </div>
        </TabsContent>

        <TabsContent value="cities" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Cities ({country.cities?.length || 0})
                  </CardTitle>
                  <CardDescription>Manage cities in this country</CardDescription>
                </div>
                {canCreateCities && (
                  <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New City</DialogTitle>
                        <DialogDescription>Add a new city to {country.name}.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="city-name">City Name</Label>
                          <Input
                            id="city-name"
                            value={cityName}
                            onChange={e => setCityName(e.target.value)}
                            placeholder="Enter city name"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="city-active"
                            checked={cityIsActive}
                            onCheckedChange={setCityIsActive}
                          />
                          <Label htmlFor="city-active">Active</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCityDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddCity}>Add City</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {country.cities?.length ? (
                  country.cities.map(city => (
                    <div
                      key={city.id}
                      className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{city.name}</span>
                        <Badge variant={city.isActive ? 'default' : 'secondary'}>
                          {city.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {canUpdateCities && editingCity?.id === city.id ? (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={editingCity.isActive}
                              onCheckedChange={isActive =>
                                setEditingCity(prev => (prev ? { ...prev, isActive } : null))
                              }
                            />
                            <Button size="sm" onClick={handleUpdateCity}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingCity(null)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            {canUpdateCities && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingCity(city)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDeleteCities && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteCityMutation.mutate({ id: city.id })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Cities Added</h3>
                    <p className="mb-4">Start by adding cities to this country.</p>
                    {canCreateCities && (
                      <Button variant="outline" onClick={() => setCityDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First City
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visa-Free Access</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {country.visaFree?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">citizenships granted</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Restrictions</CardTitle>
                <Ban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {country.blacklisted?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">blacklisted citizenships</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cities</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {country.cities?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">registered cities</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visa Types</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">0</div>
                <p className="text-xs text-muted-foreground">available types</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Surcharges</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {country.surcharges?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">active surcharges</p>
              </CardContent>
            </Card>
          </div>

          {/* Access Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Access Analysis</CardTitle>
              <CardDescription>Detailed breakdown of visa access for this country</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Visa-Free Access</span>
                    <span className="text-sm text-muted-foreground">
                      {country.visaFree?.length || 0} citizenships
                    </span>
                  </div>
                  <Progress
                    value={
                      citizenshipsData?.citizenships?.length
                        ? ((country.visaFree?.length || 0) / citizenshipsData.citizenships.length) *
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
                      {country.blacklisted?.length || 0} citizenships
                    </span>
                  </div>
                  <Progress
                    value={
                      citizenshipsData?.citizenships?.length
                        ? ((country.blacklisted?.length || 0) /
                            citizenshipsData.citizenships.length) *
                          100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
              </div>

              {/* City Breakdown */}
              <div className="space-y-4">
                <h4 className="font-medium">City Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Total Cities</span>
                    <div className="text-lg font-semibold">{country.cities?.length || 0}</div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Active Cities</span>
                    <div className="text-lg font-semibold">
                      {country.cities?.filter(city => city.isActive).length || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Surcharge Analysis */}
              {country.surcharges && country.surcharges.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Surcharge Analysis</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Total Surcharges</span>
                      <div className="text-lg font-semibold">
                        {country.surcharges
                          .reduce((sum, surcharge) => sum + surcharge.surchargeAmount, 0)
                          .toLocaleString()}{' '}
                        VND
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Average Surcharge</span>
                      <div className="text-lg font-semibold">
                        {(country.surcharges.length > 0
                          ? country.surcharges.reduce(
                              (sum, surcharge) => sum + surcharge.surchargeAmount,
                              0
                            ) / country.surcharges.length
                          : 0
                        ).toLocaleString()}{' '}
                        VND
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

export default ViewCountryPage;
