import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

const EditVisaCitizenshipSurchargePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [citizenshipId, setCitizenshipId] = useState('');
  const [countryId, setCountryId] = useState('');
  const [visaTypeId, setVisaTypeId] = useState('');
  const [surchargeAmount, setSurchargeAmount] = useState<number>(0);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: surchargeData,
    error,
    isLoading,
    isError,
  } = trpc.visaCitizenshipSurcharge.getOne.useQuery({ id: id! }, { enabled: !!id });

  const { data: citizenshipsData } = trpc.citizenship.getAll.useQuery();
  const { data: countriesData } = trpc.country.getAll.useQuery();

  const editVisaCitizenshipSurchargeMutation = trpc.visaCitizenshipSurcharge.edit.useMutation({
    onSuccess: () => {
      toast.success('Visa citizenship surcharge updated successfully');
      navigate(getAllVisaCitizenshipSurchargesRoute());
    },
    onError: error => {
      toast.error(error.message);
      setIsSubmitting(false);
    },
  });

  useEffect(() => {
    if (surchargeData?.visaCitizenshipSurcharge) {
      const surcharge = surchargeData.visaCitizenshipSurcharge;
      setCitizenshipId(surcharge.citizenshipId);
      setCountryId(surcharge.countryId);
      setVisaTypeId(surcharge.visaTypeId);
      setSurchargeAmount(surcharge.surchargeAmount);
      setNote(surcharge.note || '');
    }
  }, [surchargeData]);

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

    if (!visaTypeId.trim()) {
      toast.error('Please enter a visa type');
      return;
    }

    if (surchargeAmount < 0) {
      toast.error('Surcharge amount cannot be negative');
      return;
    }

    setIsSubmitting(true);

    editVisaCitizenshipSurchargeMutation.mutate({
      id: id!,
      citizenshipId,
      countryId,
      visaTypeId: visaTypeId.trim(),
      surchargeAmount,
      note: note.trim() || undefined,
    });
  };

  const commonVisaTypes = [
    'Tourist',
    'Business',
    'Student',
    'Work',
    'Transit',
    'Medical',
    'Conference',
    'Family Visit',
    'Religious',
    'Cultural',
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading visa citizenship surcharge...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error: {error?.message}</div>
        </div>
      </div>
    );
  }

  if (!surchargeData?.visaCitizenshipSurcharge) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Visa citizenship surcharge not found</div>
        </div>
      </div>
    );
  }

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
          <CardTitle>Edit Visa Citizenship Surcharge</CardTitle>
          <p className="text-sm text-muted-foreground">Update the visa surcharge information</p>
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
                <Select value={countryId} onValueChange={setCountryId}>
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
              <div className="space-y-2">
                <Input
                  id="visaType"
                  placeholder="Enter visa type (e.g., Tourist, Business, Student)"
                  value={visaTypeId}
                  onChange={e => setVisaTypeId(e.target.value)}
                  maxLength={100}
                />
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">Quick select:</span>
                  {commonVisaTypes.map(type => (
                    <Button
                      key={type}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setVisaTypeId(type)}
                      disabled={visaTypeId === type}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
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
                {isSubmitting ? 'Updating...' : 'Update Surcharge'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditVisaCitizenshipSurchargePage;
