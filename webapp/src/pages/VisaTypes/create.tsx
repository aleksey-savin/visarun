import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import { getAllVisaTypesRoute } from '../../lib/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

const CreateVisaTypePage = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [serviceCost, setServiceCost] = useState<number>(0);
  const [countryId, setCountryId] = useState('');
  const [isMultientry, setIsMultientry] = useState(false);
  const [favourite, setFavourite] = useState(false);
  const [multientryExtraCost, setMultientryExtraCost] = useState<number | null>(null);
  const [processingMode, setProcessingMode] = useState<'fixed' | 'approximate'>('fixed');
  const [processingUnit, setProcessingUnit] = useState<'hours' | 'days'>('days');
  const [processingValueFixed, setProcessingValueFixed] = useState<number | null>(null);
  const [processingValueMin, setProcessingValueMin] = useState<number | null>(null);
  const [processingValueMax, setProcessingValueMax] = useState<number | null>(null);
  const [submissionDayIncluded, setSubmissionDayIncluded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: countriesData } = trpc.country.getAll.useQuery();

  const createVisaTypeMutation = trpc.visaType.create.useMutation({
    onSuccess: () => {
      toast.success('Visa type created successfully');
      navigate(getAllVisaTypesRoute());
    },
    onError: error => {
      toast.error(error.message);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a visa type name');
      return;
    }

    if (!countryId) {
      toast.error('Please select a country');
      return;
    }

    if (serviceCost < 0) {
      toast.error('Service cost cannot be negative');
      return;
    }

    if (isMultientry && multientryExtraCost !== null && multientryExtraCost < 0) {
      toast.error('Multi-entry extra cost cannot be negative');
      return;
    }

    if (
      processingMode === 'fixed' &&
      (processingValueFixed === null || processingValueFixed <= 0)
    ) {
      toast.error('Please enter a valid fixed processing time');
      return;
    }

    if (processingMode === 'approximate') {
      if (processingValueMin === null || processingValueMin <= 0) {
        toast.error('Please enter a valid minimum processing time');
        return;
      }
      if (processingValueMax === null || processingValueMax <= 0) {
        toast.error('Please enter a valid maximum processing time');
        return;
      }
      if (processingValueMin >= processingValueMax) {
        toast.error('Maximum processing time must be greater than minimum');
        return;
      }
    }

    setIsSubmitting(true);

    createVisaTypeMutation.mutate({
      name: name.trim(),
      serviceCost,
      countryId,
      isMultientry,
      favourite,
      multientryExtraCost: isMultientry ? (multientryExtraCost ?? undefined) : undefined,
      processingMode,
      processingUnit,
      processingValueFixed:
        processingMode === 'fixed' ? (processingValueFixed ?? undefined) : undefined,
      processingValueMin:
        processingMode === 'approximate' ? (processingValueMin ?? undefined) : undefined,
      processingValueMax:
        processingMode === 'approximate' ? (processingValueMax ?? undefined) : undefined,
      submissionDayIncluded,
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(getAllVisaTypesRoute())}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Visa Types
        </Button>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Create Visa Type</CardTitle>
          <p className="text-sm text-muted-foreground">
            Add a new visa type for a specific country
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Visa Type Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Tourist, Business, Student"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={100}
                />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serviceCost">Service Cost (VND) *</Label>
                <Input
                  id="serviceCost"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={serviceCost || ''}
                  onChange={e => setServiceCost(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="multientry"
                    checked={isMultientry}
                    onCheckedChange={checked => setIsMultientry(checked === true)}
                  />
                  <Label htmlFor="multientry">Multi-entry visa available</Label>
                </div>
                {isMultientry && (
                  <div className="mt-2">
                    <Label htmlFor="multientryExtraCost">Multi-entry Extra Cost (VND)</Label>
                    <Input
                      id="multientryExtraCost"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0.00"
                      value={multientryExtraCost || ''}
                      onChange={e => setMultientryExtraCost(parseFloat(e.target.value) || null)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Processing Time</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="processingMode">Processing Mode *</Label>
                  <Select
                    value={processingMode}
                    onValueChange={(value: 'fixed' | 'approximate') => setProcessingMode(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select processing mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="approximate">Approximate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="processingUnit">Processing Unit *</Label>
                  <Select
                    value={processingUnit}
                    onValueChange={(value: 'hours' | 'days') => setProcessingUnit(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select processing unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {processingMode === 'fixed' ? (
                <div className="space-y-2">
                  <Label htmlFor="processingValueFixed">Processing Time ({processingUnit}) *</Label>
                  <Input
                    id="processingValueFixed"
                    type="number"
                    min="1"
                    placeholder="e.g., 5"
                    value={processingValueFixed || ''}
                    onChange={e => setProcessingValueFixed(parseInt(e.target.value) || null)}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="processingValueMin">
                      Min Processing Time ({processingUnit}) *
                    </Label>
                    <Input
                      id="processingValueMin"
                      type="number"
                      min="1"
                      placeholder="e.g., 3"
                      value={processingValueMin || ''}
                      onChange={e => setProcessingValueMin(parseInt(e.target.value) || null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="processingValueMax">
                      Max Processing Time ({processingUnit}) *
                    </Label>
                    <Input
                      id="processingValueMax"
                      type="number"
                      min="1"
                      placeholder="e.g., 7"
                      value={processingValueMax || ''}
                      onChange={e => setProcessingValueMax(parseInt(e.target.value) || null)}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="submissionDayIncluded"
                  checked={submissionDayIncluded}
                  onCheckedChange={checked => setSubmissionDayIncluded(checked === true)}
                />
                <Label htmlFor="submissionDayIncluded">
                  Submission day included in processing time
                </Label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="favourite"
                  checked={favourite}
                  onCheckedChange={checked => setFavourite(checked === true)}
                />
                <Label htmlFor="favourite" className="text-sm font-medium">
                  Mark as Favourite
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(getAllVisaTypesRoute())}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Creating...' : 'Create Visa Type'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateVisaTypePage;
