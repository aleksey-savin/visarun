import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Puzzle, Copy, Crown } from 'lucide-react';
import { getEditOrderRoute } from '@/lib/routes';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/badge';

// Form schema
const orderSchema = z.object({
  contactMethodId: z.string().min(1, 'Contact method is required'),
  contactValue: z.string().min(1, 'Contact information is required'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  comment: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

const CreateOrderPage = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      contactMethodId: '',
      contactValue: '',
      firstName: '',
      lastName: '',
      comment: '',
    },
  });

  // Mutations
  const createClientMutation = trpc.client.create.useMutation();
  const createOrderMutation = trpc.order.create.useMutation();

  // Fetch contact methods from database
  const {
    data: contactMethodsData,
    isLoading: contactMethodsLoading,
    error: contactMethodsError,
  } = trpc.contactMethod.getAll.useQuery();

  // Helper function to determine active breadcrumb step
  const getBreadcrumbSteps = (status: string) => {
    const steps = [
      { name: 'Service puzzle', isActive: false, isCompleted: false },
      { name: 'Personal data', isActive: false, isCompleted: false },
      { name: 'Payment', isActive: false, isCompleted: false },
    ];

    switch (status) {
      case 'draft':
        steps[0].isActive = true;
        break;
      case 'checking_personal_data':
        steps[0].isCompleted = true;
        steps[1].isActive = true;
        break;
      case 'submitted':
        steps[0].isCompleted = true;
        steps[1].isCompleted = true;
        steps[2].isActive = true;
        break;
      default:
        steps[0].isActive = true;
    }

    return steps;
  };

  // For create page, status is 'draft'
  const currentStatus = 'draft';
  const breadcrumbSteps = getBreadcrumbSteps(currentStatus);

  const performSave = async (data: OrderFormData) => {
    if (isSaving) return;

    // Validate required fields before saving
    if (!data.contactMethodId || !data.contactValue) {
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');
    setErrorMessage(null);
    try {
      if (!createdOrderId) {
        // First save - create client and order
        const clientResult = await createClientMutation.mutateAsync({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          userData: {
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            contactMethods: [
              {
                contactMethodId: data.contactMethodId,
                value: data.contactValue,
              },
            ],
          },
        });

        const orderResult = await createOrderMutation.mutateAsync({
          userId: clientResult.createdUser!.id,
          status: 'draft',
        });

        setCreatedOrderId(orderResult.order.id);
        setLastSavedTime(new Date());
        setSaveStatus('saved');

        // Navigate to edit page seamlessly after first save
        if (!hasNavigated) {
          setHasNavigated(true);
          setTimeout(() => {
            navigate(getEditOrderRoute({ id: orderResult.order.id }), { replace: true });
          }, 100);
        }
      }
    } catch (error) {
      console.log(error);
      setSaveStatus('error');
      setErrorMessage('Failed to save order');
    } finally {
      setIsSaving(false);
    }
  };

  const debouncedSave = (data: OrderFormData) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      performSave(data);
    }, 1000); // 1 second debounce
  };

  // Watch form values and trigger autosave
  useEffect(() => {
    const subscription = form.watch(data => {
      // Only autosave if required fields are filled and form is dirty
      if (data.contactMethodId && data.contactValue && form.formState.isDirty) {
        debouncedSave(data as OrderFormData);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form, createdOrderId]);

  const onSubmit = async (data: OrderFormData) => {
    if (createdOrderId) {
      // Order already exists, just navigate
      navigate(getEditOrderRoute({ id: createdOrderId }));
    } else {
      // Create order if not already created
      await performSave(data);
    }
  };

  const contactMethods = contactMethodsData?.contactMethods || [];

  return (
    <>
      <CardTitle className="border-b flex py-1.5 px-6 justify-between gap-2 items-center h-[45px]">
        <div className="flex gap-3 items-center text-sm">
          <Puzzle />
          {breadcrumbSteps.map((step, index) => (
            <div key={step.name} className="flex items-center gap-3">
              <span
                className={`${
                  step.isActive
                    ? 'text-primary underline'
                    : step.isCompleted
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                }`}
              >
                {step.name}
              </span>
              {index < breadcrumbSteps.length - 1 && (
                <span className="text-muted-foreground">▶</span>
              )}
            </div>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          {saveStatus === 'saving'
            ? 'Saving...'
            : saveStatus === 'error'
              ? errorMessage || 'Failed to save'
              : saveStatus === 'saved' && lastSavedTime
                ? `Saved at ${lastSavedTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })} ✓`
                : 'Not saved'}
        </div>
      </CardTitle>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-secondary">
              <CardTitle className="flex items-center justify-between gap-2 text-lg">
                <Badge variant="primary">
                  <Crown />
                </Badge>
                <span className="text-muted-foreground text-sm">0 VND</span>
              </CardTitle>
              <CardContent className="p-0">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div>
                      <Label className="text-sm mb-2">Contact</Label>
                      <div className="flex gap-3">
                        <FormField
                          control={form.control}
                          name="contactMethodId"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={
                                        <span>
                                          Select type <span className="text-red-500">*</span>
                                        </span>
                                      }
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {contactMethodsLoading ? (
                                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                        Loading...
                                      </div>
                                    ) : contactMethodsError ? (
                                      <div className="px-2 py-1.5 text-sm text-destructive">
                                        Error loading contact methods
                                      </div>
                                    ) : contactMethods.length === 0 ? (
                                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                        No contact methods available
                                      </div>
                                    ) : (
                                      contactMethods.map(method => (
                                        <SelectItem key={method.id} value={method.id}>
                                          {method.name}
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contactValue"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    className="w-auto"
                                    placeholder="phone / @username / e-mail"
                                    {...field}
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
                    </div>

                    <hr className="my-6" />

                    {/* Full Name */}
                    <div>
                      <Label className="text-sm mb-2">Full name</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="First Name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Second Name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <hr className="my-6" />

                    {/* Action Buttons */}
                    <div className="flex justify-between">
                      <div></div>
                      <Button type="submit">Save & close</Button>
                    </div>
                  </form>
                </Form>
                {/* Service Puzzle Section */}
                <Card className="mt-6 p-0 bg-muted border-none">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Service puzzle</div>
                      <Card className="flex items-center gap-1 p-1 bg-secondary rounded-md border-none">
                        <div className="flex gap-2">
                          <Button
                            disabled
                            variant="secondary"
                            size="sm"
                            className="bg-[#172554] border-none"
                          >
                            Visa
                          </Button>
                          <Button disabled variant="secondary" size="sm" className="border-none">
                            Visarun
                          </Button>
                          <Button disabled variant="secondary" size="sm" className="border-none">
                            Acceleration
                          </Button>
                        </div>
                      </Card>
                      <div className="flex gap-2">
                        <Button disabled variant="secondary" size="sm" className="border-none">
                          + Transfer
                        </Button>
                        <Button disabled variant="secondary" size="sm" className="border-none">
                          + Currency Exchange
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm font-medium w-fit">
                  Name Surname
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Visa</span>
                    <span>dd.mm.yy</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Country</span>
                    <span>hh.mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span></span>
                  </div>
                </div>

                <hr />

                <div className="text-sm">
                  <div className="text-muted-foreground mb-1">Multi</div>
                </div>

                <hr />

                <div className="text-sm">
                  <div className="font-medium">Client summ</div>
                  <div className="text-muted-foreground">Total:</div>
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between text-sm">
              <span>Next step</span>
              <Button variant="ghost" size="sm">
                →
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </>
  );
};

export default CreateOrderPage;
