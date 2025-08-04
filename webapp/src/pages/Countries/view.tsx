import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
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
  MapPin,
  Shield,
  ShieldX,
  DollarSign,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  XCircle,
} from 'lucide-react';

import { trpc } from '@/lib/trpcProvider';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { getAllCountriesRoute, getEditCountryRoute } from '@/lib/routes';
import { VisaTypeSelector } from '@/components/Requirements/VisaTypeSelector';

import { formatCurrency } from '@/utils/currency.js';

const ViewCountryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // Permission checks
  const canCreateCities = hasPermission('cities.create');
  const canReadCities = hasPermission('cities.read');
  const canUpdateCities = hasPermission('cities.update');
  const canDeleteCities = hasPermission('cities.delete');
  const canManageCities = canCreateCities || canUpdateCities || canDeleteCities;

  // Visa Citizenship Surcharge permissions
  const canCreateSurcharges = hasPermission('visaCitizenshipSurcharges.create');
  const canReadSurcharges = hasPermission('visaCitizenshipSurcharges.read');
  const canUpdateSurcharges = hasPermission('visaCitizenshipSurcharges.update');
  const canDeleteSurcharges = hasPermission('visaCitizenshipSurcharges.delete');
  const canManageSurcharges = canCreateSurcharges || canUpdateSurcharges || canDeleteSurcharges;

  const [visaFreeDialogOpen, setVisaFreeDialogOpen] = useState(false);
  const [blacklistDialogOpen, setBlacklistDialogOpen] = useState(false);
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [surchargeDialogOpen, setSurchargeDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<{
    id: string;
    name: string;
    isActive: boolean;
  } | null>(null);
  const [editingSurcharge, setEditingSurcharge] = useState<{
    id: string;
    citizenshipId: string;
    visaTypes: { visaType: { id: string; name: string; serviceCost: number } }[];
    surchargeAmount: number;
    note: string | null;
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

  const deleteCountryMutation = trpc.country.delete.useMutation({
    onSuccess: () => {
      toast.success('Country deleted successfully');
      navigate(getAllCountriesRoute());
    },
    onError: error => {
      toast.error(error.message);
    },
  });

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
      toast.success('City created successfully');
      refetch();
      setCityDialogOpen(false);
      setCityName('');
      setCityIsActive(true);
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const editCityMutation = trpc.city.edit.useMutation({
    onSuccess: () => {
      toast.success('City updated successfully');
      refetch();
      setCityDialogOpen(false);
      setEditingCity(null);
      setCityName('');
      setCityIsActive(true);
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
    onSuccess: () => {
      toast.success('Visa surcharge added successfully');
      refetch();
      setSurchargeDialogOpen(false);
      setSelectedCitizenshipId('');
      setSurchargeVisaTypeIds([]);
      setSurchargeAmount(0);
      setSurchargeNote('');
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const editSurchargeMutation = trpc.visaCitizenshipSurcharge.edit.useMutation({
    onSuccess: () => {
      toast.success('Visa surcharge updated successfully');
      refetch();
      setSurchargeDialogOpen(false);
      setEditingSurcharge(null);
      setSelectedCitizenshipId('');
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
      toast.success('Visa surcharge removed successfully');
      refetch();
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const handleDelete = () => {
    if (
      window.confirm('Are you sure you want to delete this country? This action cannot be undone.')
    ) {
      deleteCountryMutation.mutate({ id: id! });
    }
  };

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
      name: cityName.trim(),
      countryId: id!,
      isActive: cityIsActive,
    });
  };

  const handleEditCity = () => {
    if (!editingCity || !cityName.trim()) {
      toast.error('Please enter a city name');
      return;
    }
    editCityMutation.mutate({
      id: editingCity.id,
      name: cityName.trim(),
      countryId: id!,
      isActive: cityIsActive,
    });
  };

  const handleDeleteCity = (cityId: string, cityName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete the city "${cityName}"? This action cannot be undone.`
      )
    ) {
      deleteCityMutation.mutate({ id: cityId });
    }
  };

  const openCityDialog = (city?: { id: string; name: string; isActive: boolean }) => {
    if (city) {
      setEditingCity(city);
      setCityName(city.name);
      setCityIsActive(city.isActive);
    } else {
      setEditingCity(null);
      setCityName('');
      setCityIsActive(true);
    }
    setCityDialogOpen(true);
  };

  const closeCityDialog = () => {
    setCityDialogOpen(false);
    setEditingCity(null);
    setCityName('');
    setCityIsActive(true);
  };

  const handleAddSurcharge = () => {
    if (!selectedCitizenshipId || surchargeVisaTypeIds.length === 0) {
      toast.error('Please select a citizenship and at least one visa type');
      return;
    }
    if (surchargeAmount < 0) {
      toast.error('Surcharge amount cannot be negative');
      return;
    }
    createSurchargeMutation.mutate({
      citizenshipId: selectedCitizenshipId,
      countryId: id!,
      visaTypeIds: surchargeVisaTypeIds,
      surchargeAmount,
      note: surchargeNote.trim() || undefined,
    });
  };

  const handleEditSurcharge = () => {
    if (!editingSurcharge || !selectedCitizenshipId || surchargeVisaTypeIds.length === 0) {
      toast.error('Please select a citizenship and at least one visa type');
      return;
    }
    if (surchargeAmount < 0) {
      toast.error('Surcharge amount cannot be negative');
      return;
    }
    editSurchargeMutation.mutate({
      id: editingSurcharge.id,
      citizenshipId: selectedCitizenshipId,
      countryId: id!,
      visaTypeIds: surchargeVisaTypeIds,
      surchargeAmount,
      note: surchargeNote.trim() || undefined,
    });
  };

  const handleDeleteSurcharge = (surchargeId: string) => {
    if (
      window.confirm(
        'Are you sure you want to delete this visa surcharge? This action cannot be undone.'
      )
    ) {
      deleteSurchargeMutation.mutate({ id: surchargeId });
    }
  };

  const openSurchargeDialog = (surcharge?: {
    id: string;
    citizenshipId: string;
    visaTypes: { visaType: { id: string; name: string; serviceCost: number } }[];
    surchargeAmount: number;
    note: string | null;
  }) => {
    if (surcharge) {
      setEditingSurcharge(surcharge);
      setSelectedCitizenshipId(surcharge.citizenshipId);
      setSurchargeVisaTypeIds(surcharge.visaTypes.map(vt => vt.visaType.id));
      setSurchargeAmount(surcharge.surchargeAmount);
      setSurchargeNote(surcharge.note || '');
    } else {
      setEditingSurcharge(null);
      setSelectedCitizenshipId('');
      setSurchargeVisaTypeIds([]);
      setSurchargeAmount(0);
      setSurchargeNote('');
    }
    setSurchargeDialogOpen(true);
  };

  const closeSurchargeDialog = () => {
    setSurchargeDialogOpen(false);
    setEditingSurcharge(null);
    setSelectedCitizenshipId('');
    setSurchargeVisaTypeIds([]);
    setSurchargeAmount(0);
    setSurchargeNote('');
  };

  const getAvailableCitizenshipsForVisaFree = () => {
    if (!citizenshipsData?.citizenships || !data?.country) return [];
    const visaFreeCitizenshipIds = data.country.visaFree.map(vf => vf.citizenshipId);
    const blacklistedCitizenshipIds = data.country.blacklisted.map(bl => bl.citizenshipId);
    return citizenshipsData.citizenships.filter(
      citizenship =>
        !visaFreeCitizenshipIds.includes(citizenship.id) &&
        !blacklistedCitizenshipIds.includes(citizenship.id)
    );
  };

  const getAvailableCitizenshipsForBlacklist = () => {
    if (!citizenshipsData?.citizenships || !data?.country) return [];
    const visaFreeCitizenshipIds = data.country.visaFree.map(vf => vf.citizenshipId);
    const blacklistedCitizenshipIds = data.country.blacklisted.map(bl => bl.citizenshipId);
    return citizenshipsData.citizenships.filter(
      citizenship =>
        !visaFreeCitizenshipIds.includes(citizenship.id) &&
        !blacklistedCitizenshipIds.includes(citizenship.id)
    );
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(getAllCountriesRoute())}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Country Details</h1>
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

  if (isError || !data?.country) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(getAllCountriesRoute())}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Country Details</h1>
          </div>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error Loading Country</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error?.message || 'Country not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { country } = data;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(getAllCountriesRoute())}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold capitalize">{country.name}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Country Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Country Name</h3>
                  <p className="text-lg font-medium">{country.name}</p>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Visa Options</h3>
                  <div className="flex gap-2">
                    <Badge
                      variant={country.eVisaAvailable ? 'default' : 'secondary'}
                      className="flex items-center gap-1"
                    >
                      {country.eVisaAvailable ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      eVisa
                    </Badge>
                    <Badge
                      variant={country.multivisaAvailable ? 'default' : 'secondary'}
                      className="flex items-center gap-1"
                    >
                      {country.multivisaAvailable ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      Multivisa
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cities */}
          {(canReadCities || canManageCities) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Cities ({country.cities.length})
                  </div>
                  {canCreateCities && (
                    <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => openCityDialog()}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add City
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{editingCity ? 'Edit City' : 'Add New City'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="city-name">City Name</Label>
                            <Input
                              id="city-name"
                              type="text"
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
                          <div className="flex gap-2">
                            <Button
                              onClick={editingCity ? handleEditCity : handleAddCity}
                              disabled={createCityMutation.isPending || editCityMutation.isPending}
                              className="flex items-center gap-2"
                            >
                              <Save className="h-4 w-4" />
                              {createCityMutation.isPending || editCityMutation.isPending
                                ? editingCity
                                  ? 'Updating...'
                                  : 'Adding...'
                                : editingCity
                                  ? 'Update City'
                                  : 'Add City'}
                            </Button>
                            <Button variant="outline" onClick={closeCityDialog}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {country.cities.length > 0 ? (
                  <div className="space-y-3">
                    {country.cities.map((city: { id: string; name: string; isActive: boolean }) => (
                      <div
                        key={city.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{city.name}</span>
                          <Badge variant={city.isActive ? 'default' : 'secondary'}>
                            {city.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          {canUpdateCities && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openCityDialog(city)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDeleteCities && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteCity(city.id, city.name)}
                              disabled={deleteCityMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    {canReadCities
                      ? 'No cities added yet.'
                      : "You don't have permission to view cities."}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Visa Free Access */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Visa-Free Access ({country.visaFree.length})
                </div>
                <Dialog open={visaFreeDialogOpen} onOpenChange={setVisaFreeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Visa-Free
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Visa-Free Access</DialogTitle>
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
                                <div className="flex items-center gap-2">
                                  <span>{citizenship.name}</span>
                                  {citizenship.favourite && (
                                    <span className="text-yellow-500">⭐</span>
                                  )}
                                </div>
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
                          min="1"
                          max="365"
                          value={stampDuration}
                          onChange={e => setStampDuration(parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleAddVisaFree}
                          disabled={createVisaFreeMutation.isPending}
                        >
                          {createVisaFreeMutation.isPending ? 'Adding...' : 'Add'}
                        </Button>
                        <Button variant="outline" onClick={() => setVisaFreeDialogOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {country.visaFree.length > 0 ? (
                <div className="space-y-3">
                  {country.visaFree.map(
                    (entry: {
                      citizenshipId: string;
                      stampDuration: number;
                      citizenship: { id: string; name: string };
                    }) => (
                      <div
                        key={entry.citizenshipId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{entry.citizenship.name}</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {entry.stampDuration} days
                          </Badge>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            deleteVisaFreeMutation.mutate({
                              citizenshipId: entry.citizenshipId,
                              countryId: id!,
                            })
                          }
                          disabled={deleteVisaFreeMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No visa-free access configured.</p>
              )}
            </CardContent>
          </Card>

          {/* Blacklisted */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldX className="h-5 w-5" />
                  Blacklisted Citizenships ({country.blacklisted.length})
                </div>
                <Dialog open={blacklistDialogOpen} onOpenChange={setBlacklistDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Blacklist
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Citizenship to Blacklist</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="blacklist-citizenship">Citizenship</Label>
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
                                <div className="flex items-center gap-2">
                                  <span>{citizenship.name}</span>
                                  {citizenship.favourite && (
                                    <span className="text-yellow-500">⭐</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleAddBlacklist}
                          disabled={createBlacklistMutation.isPending}
                        >
                          {createBlacklistMutation.isPending ? 'Adding...' : 'Add to Blacklist'}
                        </Button>
                        <Button variant="outline" onClick={() => setBlacklistDialogOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {country.blacklisted.length > 0 ? (
                <div className="space-y-3">
                  {country.blacklisted.map(
                    (entry: {
                      citizenshipId: string;
                      citizenship: { id: string; name: string };
                    }) => (
                      <div
                        key={entry.citizenshipId}
                        className="flex items-center justify-between p-3 border rounded-lg bg-red-50"
                      >
                        <span className="font-medium text-red-800">{entry.citizenship.name}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            deleteBlacklistMutation.mutate({
                              citizenshipId: entry.citizenshipId,
                              countryId: id!,
                            })
                          }
                          disabled={deleteBlacklistMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No blacklisted citizenships.</p>
              )}
            </CardContent>
          </Card>

          {/* Visa Citizenship Surcharges */}
          {(canReadSurcharges || canManageSurcharges) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Visa Surcharges ({country.surcharges?.length || 0})
                  </div>
                  {canCreateSurcharges && (
                    <Dialog open={surchargeDialogOpen} onOpenChange={setSurchargeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => openSurchargeDialog()}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Surcharge
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            {editingSurcharge ? 'Edit Visa Surcharge' : 'Add Visa Surcharge'}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="surcharge-citizenship">Citizenship</Label>
                            <Select
                              value={selectedCitizenshipId}
                              onValueChange={setSelectedCitizenshipId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a citizenship" />
                              </SelectTrigger>
                              <SelectContent>
                                {citizenshipsData?.citizenships.map(citizenship => (
                                  <SelectItem key={citizenship.id} value={citizenship.id}>
                                    <div className="flex items-center gap-2">
                                      <span>{citizenship.name}</span>
                                      {citizenship.favourite && (
                                        <span className="text-yellow-500">⭐</span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="surcharge-visa-types">Visa Types</Label>
                            <VisaTypeSelector
                              selectedIds={surchargeVisaTypeIds}
                              onSelectionChange={setSurchargeVisaTypeIds}
                              countryFilter={id}
                              disabled={
                                createSurchargeMutation.isPending || editSurchargeMutation.isPending
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="surcharge-amount">Surcharge Amount (VND)</Label>
                            <Input
                              id="surcharge-amount"
                              type="number"
                              min="0"
                              step="1"
                              value={surchargeAmount || ''}
                              onChange={e => setSurchargeAmount(parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label htmlFor="surcharge-note">Note (Optional)</Label>
                            <Textarea
                              id="surcharge-note"
                              value={surchargeNote}
                              onChange={e => setSurchargeNote(e.target.value)}
                              placeholder="Additional notes..."
                              maxLength={500}
                              rows={3}
                            />
                            <div className="text-xs text-muted-foreground text-right">
                              {surchargeNote.length}/500 characters
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={editingSurcharge ? handleEditSurcharge : handleAddSurcharge}
                              disabled={
                                createSurchargeMutation.isPending || editSurchargeMutation.isPending
                              }
                              className="flex items-center gap-2"
                            >
                              <Save className="h-4 w-4" />
                              {createSurchargeMutation.isPending || editSurchargeMutation.isPending
                                ? editingSurcharge
                                  ? 'Updating...'
                                  : 'Adding...'
                                : editingSurcharge
                                  ? 'Update Surcharge'
                                  : 'Add Surcharge'}
                            </Button>
                            <Button variant="outline" onClick={closeSurchargeDialog}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {country.surcharges && country.surcharges.length > 0 ? (
                  <div className="space-y-3">
                    {country.surcharges.map(
                      (surcharge: {
                        id: string;
                        citizenshipId: string;
                        visaTypes: {
                          visaType: { id: string; name: string; serviceCost: number };
                        }[];
                        surchargeAmount: number;
                        note: string | null;
                        citizenship: { id: string; name: string };
                      }) => (
                        <div
                          key={surcharge.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {surcharge.citizenship.name} -{' '}
                                {surcharge.visaTypes.map(vt => vt.visaType.name).join(', ')}
                              </span>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                {formatCurrency(surcharge.surchargeAmount, 'VND')}
                              </Badge>
                            </div>
                            {surcharge.note && (
                              <p className="text-sm text-muted-foreground mt-1">{surcharge.note}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {canUpdateSurcharges && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openSurchargeDialog(surcharge)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDeleteSurcharges && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteSurcharge(surcharge.id)}
                                disabled={deleteSurchargeMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    {canReadSurcharges
                      ? 'No visa surcharges configured.'
                      : "You don't have permission to view visa surcharges."}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => navigate(getEditCountryRoute({ id: country.id }))}
                className="w-full justify-start"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Country
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteCountryMutation.isPending}
                className="w-full justify-start"
              >
                {deleteCountryMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Country'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ViewCountryPage;
