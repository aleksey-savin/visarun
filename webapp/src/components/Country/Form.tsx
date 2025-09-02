import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Globe, Save, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Form schema
const countrySchema = z.object({
  name: z.string().min(1, 'Country name is required').max(100, 'Country name is too long'),
  favourite: z.boolean(),
  eVisaAvailable: z.boolean(),
  multivisaAvailable: z.boolean(),
  multivisaIsGlobal: z.boolean().optional(),
  multivisaGlobalExtraCost: z.number().min(0, 'Extra cost cannot be negative').optional(),
});

export type CountryFormData = z.infer<typeof countrySchema>;

interface CountryFormProps {
  initialData?: Partial<CountryFormData>;
  onSubmit: (data: CountryFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitText?: string;
  title?: string;
}

const CountryForm = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitText = 'Save Country',
  title = 'Country Information',
}: CountryFormProps) => {
  const form = useForm<CountryFormData>({
    resolver: zodResolver(countrySchema),
    defaultValues: {
      name: initialData?.name || '',
      favourite: initialData?.favourite || false,
      eVisaAvailable: initialData?.eVisaAvailable || false,
      multivisaAvailable: initialData?.multivisaAvailable || false,
      multivisaIsGlobal: initialData?.multivisaIsGlobal || false,
      multivisaGlobalExtraCost: initialData?.multivisaGlobalExtraCost || undefined,
    },
  });

  // Watch form values for conditional rendering
  const watchedValues = form.watch(['multivisaAvailable', 'multivisaIsGlobal']);
  const [multivisaAvailable, multivisaIsGlobal] = watchedValues;

  const handleSubmit = (data: CountryFormData) => {
    onSubmit(data);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6 bg-secondary">
        <CardTitle className="flex items-center gap-2 text-lg mb-6">
          <Globe className="h-5 w-5" />
          {title}
        </CardTitle>

        <CardContent className="p-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="Enter country name" {...field} maxLength={100} />
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

              <hr className="my-6" />

              <div className="space-y-4">
                <Label className="text-sm">Visa Options</Label>

                <FormField
                  control={form.control}
                  name="eVisaAvailable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">eVisa Available</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Enable electronic visa applications for this country
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="multivisaAvailable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={checked => {
                            field.onChange(checked);
                            // Reset global settings when multivisa is disabled
                            if (!checked) {
                              form.setValue('multivisaIsGlobal', false);
                              form.setValue('multivisaGlobalExtraCost', undefined);
                            }
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">
                          Multi-entry Visa Available
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Allow multi-entry visa types for this country
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {multivisaAvailable && (
                  <div className="ml-6 space-y-4 border-l-2 border-muted pl-4">
                    <FormField
                      control={form.control}
                      name="multivisaIsGlobal"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={checked => {
                                field.onChange(checked);
                                // Reset global cost when global is disabled
                                if (!checked) {
                                  form.setValue('multivisaGlobalExtraCost', undefined);
                                }
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium">
                              Global Multi-entry Settings
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Apply same multi-entry cost to all visa types in this country
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    {multivisaIsGlobal && (
                      <FormField
                        control={form.control}
                        name="multivisaGlobalExtraCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Global Multi-entry Extra Cost (VND)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  step="1"
                                  placeholder="Enter global extra cost"
                                  {...field}
                                  value={field.value || ''}
                                  onChange={e =>
                                    field.onChange(parseFloat(e.target.value) || undefined)
                                  }
                                />
                                {!field.value && (
                                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 pointer-events-none">
                                    *
                                  </span>
                                )}
                              </div>
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              This cost will be applied to all visa types in this country
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {multivisaIsGlobal ? (
                      <>
                        Global multi-entry settings will automatically update all existing visa
                        types for this country. They will be set to multi-entry with the specified
                        extra cost.
                      </>
                    ) : (
                      <>
                        If multi-entry visas are disabled, all visa types for this country will be
                        single-entry only. Existing multi-entry visa types will be automatically
                        converted to single-entry.
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              </div>

              <hr className="my-6" />

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
                        Show this country in the favourites list
                      </p>
                    </div>
                  </FormItem>
                )}
              />

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
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
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

export default CountryForm;
