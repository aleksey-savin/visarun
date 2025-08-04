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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Puzzle, Copy, Crown, CalendarIcon } from 'lucide-react';
import { getAllOrdersRoute, type EditOrderRouteParams } from '@/lib/routes';
import { trpc } from '@/lib/trpc';

import { Badge } from '@/components/ui/badge';
import VisaSection from '@/components/Order/visa-section';
import { formatCurrency } from '@/utils/currency.js';

// Form schema
const orderSchema = z.object({
  contactMethodId: z.string().min(1, 'Contact method is required'),
  contactValue: z.string().min(1, 'Contact information is required'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  citizenshipId: z.string().optional(),
  passportExpirationDate: z.date().optional().nullable(),
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
  const [passportDate, setPassportDate] = useState<Date | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to calculate total amount from order items
  const calculateTotalAmount = (order: any) => {
    if (!order?.items || order.items.length === 0) {
      return '0 VND';
    }
    const total = order.items.reduce((sum: number, item: any) => sum + (item.finalPrice || 0), 0);
    return formatCurrency(total, 'VND');
  };

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      contactMethodId: '',
      contactValue: '',
      firstName: '',
      lastName: '',
      citizenshipId: 'none',
      passportExpirationDate: null,
    },
  });

  // Fetch order data
  const {
    data: orderData,
    isLoading: orderLoading,
    error: orderError,
    refetch: refetchOrder,
  } = trpc.order.getOne.useQuery({ id });

  // Fetch contact methods from database
  const {
    data: contactMethodsData,
    isLoading: contactMethodsLoading,
    error: contactMethodsError,
  } = trpc.contactMethod.getAll.useQuery();

  // Fetch citizenships from database
  const { data: citizenshipsData } = trpc.citizenship.getAll.useQuery({});

  // Fetch primary client for the user
  const { data: primaryClientData, refetch: refetchPrimaryClient } =
    trpc.client.getByUserId.useQuery(
      { userId: (orderData?.order as any)?.user?.id || '' },
      { enabled: !!(orderData?.order as any)?.user?.id }
    );

  // Mutations
  const updateClientMutation = trpc.client.edit.useMutation({
    onSuccess: () => {
      refetchPrimaryClient(); // Refetch primary client after update
    },
    onError: () => {},
  });
  const updateUserMutation = trpc.user.edit.useMutation();
  const updateContactMethodMutation = trpc.userContactMethod.edit.useMutation();
  const createContactMethodMutation = trpc.userContactMethod.create.useMutation();

  const updateOrderMutation = trpc.order.edit.useMutation({
    onSuccess: () => {
      refetchOrder(); // Refetch order data to get updated timestamp
    },
  });

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

  const autoSave = useCallback(
    async (data: OrderFormData, saveType: 'user' | 'client' | 'both') => {
      if (isSaving || !orderData?.order) return;

      setIsSaving(true);
      setSaveStatus('saving');
      setErrorMessage(null);

      try {
        const order = orderData.order as any;
        const user = order.user;
        const primaryClient = primaryClientData?.client;
        const clientId = primaryClient?.id;

        // Save user data if requested
        if (saveType === 'user' || saveType === 'both') {
          // Update user name information

          await updateUserMutation.mutateAsync({
            id: user.id,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
          });

          // Update contact method if provided
          if (data.contactMethodId && data.contactValue) {
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
          }
        }

        // Save client data if requested
        if (saveType === 'client' || saveType === 'both') {
          if (!clientId) {
            throw new Error('Client ID is required for client update');
          }

          // Safe date conversion for tRPC transmission - use ISO string
          let passportExpirationDate = null;
          if (data.passportExpirationDate) {
            if (data.passportExpirationDate instanceof Date) {
              passportExpirationDate = data.passportExpirationDate.toISOString();
            } else if (typeof data.passportExpirationDate === 'string') {
              try {
                passportExpirationDate = new Date(data.passportExpirationDate).toISOString();
              } catch {
                console.error('Invalid date string:', data.passportExpirationDate);
                passportExpirationDate = null;
              }
            } else {
              console.warn(
                'Unexpected passport date format:',
                typeof data.passportExpirationDate,
                data.passportExpirationDate
              );
            }
          }

          const clientUpdateData = {
            id: clientId,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            citizenshipId: data.citizenshipId === 'none' ? null : data.citizenshipId || null,
            passportExpirationDate,
          };

          try {
            await updateClientMutation.mutateAsync(clientUpdateData);
          } catch (clientError) {
            console.error('Primary client update failed:', clientError);
            throw clientError; // Re-throw to be caught by outer try-catch
          }
        }

        // Always update order timestamp when any entity is updated
        // We pass the current status to trigger an update which will automatically update updatedAt
        await updateOrderMutation.mutateAsync({
          id: order.id,
          status: order.status,
        });

        setLastSavedTime(new Date());
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
        setErrorMessage('Failed to auto-save. Please try again.');
      } finally {
        setIsSaving(false);
      }
    },
    [
      isSaving,
      orderData?.order,
      primaryClientData?.client,
      updateUserMutation,
      updateClientMutation,
      updateContactMethodMutation,
      createContactMethodMutation,
      updateOrderMutation,
    ]
  );

  // Manual save function for form submission
  const performSave = useCallback(
    async (data: OrderFormData) => {
      await autoSave(data, 'both');
    },
    [autoSave]
  );

  // Consolidated auto-save function with debouncing
  const debouncedAutoSave = useCallback(
    (data: OrderFormData, saveType: 'user' | 'client' | 'both') => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        autoSave(data, saveType);
      }, 1000);
    },
    [autoSave]
  );

  // Populate form when order data loads
  useEffect(() => {
    if (orderData?.order && contactMethodsData?.contactMethods && primaryClientData?.client) {
      const order = orderData.order as any;
      const user = order.user;
      const primaryClient = primaryClientData.client;

      // Get the first contact method from user's contact methods
      const firstContactMethod = user.contactMethods?.[0];

      // Validate that the contact method exists in available options
      const contactMethodId = firstContactMethod?.method.id;
      const isValidContactMethod =
        contactMethodId &&
        contactMethodsData.contactMethods.some(method => method.id === contactMethodId);

      // Use setTimeout to ensure Select component has rendered
      setTimeout(() => {
        // Parse passport date safely for Calendar component
        let parsedPassportDate = null;
        if (primaryClient?.passportExpirationDate) {
          // Handle different date formats from API
          const dateValue = primaryClient.passportExpirationDate;
          let parsedDate: Date | null = null;

          if (typeof dateValue === 'string') {
            parsedDate = new Date(dateValue);
          } else if (dateValue !== null && typeof dateValue === 'object') {
            parsedDate = dateValue as Date;
          } else if (dateValue) {
            parsedDate = new Date(dateValue as any);
          }

          if (parsedDate && !isNaN(parsedDate.getTime())) {
            parsedPassportDate = parsedDate;
          }
        }

        form.setValue('passportExpirationDate', parsedPassportDate);
        // Set passport date state
        setPassportDate(parsedPassportDate);

        // Reset form with all values at once
        form.reset({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          contactMethodId: isValidContactMethod ? contactMethodId : '',
          contactValue: firstContactMethod?.value || '',
          citizenshipId: primaryClient?.citizenshipId || 'none',
          passportExpirationDate: parsedPassportDate,
        });
      }, 100);
    }
  }, [orderData, contactMethodsData, primaryClientData, form]);

  // Watch form values and trigger appropriate autosave
  useEffect(() => {
    const subscription = form.watch((data, { name }) => {
      // Remove the isDirty check as it may not work properly with Select components
      if (!name) return;

      // Skip auto-save if this is the initial form load
      // We'll use a simple check: if we have orderData but no user interaction yet
      if (
        orderData?.order &&
        !form.formState.isDirty &&
        !form.formState.dirtyFields[name as keyof OrderFormData]
      ) {
        return;
      }

      // Validate that we have required data before auto-saving
      const hasRequiredContactData = data.contactMethodId && data.contactValue;

      // Determine which entity to save based on the changed field
      if (name === 'contactMethodId' || name === 'contactValue') {
        // Contact method changes - save user only (and update order timestamp)
        if (hasRequiredContactData) {
          debouncedAutoSave(data as OrderFormData, 'user');
        }
      } else if (name === 'firstName' || name === 'lastName') {
        // Name changes - save both user and client (and update order timestamp)
        debouncedAutoSave(data as OrderFormData, 'both');
      } else if (name === 'citizenshipId' || name === 'passportExpirationDate') {
        // Client-specific changes - save client only (and update order timestamp)
        debouncedAutoSave(data as OrderFormData, 'client');
      }
    });

    return () => {
      subscription.unsubscribe();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form, orderData, debouncedAutoSave]);

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
  const citizenships = citizenshipsData?.citizenships || [];

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

  const order = orderData.order as any;

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
                  {(order.user.lastName || order.user.firstName) && (
                    <div className="flex items-center gap-2">
                      {order.user.firstName} {order.user.lastName}
                    </div>
                  )}
                </Badge>
                <span className="text-muted-foreground text-sm">{calculateTotalAmount(order)}</span>
              </CardTitle>
              <CardContent className="p-0">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div>
                      <Label className="text-sm mb-2">Contact</Label>
                      <div className="flex gap-4">
                        <FormField
                          control={form.control}
                          name="contactMethodId"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  key={`contact-method-${(orderData?.order as any)?.user?.id}-${field.value}`}
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

                    {/* Client Information */}
                    <div className="flex gap-4">
                      <FormField
                        control={form.control}
                        name="citizenshipId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Citizenship</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={value => {
                                  field.onChange(value);
                                  // Manually trigger dirty state and autosave
                                  setTimeout(() => {
                                    const currentData = form.getValues();
                                    debouncedAutoSave(currentData as OrderFormData, 'client');
                                  }, 100);
                                }}
                                value={field.value}
                                defaultValue={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select citizenship" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No citizenship</SelectItem>
                                  {citizenships.map(citizenship => (
                                    <SelectItem key={citizenship.id} value={citizenship.id}>
                                      {citizenship.emoji} {citizenship.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="passportExpirationDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Passport expiration date</FormLabel>
                            <FormControl>
                              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="secondary"
                                    className={cn(
                                      'w-full justify-start text-left font-normal bg-[#171717] border-[#3F3F46] hover:bg-[#171717] hover:border-ring focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                                      !passportDate && 'text-muted-foreground'
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {passportDate ? (
                                      format(passportDate, 'PPP')
                                    ) : (
                                      <span>Pick passport expiration date</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={passportDate || undefined}
                                    onSelect={date => {
                                      setPassportDate(date || null);
                                      field.onChange(date);
                                      setIsCalendarOpen(false);

                                      // Manually trigger dirty state and autosave
                                      setTimeout(() => {
                                        console.log();
                                        const currentData = form.getValues();
                                        debouncedAutoSave(currentData as OrderFormData, 'client');
                                      }, 100);
                                    }}
                                    captionLayout="dropdown"
                                    fromYear={new Date().getFullYear()}
                                    toYear={2100}
                                  />
                                </PopoverContent>
                              </Popover>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <hr className="my-6" />

                    {/* Full Name */}
                    <div>
                      <Label className="text-sm mb-2">Full name</Label>
                      <div className="flex gap-4">
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

                    <VisaSection
                      refetchOrder={refetchOrder}
                      orderData={orderData}
                      primaryClientData={primaryClientData}
                      setErrorMessage={setErrorMessage}
                      updateOrderMutation={updateOrderMutation}
                      setLastSavedTime={setLastSavedTime}
                      setSaveStatus={setSaveStatus}
                    />

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
                          <Button disabled variant="accent" size="sm">
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
