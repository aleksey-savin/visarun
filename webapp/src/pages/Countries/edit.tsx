import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import { getAllCountriesRoute, getViewCountryRoute } from '../../lib/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Globe, Save } from 'lucide-react';
import { toast } from 'sonner';

const EditCountryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    eVisaAvailable: false,
    multivisaAvailable: false,
  });

  const { data, isLoading, isError, error } = trpc.country.getOne.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const editCountryMutation = trpc.country.edit.useMutation({
    onSuccess: () => {
      toast.success('Country updated successfully');
      navigate(getViewCountryRoute({ id: id! }));
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (data?.country) {
      setFormData({
        name: data.country.name,
        eVisaAvailable: data.country.eVisaAvailable,
        multivisaAvailable: data.country.multivisaAvailable,
      });
    }
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Country name is required');
      return;
    }
    editCountryMutation.mutate({
      id: id!,
      ...formData,
    });
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !data?.country) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <h3 className="font-medium text-lg mb-2">Error Loading Country</h3>
        <p>{error?.message || 'Country not found'}</p>
        <Button onClick={() => navigate(getAllCountriesRoute())} className="mt-4" variant="outline">
          Back to Countries
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(getViewCountryRoute({ id: id! }))}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Country
        </Button>
        <div className="text-3xl sm:text-5xl font-semibold capitalize">Edit Country</div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Country Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Country Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                placeholder="Enter country name"
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="eVisaAvailable"
                  checked={formData.eVisaAvailable}
                  onCheckedChange={checked =>
                    handleInputChange('eVisaAvailable', checked as boolean)
                  }
                />
                <Label htmlFor="eVisaAvailable" className="text-sm font-medium">
                  eVisa Available
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="multivisaAvailable"
                  checked={formData.multivisaAvailable}
                  onCheckedChange={checked =>
                    handleInputChange('multivisaAvailable', checked as boolean)
                  }
                />
                <Label htmlFor="multivisaAvailable" className="text-sm font-medium">
                  Multivisa Available
                </Label>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={editCountryMutation.isPending} className="flex-1">
                {editCountryMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Country
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(getViewCountryRoute({ id: id! }))}
                disabled={editCountryMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default EditCountryPage;
