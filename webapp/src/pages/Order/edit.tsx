import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { getAllOrdersRoute, type EditOrderRouteParams } from '@/lib/routes';
import { trpc } from '@/lib/trpc';

import { Badge } from '@/components/ui/badge';

// Form schema
const orderSchema = z.object({
  contactMethodId: z.string().min(1, 'Contact method is required'),
  contactValue: z.string().min(1, 'Contact information is required'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

const EditOrderPage = () => {
  const navigate = useNavigate();
  const { id } = useParams() as EditOrderRouteParams;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
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
    },
  });

  // Fetch order data
  const {
    data: orderData,
    isLoading: orderLoading,
    error: orderError,
  } = trpc.order.getOne.useQuery({ id });

  // Fetch contact methods from database
  const {
    data: contactMethodsData,
    isLoading: contactMethodsLoading,
    error: contactMethodsError,
  } = trpc.contactMethod.getAll.useQuery();

  // Mutations
  const updateClientMutation = trpc.client.edit.useMutation();
  const updateUserMutation = trpc.user.edit.useMutation();
  const updateContactMethodMutation = trpc.userContactMethod.edit.useMutation();
  const createContactMethodMutation = trpc.userContactMethod.create.useMutation();

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

  const performSave = useCallback(
    async (data: OrderFormData) => {
      if (isSaving || !orderData?.order) return;

      // Validate required fields before saving
      if (!data.contactMethodId || !data.contactValue) {
        return;
      }

      setIsSaving(true);
      setSaveStatus('saving');
      setErrorMessage(null);
      try {
        const order = orderData.order;
        const user = order.user;

        // Update user name information
        await updateUserMutation.mutateAsync({
          id: user.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
        });

        // Update client information if there are order items
        const clientId = order.items[0]?.clientId;
        if (clientId) {
          await updateClientMutation.mutateAsync({
            id: clientId,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
          });
        }

        // Update contact method
        const existingContactMethod = user.contactMethods?.[0];

        if (existingContactMethod) {
          // Check if contact method type changed
          if (existingContactMethod.method.id !== data.contactMethodId) {
            // If contact method type changed, create new one
            await createContactMethodMutation.mutateAsync({
              userId: user.id,
              contactMethodId: data.contactMethodId,
              value: data.contactValue,
            });
          } else {
            // Update existing contact method value
            await updateContactMethodMutation.mutateAsync({
              id: existingContactMethod.id,
              value: data.contactValue,
            });
          }
        } else {
          // Create new contact method if none exists
          await createContactMethodMutation.mutateAsync({
            userId: user.id,
            contactMethodId: data.contactMethodId,
            value: data.contactValue,
          });
        }

        setLastSavedTime(new Date());
        setSaveStatus('saved');
      } catch (error) {
        console.log(error);
        setSaveStatus('error');
        setErrorMessage('Failed to save order');
      } finally {
        setIsSaving(false);
      }
    },
    [
      isSaving,
      orderData?.order,
      updateUserMutation,
      updateClientMutation,
      updateContactMethodMutation,
      createContactMethodMutation,
    ]
  );

  const debouncedSave = useCallback(
    (data: OrderFormData) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        performSave(data);
      }, 1000); // 1 second debounce
    },
    [performSave]
  );

  // Populate form when order data loads
  useEffect(() => {
    if (orderData?.order && contactMethodsData?.contactMethods) {
      const order = orderData.order;
      const user = order.user;

      // Get the first contact method from user's contact methods
      const firstContactMethod = user.contactMethods?.[0];

      // Validate that the contact method exists in available options
      const contactMethodId = firstContactMethod?.method.id;
      const isValidContactMethod =
        contactMethodId &&
        contactMethodsData.contactMethods.some(method => method.id === contactMethodId);

      // Use setTimeout to ensure Select component has rendered
      setTimeout(() => {
        form.setValue('firstName', user.firstName || '');
        form.setValue('lastName', user.lastName || '');
        form.setValue('contactMethodId', isValidContactMethod ? contactMethodId : '');
        form.setValue('contactValue', firstContactMethod?.value || '');
      }, 100);
    }
  }, [orderData, contactMethodsData, form]);

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
  }, [form, orderData, debouncedSave]);

  const onSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true);
    try {
      await performSave(data);
      // Navigate to orders page after successful save
      navigate(getAllOrdersRoute());
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = contactMethodsData?.contactMethods || [];

  if (orderLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">Loading order...</div>
      </div>
    );
  }

  if (orderError || !orderData?.order) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center text-destructive">
          {orderError ? 'Error loading order' : 'Order not found'}
        </div>
      </div>
    );
  }

  const order = orderData.order;

  // For edit page, status based on order status
  const currentStatus = order.status;
  const breadcrumbSteps = getBreadcrumbSteps(currentStatus);

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
                : order.updatedAt
                  ? `Saved at ${new Date(order.updatedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })} ✓`
                  : 'Saved ✓'}
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
                                <Select
                                  key={`contact-method-${orderData?.order?.user.id}-${field.value}`}
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  defaultValue={field.value}
                                >
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
                                <Input placeholder="Last Name" {...field} />
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
                      <Button type="submit" disabled={isSubmitting || isSaving}>
                        Save & close
                      </Button>
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
                  {order.user.firstName} {order.user.lastName}
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

export default EditOrderPage;
