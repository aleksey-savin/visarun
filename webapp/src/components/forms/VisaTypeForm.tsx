import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FileText, Save, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Form schema
const visaTypeSchema = z.object({
  name: z.string().min(1, 'Visa type name is required').max(255, 'Name is too long'),
  serviceCost: z.number().min(0, 'Service cost cannot be negative'),
  countryId: z.string().min(1, 'Country is required'),
  isMultientry: z.boolean(),
  favourite: z.boolean(),
  multientryExtraCost: z.number().min(0, 'Extra cost cannot be negative').optional(),
  processingMode: z.enum(['fixed', 'approximate']),
  processingUnit: z.enum(['hours', 'days']),
  processingValueFixed: z.number().int().min(1).optional(),
  processingValueMin: z.number().int().min(1).optional(),
  processingValueMax: z.number().int().min(1).optional(),
  submissionDayIncluded: z.boolean(),
});

export type VisaTypeFormData = z.infer<typeof visaTypeSchema>;

interface Country {
  id: string;
  name: string;
  multivisaAvailable: boolean;
}

interface VisaTypeFormProps {
  initialData?: Partial<VisaTypeFormData>;
  countries: Country[];
  onSubmit: (data: VisaTypeFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitText?: string;
  title?: string;
}

const VisaTypeForm = ({
  initialData,
  countries,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitText = 'Save Visa Type',
  title = 'Visa Type Information',
}: VisaTypeFormProps) => {
  const form = useForm<VisaTypeFormData>({
    resolver: zodResolver(visaTypeSchema),
    defaultValues: {
      name: initialData?.name || '',
      serviceCost: initialData?.serviceCost || 0,
      countryId: initialData?.countryId || '',
      isMultientry: initialData?.isMultientry || false,
      favourite: initialData?.favourite || false,
      multientryExtraCost: initialData?.multientryExtraCost || undefined,
      processingMode: initialData?.processingMode || 'fixed',
      processingUnit: initialData?.processingUnit || 'days',
      processingValueFixed: initialData?.processingValueFixed || undefined,
      processingValueMin: initialData?.processingValueMin || undefined,
      processingValueMax: initialData?.processingValueMax || undefined,
      submissionDayIncluded: initialData?.submissionDayIncluded || false,
    },
  });

  // Watch form values
  const watchedValues = form.watch(['countryId', 'isMultientry', 'processingMode']);
  const [countryId, isMultientry, processingMode] = watchedValues;

  // Get selected country info
  const selectedCountry = countries.find(country => country.id === countryId);
  const isMultivisaAvailable = selectedCountry?.multivisaAvailable ?? false;

  // Handle country change - reset multi-entry settings if not supported
  useEffect(() => {
    if (countryId && selectedCountry && !selectedCountry.multivisaAvailable) {
      form.setValue('isMultientry', false);
      form.setValue('multientryExtraCost', undefined);
    }
  }, [countryId, selectedCountry, form]);

  const handleSubmit = (data: VisaTypeFormData) => {
    // Validate processing values
    if (data.processingMode === 'fixed') {
      if (!data.processingValueFixed) {
        form.setError('processingValueFixed', { message: 'Please enter a fixed processing time' });
        return;
      }
    } else {
      if (!data.processingValueMin || !data.processingValueMax) {
        if (!data.processingValueMin) {
          form.setError('processingValueMin', { message: 'Please enter minimum processing time' });
        }
        if (!data.processingValueMax) {
          form.setError('processingValueMax', { message: 'Please enter maximum processing time' });
        }
        return;
      }
      if (data.processingValueMin >= data.processingValueMax) {
        form.setError('processingValueMax', { message: 'Maximum must be greater than minimum' });
        return;
      }
    }

    // Validate multi-entry cost
    if (data.isMultientry && data.multientryExtraCost === undefined) {
      form.setError('multientryExtraCost', { message: 'Please enter multi-entry extra cost' });
      return;
    }

    // Clean up data based on processing mode
    const submitData = {
      ...data,
      processingValueFixed: data.processingMode === 'fixed' ? data.processingValueFixed : undefined,
      processingValueMin:
        data.processingMode === 'approximate' ? data.processingValueMin : undefined,
      processingValueMax:
        data.processingMode === 'approximate' ? data.processingValueMax : undefined,
      multientryExtraCost: data.isMultientry ? data.multientryExtraCost : undefined,
    };

    onSubmit(submitData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6 bg-secondary">
        <CardTitle className="flex items-center gap-2 text-lg mb-6">
          <FileText className="h-5 w-5" />
          {title}
        </CardTitle>

        <CardContent className="p-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visa Type Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="e.g., Tourist, Business, Student"
                            {...field}
                            maxLength={255}
                          />
                          {!field.value && (
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 pointer-events-none">
                              *
                            </span>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="countryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                <span>
                                  Select country <span className="text-red-500">*</span>
                                </span>
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map(country => (
                              <SelectItem key={country.id} value={country.id}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <hr className="my-6" />

              {/* Pricing */}
              <div className="space-y-4">
                <Label className="text-sm">Pricing</Label>

                <FormField
                  control={form.control}
                  name="serviceCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Cost (VND)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                          {field.value === 0 && (
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 pointer-events-none">
                              *
                            </span>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Multi-entry Options */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isMultientry"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!isMultivisaAvailable}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel
                            className={`text-sm font-medium ${!isMultivisaAvailable ? 'text-muted-foreground' : ''}`}
                          >
                            Multi-entry visa available
                          </FormLabel>
                          {!isMultivisaAvailable && countryId && (
                            <p className="text-xs text-muted-foreground">
                              Multi-entry visas are not available for the selected country
                            </p>
                          )}
                        </div>
                      </FormItem>
                    )}
                  />

                  {isMultientry && (
                    <FormField
                      control={form.control}
                      name="multientryExtraCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Multi-entry Extra Cost (VND)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="0"
                                {...field}
                                onChange={e =>
                                  field.onChange(parseFloat(e.target.value) || undefined)
                                }
                              />
                              {field.value === undefined && (
                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 pointer-events-none">
                                  *
                                </span>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              <hr className="my-6" />

              {/* Processing Time */}
              <div className="space-y-4">
                <Label className="text-sm">Processing Time</Label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="processingMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Processing Mode</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">Fixed</SelectItem>
                              <SelectItem value="approximate">Approximate</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="processingUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Processing Unit</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hours">Hours</SelectItem>
                              <SelectItem value="days">Days</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {processingMode === 'fixed' ? (
                  <FormField
                    control={form.control}
                    name="processingValueFixed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Processing Time ({form.watch('processingUnit')})</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              min="1"
                              placeholder="e.g., 5"
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value) || undefined)}
                            />
                            {!field.value && (
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 pointer-events-none">
                                *
                              </span>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="processingValueMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Min Processing Time ({form.watch('processingUnit')})
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                min="1"
                                placeholder="e.g., 3"
                                {...field}
                                onChange={e =>
                                  field.onChange(parseInt(e.target.value) || undefined)
                                }
                              />
                              {!field.value && (
                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 pointer-events-none">
                                  *
                                </span>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="processingValueMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Max Processing Time ({form.watch('processingUnit')})
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                min="1"
                                placeholder="e.g., 7"
                                {...field}
                                onChange={e =>
                                  field.onChange(parseInt(e.target.value) || undefined)
                                }
                              />
                              {!field.value && (
                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 pointer-events-none">
                                  *
                                </span>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="submissionDayIncluded"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">
                          Submission day included in processing time
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <hr className="my-6" />

              {/* Additional Options */}
              <FormField
                control={form.control}
                name="favourite"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium">Mark as Favourite</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Show this visa type in the favourites list
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {/* Info Alert */}
              {!isMultivisaAvailable && countryId && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    The selected country does not support multi-entry visas. Only single-entry visa
                    types can be created.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {submitText.includes('Creating') ? 'Creating...' : 'Updating...'}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {submitText}
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisaTypeForm;
