import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import { getAllVisaCitizenshipSurchargesRoute } from '../../lib/routes';
import { Button } from '@/components/ui/button';
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
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

const CreateVisaCitizenshipSurchargePage = () => {
  const navigate = useNavigate();

  const [citizenshipId, setCitizenshipId] = useState('');
  const [countryId, setCountryId] = useState('');
  const [visaTypeId, setVisaTypeId] = useState('');
  const [surchargeAmount, setSurchargeAmount] = useState<number>(0);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: citizenshipsData } = trpc.citizenship.getAll.useQuery({});
  const { data: countriesData } = trpc.country.getAll.useQuery();
  const { data: visaTypesData } = trpc.visaType.getByCountry.useQuery(
    { countryId: countryId! },
    { enabled: !!countryId }
  );

  const createVisaCitizenshipSurchargeMutation = trpc.visaCitizenshipSurcharge.create.useMutation({
    onSuccess: () => {
      toast.success('Visa citizenship surcharge created successfully');
      navigate(getAllVisaCitizenshipSurchargesRoute());
    },
    onError: error => {
      toast.error(error.message);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!citizenshipId) {
      toast.error('Please select a citizenship');
      return;
    }

    if (!countryId) {
      toast.error('Please select a country');
      return;
    }

    if (!visaTypeId) {
      toast.error('Please select a visa type');
      return;
    }

    if (surchargeAmount < 0) {
      toast.error('Surcharge amount cannot be negative');
      return;
    }

    setIsSubmitting(true);

    createVisaCitizenshipSurchargeMutation.mutate({
      citizenshipId,
      countryId,
      visaTypeId,
      surchargeAmount,
      note: note.trim() || undefined,
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(getAllVisaCitizenshipSurchargesRoute())}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Surcharges
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create Visa Citizenship Surcharge</CardTitle>
          <p className="text-sm text-muted-foreground">
            Add a new visa surcharge for a specific citizenship and country combination
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="citizenship">Citizenship *</Label>
                <Select value={citizenshipId} onValueChange={setCitizenshipId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select citizenship" />
                  </SelectTrigger>
                  <SelectContent>
                    {citizenshipsData?.citizenships.map(citizenship => (
                      <SelectItem key={citizenship.id} value={citizenship.id}>
                        {citizenship.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Select
                  value={countryId}
                  onValueChange={value => {
                    setCountryId(value);
                    setVisaTypeId(''); // Clear visa type when country changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="visaType">Visa Type *</Label>
              <Select value={visaTypeId} onValueChange={setVisaTypeId} disabled={!countryId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={!countryId ? 'Select a country first' : 'Select visa type'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {visaTypesData?.visaTypes.map(visaType => (
                    <SelectItem key={visaType.id} value={visaType.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{visaType.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ${visaType.serviceCost.toFixed(2)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!countryId && (
                <p className="text-xs text-muted-foreground">
                  Please select a country to see available visa types
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="surchargeAmount">Surcharge Amount (USD) *</Label>
              <Input
                id="surchargeAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={surchargeAmount || ''}
                onChange={e => setSurchargeAmount(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                placeholder="Add any additional notes about this surcharge..."
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={500}
                rows={3}
              />
              <div className="text-xs text-muted-foreground text-right">
                {note.length}/500 characters
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(getAllVisaCitizenshipSurchargesRoute())}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Creating...' : 'Create Surcharge'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateVisaCitizenshipSurchargePage;
