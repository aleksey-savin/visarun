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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import VisaCitizenshipSurchargeForm, {
  type VisaCitizenshipSurchargeFormData,
} from '@/components/VisaCitizenshipSurcharge/Form';
import VisaFreeAccessDialog from '@/components/Countries/VisaFreeAccessDialog';
import BlacklistCitizenshipDialog from '@/components/Countries/BlacklistCitizenshipDialog';

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
import { formatCurrency } from '@/utils/currency';

const ViewCountryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [selectedTab, setSelectedTab] = useState('access');

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

  const [cityName, setCityName] = useState('');
  const [cityIsActive, setCityIsActive] = useState(true);
  const [isSurchargeFormSubmitting, setIsSurchargeFormSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data, error, isLoading, isError, refetch } = trpc.country.getOne.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const { data: countriesData } = trpc.country.getAll.useQuery();

  const createVisaFreeMutation = trpc.visaFree.create.useMutation({
    onSuccess: () => {
      toast.success('Visa-Free added successfully');
      refetch();
      setVisaFreeDialogOpen(false);
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const deleteVisaFreeMutation = trpc.visaFree.delete.useMutation({
    onSuccess: () => {
      toast.success('Visa-Free removed successfully');
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
    onError: error => {
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
    onSuccess: data => {
      const message =
        data.affectedVisaTypesCount > 0
          ? `Visa citizenship surcharge created successfully. Applied to ${data.affectedVisaTypesCount} visa types.`
          : 'Visa citizenship surcharge created successfully';
      toast.success(message);
      refetch();
      setSurchargeDialogOpen(false);
      setIsSurchargeFormSubmitting(false);
    },
    onError: error => {
      toast.error(error.message);
      setIsSurchargeFormSubmitting(false);
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

  const deleteCountryMutation = trpc.country.delete.useMutation({
    onSuccess: () => {
      toast.success('Country deleted successfully');
      navigate(getAllCountriesRoute());
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const handleAddVisaFree = (data: { citizenshipId: string; stampDuration: number }) => {
    createVisaFreeMutation.mutate({
      citizenshipId: data.citizenshipId,
      countryId: id!,
      stampDuration: data.stampDuration,
    });
  };

  const handleAddBlacklist = (data: { citizenshipId: string }) => {
    createBlacklistMutation.mutate({
      citizenshipId: data.citizenshipId,
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

  const handleSurchargeFormSubmit = (data: VisaCitizenshipSurchargeFormData) => {
    setIsSurchargeFormSubmitting(true);
    createSurchargeMutation.mutate(data);
  };

  const handleSurchargeFormCancel = () => {
    setSurchargeDialogOpen(false);
  };

  const handleDeleteCountry = () => {
    deleteCountryMutation.mutate({ id: id! });
    setDeleteDialogOpen(false);
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
          <Button variant="secondary" size="icon" onClick={() => navigate(getAllCountriesRoute())}>
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
          <Button variant="secondary" onClick={() => navigate(getAllCountriesRoute())}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Countries
          </Button>
        </div>
      </div>
    );
  }

  const { country } = data;

  return (
    <div className="container mx-auto p-6  space-y-6">
      {/* Country Information - Always Visible */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Country Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {country.name}{' '}
                {country.favourite && <Star className="h-4 w-4 text-yellow-600 fill-current" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {country.eVisaAvailable ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-success font-medium">eVisa Available</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground font-medium">
                          eVisa not Available
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {country.multivisaAvailable ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-success font-medium">Multi-entry Visa</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground font-medium">
                          Multi-entry Visa not Available
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {country.multivisaAvailable &&
                country.multivisaIsGlobal &&
                country.multivisaGlobalExtraCost && (
                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Global Multi-entry Extra Cost
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatCurrency(country.multivisaGlobalExtraCost)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Applied to all visa types in this country
                      </p>
                    </div>
                  </div>
                )}
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
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full justify-start">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Country
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Country</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete "{country.name}"? This action cannot be undone
                      and will remove all associated data including cities, visa access, and
                      surcharges.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setDeleteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteCountry}
                      disabled={deleteCountryMutation.isPending}
                    >
                      {deleteCountryMutation.isPending ? 'Deleting...' : 'Delete Country'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-fit">
          <TabsTrigger value="access" className="gap-2">
            <Plane className="h-4 w-4" />
            Visa Access
          </TabsTrigger>
          <TabsTrigger value="cities" className="gap-2">
            <Building2 className="h-4 w-4" />
            Cities
          </TabsTrigger>
          <TabsTrigger value="statistics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="access" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visa-Free */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Visa-Free
                    </CardTitle>
                    <CardDescription>Citizenships with visa-free entry</CardDescription>
                  </div>
                  <VisaFreeAccessDialog
                    open={visaFreeDialogOpen}
                    onOpenChange={setVisaFreeDialogOpen}
                    onSubmit={handleAddVisaFree}
                    isSubmitting={createVisaFreeMutation.isPending}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {country.visaFree?.length ? (
                    country.visaFree.map(visaFree => (
                      <Card
                        key={visaFree.citizenshipId}
                        className="flex flex-row items-center justify-between p-3 bg-secondary"
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
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No Visa-Free granted</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Blacklisted */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Ban className="h-5 w-5 text-red-600" />
                      Blacklisted
                    </CardTitle>
                    <CardDescription>Citizenships with restricted access</CardDescription>
                  </div>
                  <BlacklistCitizenshipDialog
                    open={blacklistDialogOpen}
                    onOpenChange={setBlacklistDialogOpen}
                    onSubmit={handleAddBlacklist}
                    isSubmitting={createBlacklistMutation.isPending}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {country.blacklisted?.length ? (
                    country.blacklisted.map(blacklisted => (
                      <Card
                        key={blacklisted.citizenshipId}
                        className="flex flex-row items-center justify-between p-3 bg-secondary"
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
                      </Card>
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

            {/* Surcharges */}
            {canCreateSurcharges && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-warning" />
                        Surcharges
                      </CardTitle>
                      <CardDescription>Additional fees based on citizenship</CardDescription>
                    </div>
                    <Dialog open={surchargeDialogOpen} onOpenChange={setSurchargeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="secondary">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className=" max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add Citizenship Surcharge</DialogTitle>
                          <DialogDescription>
                            Add additional fees for specific visa types based on citizenship for{' '}
                            {country.name}.
                          </DialogDescription>
                        </DialogHeader>
                        {countriesData && (
                          <VisaCitizenshipSurchargeForm
                            countries={countriesData.countries}
                            initialData={{
                              countryId: country.id,
                            }}
                            onSubmit={handleSurchargeFormSubmit}
                            onCancel={handleSurchargeFormCancel}
                            isSubmitting={isSurchargeFormSubmitting}
                            submitText="Add Surcharge"
                            title={`Citizenship Surcharge for ${country.name}`}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {country.surcharges?.length ? (
                      country.surcharges.map(surcharge => (
                        <Card
                          key={surcharge.id}
                          className="flex flex-row items-center justify-between p-3 bg-secondary"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
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
                            <Badge variant="secondary" className="font-mono">
                              {formatCurrency(surcharge.surchargeAmount)}
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
                        </Card>
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
                </div>
                {canCreateCities && (
                  <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="secondary">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New City</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
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
                        <Button variant="secondary" onClick={() => setCityDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddCity}>Add</Button>
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
                    <Card
                      key={city.id}
                      className="flex flex-row justify-between items-center bg-secondary p-6"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="h-6 w-6" />
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
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Cities Added</h3>
                    <p className="mb-4">Start by adding cities to this country.</p>
                    {canCreateCities && (
                      <Button variant="secondary" onClick={() => setCityDialogOpen(true)}>
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

        <TabsContent value="statistics" className="space-y-6">
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
                <Card className="text-center p-4 bg-secondary gap-2">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="font-semibold text-success">Visa-Free</span>
                  </div>
                  <div className="text-3xl font-bold">{country.visaFree?.length || 0}</div>
                  <p className="text-sm">citizenships</p>
                </Card>
                <Card className="text-center p-4 bg-secondary gap-2">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Ban className="h-5 w-5 text-destructive" />
                    <span className="font-semibold text-destructive">Blacklisted</span>
                  </div>
                  <div className="text-3xl font-bold ">{country.blacklisted?.length || 0}</div>
                  <p className="text-sm ">citizenships</p>
                </Card>
                <Card className="text-center p-4 bg-secondary gap-2">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-warning" />
                    <span className="font-semibold text-warning">Surcharges</span>
                  </div>
                  <div className="text-3xl font-bold">{country.surcharges?.length || 0}</div>
                  <p className="text-sm ">active</p>
                </Card>
                <Card className="text-center p-4 bg-secondary gap-2">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Building2 className="h-5 w-5" />
                    <span className="font-semibold ">Cities</span>
                  </div>
                  <div className="text-3xl font-bold">{country.cities?.length || 0}</div>
                  <p className="text-sm">registered</p>
                </Card>
                <Card className="text-center p-4 bg-secondary gap-2">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FileText className="h-5 w-5 " />
                    <span className="font-semibold ">Visa Types</span>
                  </div>
                  <div className="text-3xl font-bold ">{country.VisaType?.length || 0}</div>
                  <p className="text-sm ">available</p>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ViewCountryPage;
