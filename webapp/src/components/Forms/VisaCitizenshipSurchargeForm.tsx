import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { VisaTypeSelector } from '@/components/Requirements/VisaTypeSelector';
import CitizenshipSelect from '@/components/Citizenship/CitizenshipSelect';
import { Save, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';

import type { Citizenship } from '@visarun/backend/node_modules/@prisma/client';

// Form schema
const visaCitizenshipSurchargeSchema = z.object({
  citizenshipId: z.string().min(1, 'Citizenship is required'),
  countryId: z.string().min(1, 'Country is required'),
  visaTypeIds: z.array(z.string()).optional(),
  isGlobal: z.boolean(),
  surchargeAmount: z.number().min(0, 'Surcharge amount cannot be negative'),
  note: z.string().optional(),
});

export type VisaCitizenshipSurchargeFormData = z.infer<typeof visaCitizenshipSurchargeSchema>;

interface Country {
  id: string;
  name: string;
}

interface VisaCitizenshipSurchargeFormProps {
  initialData?: Partial<VisaCitizenshipSurchargeFormData>;
  currentCitizenship?: Citizenship;
  countries: Country[];
  onSubmit: (data: VisaCitizenshipSurchargeFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitText?: string;
  title?: string;
}

const VisaCitizenshipSurchargeForm = ({
  initialData,
  countries,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitText = 'Save Surcharge',
  title = 'Visa Citizenship Surcharge Information',
}: VisaCitizenshipSurchargeFormProps) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<VisaCitizenshipSurchargeFormData | null>(
    null
  );

  const form = useForm<VisaCitizenshipSurchargeFormData>({
    resolver: zodResolver(visaCitizenshipSurchargeSchema),
    defaultValues: {
      citizenshipId: initialData?.citizenshipId || '',
      countryId: initialData?.countryId || '',
      visaTypeIds: initialData?.visaTypeIds || [],
      isGlobal: initialData?.isGlobal || false,
      surchargeAmount: initialData?.surchargeAmount || 0,
      note: initialData?.note || '',
    },
  });

  // Watch form values
  const watchedValues = form.watch(['countryId', 'isGlobal']);
  const [countryId, isGlobal] = watchedValues;

  // Reset visa types when switching to global or changing country
  useEffect(() => {
    if (isGlobal) {
      form.setValue('visaTypeIds', []);
    }
  }, [isGlobal, form]);

  useEffect(() => {
    form.setValue('visaTypeIds', []);
  }, [countryId, form]);

  const handleFormSubmit = (data: VisaCitizenshipSurchargeFormData) => {
    // Validate visa types selection
    if (!data.isGlobal && (!data.visaTypeIds || data.visaTypeIds.length === 0)) {
      form.setError('visaTypeIds', {
        type: 'manual',
        message: 'Please select at least one visa type or enable global application',
      });
      return;
    }

    if (data.isGlobal && data.visaTypeIds && data.visaTypeIds.length > 0) {
      form.setError('visaTypeIds', {
        type: 'manual',
        message: 'Cannot specify visa types when applying to all visa types',
      });
      return;
    }

    // Clean up the data
    const cleanedData = {
      ...data,
      visaTypeIds: data.isGlobal ? undefined : data.visaTypeIds,
      note: data.note?.trim() || undefined,
    };

    // Show confirmation dialog for global surcharges
    if (data.isGlobal) {
      setPendingFormData(cleanedData);
      setShowConfirmDialog(true);
    } else {
      onSubmit(cleanedData);
    }
  };

  const handleConfirmGlobalSubmit = () => {
    if (pendingFormData) {
      onSubmit(pendingFormData);
    }
    setShowConfirmDialog(false);
    setPendingFormData(null);
  };

  const handleCancelGlobalSubmit = () => {
    setShowConfirmDialog(false);
    setPendingFormData(null);
  };

  const noteValue = form.watch('note') || '';

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <Card className="bg-secondary">
            <CardContent className="pt-6">
              <CardTitle className="text-lg mb-4">{title}</CardTitle>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <FormField
                  control={form.control}
                  name="citizenshipId"
                  render={({ field }) => (
                    <CitizenshipSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      currentCitizenship={initialData?.citizenshipId}
                      label="Citizenship *"
                    />
                  )}
                />

                <FormField
                  control={form.control}
                  name="countryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map(country => (
                            <SelectItem key={country.id} value={country.id}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="surchargeAmount"
                render={({ field }) => (
                  <FormItem className="mb-6">
                    <FormLabel>Surcharge Amount (VND) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0.00"
                        {...field}
                        value={field.value || ''}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isGlobal"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-6">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Apply to all visa types in this country</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        If checked, this surcharge will automatically apply to all current and
                        future visa types for the selected country
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Visa Type Selector */}
          {!isGlobal && (
            <Card className="bg-secondary">
              <CardContent className="pt-6">
                <CardTitle className="text-lg mb-4">Visa Types *</CardTitle>
                <p className="text-sm text-muted-foreground mb-4">
                  Select the specific visa types this surcharge applies to
                </p>
                {!countryId ? (
                  <div className="text-sm text-muted-foreground bg-gray-50 p-4 rounded-md">
                    Please select a country first to see available visa types
                  </div>
                ) : (
                  <FormField
                    control={form.control}
                    name="visaTypeIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <VisaTypeSelector
                            selectedIds={field.value || []}
                            onSelectionChange={field.onChange}
                            disabled={isSubmitting}
                            countryFilter={countryId}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Global Application Info */}
          {isGlobal && countryId && (
            <Card className="bg-secondary">
              <CardContent className="pt-6">
                <CardTitle className="text-lg mb-4">Global Application</CardTitle>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This surcharge will be automatically applied to all current and future visa
                    types for the selected country.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card className="bg-secondary">
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes about this surcharge..."
                        maxLength={500}
                        rows={3}
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="text-xs text-muted-foreground text-right mt-1">
                      {noteValue.length}/500 characters
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : submitText}
            </Button>
          </div>
        </form>
      </Form>

      {/* Global Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm Global Surcharge {initialData ? 'Update' : 'Creation'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to{' '}
              {initialData ? 'update this surcharge to' : 'create a global surcharge that will'}{' '}
              apply to ALL visa types in the selected country. This will:
              <br />
              <br />
              • Apply to all existing visa types for this country
              <br />
              • Automatically apply to any future visa types created for this country
              <br />• {initialData ? 'Update' : 'Apply'} surcharge amount of{' '}
              {form.getValues('surchargeAmount')?.toLocaleString()} VND
              <br />
              <br />
              Are you sure you want to {initialData ? 'update to' : 'create'} this global surcharge?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelGlobalSubmit}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmGlobalSubmit}>
              Yes, {initialData ? 'Update to' : 'Create'} Global Surcharge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default VisaCitizenshipSurchargeForm;
