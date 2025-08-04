import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import { getAllCitizenshipsRoute, getEditCitizenshipRoute } from '../../lib/routes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Users,
  Edit,
  Star,
  Shield,
  ShieldX,
  DollarSign,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currency.js';

const ViewCitizenshipPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  const deleteCitizenshipMutation = trpc.citizenship.delete.useMutation({
    onSuccess: () => {
      toast.success('Citizenship deleted successfully');
      navigate(getAllCitizenshipsRoute());
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

  const handleDelete = () => {
    if (
      window.confirm(
        'Are you sure you want to delete this citizenship? This action cannot be undone.'
      )
    ) {
      deleteCitizenshipMutation.mutate({ id: id! });
    }
  };

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

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(getAllCitizenshipsRoute())}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Citizenship Details</h1>
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

  if (isError || !data?.citizenship) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(getAllCitizenshipsRoute())}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Citizenship Details</h1>
          </div>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error Loading Citizenship</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error?.message || 'Citizenship not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { citizenship } = data;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(getAllCitizenshipsRoute())}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="text-4xl">{citizenship.emoji}</div>
            <h1 className="text-3xl font-bold capitalize">{citizenship.name}</h1>
            <Badge variant="secondary" className="font-mono text-sm">
              {citizenship.abbreviation}
            </Badge>
            {citizenship.favourite && <Star className="h-8 w-8 text-yellow-500 fill-current" />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Citizenship Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">
                    Citizenship Name
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{citizenship.emoji}</span>
                    <p className="text-lg font-medium">{citizenship.name}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Country Code</h3>
                  <Badge variant="outline" className="font-mono text-sm">
                    {citizenship.abbreviation}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Status</h3>
                  <Badge
                    variant={citizenship.favourite ? 'default' : 'secondary'}
                    className="flex items-center gap-1 w-fit"
                  >
                    {citizenship.favourite ? <Star className="h-3 w-3 fill-current" /> : null}
                    {citizenship.favourite ? 'Favourite' : 'Regular'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visa Free Countries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Visa-Free Countries ({citizenship.visaFree.length})
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
              {citizenship.visaFree.length > 0 ? (
                <div className="space-y-3">
                  {citizenship.visaFree.map(
                    (entry: {
                      countryId: string;
                      stampDuration: number;
                      country: { id: string; name: string };
                    }) => (
                      <div
                        key={entry.countryId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{entry.country.name}</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {entry.stampDuration} days
                          </Badge>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            deleteVisaFreeMutation.mutate({
                              citizenshipId: id!,
                              countryId: entry.countryId,
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
                <p className="text-muted-foreground">No visa-free countries configured.</p>
              )}
            </CardContent>
          </Card>

          {/* Blacklisted Countries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldX className="h-5 w-5" />
                  Blacklisted Countries ({citizenship.blacklisted.length})
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
                      <DialogTitle>Add Country to Blacklist</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="blacklist-country">Country</Label>
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
              {citizenship.blacklisted.length > 0 ? (
                <div className="space-y-3">
                  {citizenship.blacklisted.map(
                    (entry: { countryId: string; country: { id: string; name: string } }) => (
                      <div
                        key={entry.countryId}
                        className="flex items-center justify-between p-3 border rounded-lg bg-red-50"
                      >
                        <span className="font-medium text-red-800">{entry.country.name}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            deleteBlacklistMutation.mutate({
                              citizenshipId: id!,
                              countryId: entry.countryId,
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
                <p className="text-muted-foreground">No blacklisted countries.</p>
              )}
            </CardContent>
          </Card>

          {/* Visa Citizenship Surcharges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Visa Citizenship Surcharges ({citizenship.surcharges.length})
                </div>
                <Dialog open={surchargeDialogOpen} onOpenChange={setSurchargeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Surcharge
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Citizenship Surcharge</DialogTitle>
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
                      <div className="flex gap-2">
                        <Button
                          onClick={handleAddSurcharge}
                          disabled={createSurchargeMutation.isPending}
                        >
                          {createSurchargeMutation.isPending ? 'Adding...' : 'Add Surcharge'}
                        </Button>
                        <Button variant="outline" onClick={() => setSurchargeDialogOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {citizenship.surcharges.length > 0 ? (
                <div className="space-y-3">
                  {citizenship.surcharges.map(
                    (surcharge: {
                      id: string;
                      surchargeAmount: number;
                      note: string | null;
                      country: { id: string; name: string };
                      visaTypes: { id: string; visaType: { id: string; name: string } }[];
                    }) => (
                      <div
                        key={surcharge.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {surcharge.country.name} -{' '}
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
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteSurchargeMutation.mutate({ id: surcharge.id })}
                          disabled={deleteSurchargeMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No surcharges configured.</p>
              )}
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
              <Button
                onClick={() => navigate(getEditCitizenshipRoute({ id: citizenship.id }))}
                className="w-full justify-start"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Citizenship
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteCitizenshipMutation.isPending}
                className="w-full justify-start"
              >
                {deleteCitizenshipMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Citizenship'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ViewCitizenshipPage;
