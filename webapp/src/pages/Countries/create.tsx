import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import { getAllCountriesRoute } from '../../lib/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Globe, Save } from 'lucide-react';
import { toast } from 'sonner';

const CreateCountryPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    eVisaAvailable: false,
    multivisaAvailable: false,
  });

  const createCountryMutation = trpc.country.create.useMutation({
    onSuccess: () => {
      toast.success('Country created successfully');
      navigate(getAllCountriesRoute());
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Country name is required');
      return;
    }
    createCountryMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate(getAllCountriesRoute())}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Countries
        </Button>
        <div className="text-3xl sm:text-5xl font-semibold capitalize">Create Country</div>
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
              <Button type="submit" disabled={createCountryMutation.isPending} className="flex-1">
                {createCountryMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Country
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(getAllCountriesRoute())}
                disabled={createCountryMutation.isPending}
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

export default CreateCountryPage;
