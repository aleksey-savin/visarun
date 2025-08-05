import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
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
import { Puzzle, Copy, Crown, CalendarIcon, AlertTriangle, Check, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getAllOrdersRoute, type EditOrderRouteParams } from '@/lib/routes';

import { trpc } from '@/lib/trpc';
import { useQueryClient } from '@tanstack/react-query';

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
  const [optimisticPrimaryClientData, setOptimisticPrimaryClientData] = useState<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const primaryClientDataRef = useRef<any>(null);

  // Query client for cache invalidation
  const queryClient = useQueryClient();

  // Helper function to check if passport expires within 6 months
  const isPassportExpiringWithin6Months = (expirationDate: Date | null) => {
    if (!expirationDate) return false;
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    return expirationDate <= sixMonthsFromNow;
  };

  // Type for order item updates
  interface OrderItemUpdate {
    visaTypeId?: string;
    basePrice?: number;
    finalPrice?: number;
  }

  // Optimistic order state for immediate UI updates
  const [optimisticOrder, setOptimisticOrder] = useState<any>(null);
  const pendingOperations = useRef<Set<string>>(new Set());
  const [isCopied, setIsCopied] = useState(false);

  // Helper function to calculate total amount from order items
  const calculateTotalAmount = (order: any) => {
    if (!order?.items || order.items.length === 0) {
      return formatCurrency(0, 'VND');
    }
    const total = order.items.reduce((sum: number, item: any) => sum + (item.finalPrice || 0), 0);
    return formatCurrency(total, 'VND');
  };

  // Function to update order item optimistically
  const updateOptimisticOrderItem = useCallback((orderItemId: string, updates: OrderItemUpdate) => {
    setOptimisticOrder((prevOrder: any) => {
      if (!prevOrder?.items) return prevOrder;

      const updatedItems = prevOrder.items.map((item: any) => {
        if (item.id === orderItemId) {
          return { ...item, ...updates };
        }
        return item;
      });

      return { ...prevOrder, items: updatedItems };
    });
  }, []);

  // Function to add order item optimistically
  const addOptimisticOrderItem = useCallback((newOrderItem: any) => {
    setOptimisticOrder((prevOrder: any) => {
      if (!prevOrder) return prevOrder;

      const existingItems = prevOrder.items || [];
      return {
        ...prevOrder,
        items: [...existingItems, newOrderItem],
      };
    });

    // Track pending operation if it's a temporary item
    if (newOrderItem.id && newOrderItem.id.startsWith('temp-')) {
      pendingOperations.current.add(newOrderItem.id);
    }
  }, []);

  // Function to remove order item optimistically
  const removeOptimisticOrderItem = useCallback((orderItemId: string) => {
    setOptimisticOrder((prevOrder: any) => {
      if (!prevOrder?.items) return prevOrder;

      const filteredItems = prevOrder.items.filter((item: any) => item.id !== orderItemId);
      return { ...prevOrder, items: filteredItems };
    });

    // Remove from pending operations if it was a temporary item
    if (orderItemId && orderItemId.startsWith('temp-')) {
      pendingOperations.current.delete(orderItemId);
    }
  }, []);

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

  // Watch form values for citizenship and passport date changes
  const watchedValues = form.watch([
    'citizenshipId',
    'passportExpirationDate',
    'firstName',
    'lastName',
  ]);
  const [citizenshipId, passportExpirationDate, firstName, lastName] = watchedValues;

  // Helper function to check if visa section should be shown
  const shouldShowVisaSection = () => {
    const hasCitizenship = citizenshipId && citizenshipId !== 'none';
    const passportNotExpiringSoon =
      passportExpirationDate && !isPassportExpiringWithin6Months(passportExpirationDate);
    return hasCitizenship && passportNotExpiringSoon;
  };

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

  // Fetch citizenships from database
  const { data: citizenshipsData } = trpc.citizenship.getAll.useQuery({});

  // Fetch countries from database
  const { data: countriesData } = trpc.country.getAll.useQuery();

  // Fetch visa applications for this order
  const { data: visaApplicationsData } = trpc.visaApplication.getByOrderId.useQuery(
    { orderId: orderData?.order?.id || '' },
    { enabled: !!orderData?.order?.id }
  );

  // Fetch primary client for the user
  const { data: primaryClientDataQuery } = trpc.client.getByUserId.useQuery(
    { userId: (orderData?.order as any)?.user?.id || '' },
    { enabled: !!(orderData?.order as any)?.user?.id }
  );

  // Use optimistic data if available, otherwise use query data
  const primaryClientData = optimisticPrimaryClientData || primaryClientDataQuery;

  // Update ref when data changes
  primaryClientDataRef.current = primaryClientData;

  // Mutations
  const updateClientMutation = trpc.client.edit.useMutation({
    onError: () => {},
  });
  const updateUserMutation = trpc.user.edit.useMutation();
  const updateContactMethodMutation = trpc.userContactMethod.edit.useMutation();
  const createContactMethodMutation = trpc.userContactMethod.create.useMutation();

  const updateOrderMutation = trpc.order.edit.useMutation({});

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
      console.log('AutoSave called:', { citizenshipId: data.citizenshipId, saveType });
      const currentOrderData = orderData?.order;
      const currentPrimaryClientData = primaryClientDataRef.current;

      if (isSaving || !currentOrderData) {
        console.log('AutoSave blocked:', { isSaving, hasOrder: !!currentOrderData });
        return;
      }

      setIsSaving(true);
      setSaveStatus('saving');
      setErrorMessage(null);

      try {
        const order = currentOrderData as any;
        const user = order.user;
        // Use ref to get current primary client data
        const primaryClient = currentPrimaryClientData?.client;
        const clientId = primaryClient?.id;
        console.log('AutoSave - primaryClient:', primaryClient, 'clientId:', clientId);

        if (!clientId && (saveType === 'client' || saveType === 'both')) {
          console.error('No client ID found for client update');
          throw new Error('Client ID is required for client update');
        }

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

        // If citizenship was updated, invalidate primary client data to update blacklist state
        if (saveType === 'client' || saveType === 'both') {
          // Invalidate and refetch query data
          await queryClient.invalidateQueries({
            queryKey: ['client', 'getByUserId', { userId: user.id }],
          });
        }

        // Optimistically update the last saved time without refetching
        setLastSavedTime(new Date());
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
        setErrorMessage('Failed to auto-save. Please try again.');

        // Reset optimistic data only on client save errors
        if (saveType === 'client' || saveType === 'both') {
          setOptimisticPrimaryClientData(primaryClientDataQuery);
        }
      } finally {
        setIsSaving(false);
      }
    },
    [
      isSaving,
      updateUserMutation,
      updateClientMutation,
      updateContactMethodMutation,
      createContactMethodMutation,
      updateOrderMutation,
      queryClient,
    ]
  );

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

  // Initialize optimistic data when query data loads for the first time
  useEffect(() => {
    if (primaryClientDataQuery && !optimisticPrimaryClientData) {
      setOptimisticPrimaryClientData(primaryClientDataQuery);
    }
  }, [primaryClientDataQuery, optimisticPrimaryClientData]);

  // Initialize and sync optimistic order when order data loads or changes
  useEffect(() => {
    if (orderData?.order) {
      setOptimisticOrder((prevOptimistic: any) => {
        // If no optimistic state yet, use the real data
        if (!prevOptimistic) {
          return orderData.order;
        }

        // If we have pending operations, preserve optimistic state
        if (pendingOperations.current.size > 0) {
          return prevOptimistic;
        }

        // Otherwise, sync with real data
        return orderData.order;
      });
    }
  }, [orderData?.order]);

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

  // Watch form values and trigger appropriate autosave (excluding citizenship)
  useEffect(() => {
    const subscription = form.watch((data, { name }) => {
      // Skip citizenship changes - they are handled manually
      if (name === 'citizenshipId') return;

      if (!name) return;

      // Skip auto-save if this is the initial form load
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
      } else if (name === 'passportExpirationDate') {
        // Passport date changes - save client only (and update order timestamp)
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

  const PrimaryClientBadge = ({ client }: { client: any }) => {
    // Use form state for optimistic updates, fallback to client data
    const displayFirstName = firstName || client.firstName;
    const displayLastName = lastName || client.lastName;

    return (
      <Badge variant="primary">
        <Crown />
        {(displayLastName || displayFirstName) && (
          <div className="flex items-center gap-2">
            {displayFirstName} {displayLastName}
          </div>
        )}
      </Badge>
    );
  };

  return (
    <>
      <CardTitle className="sticky top-0 z-10 bg-background border-b flex py-1.5 px-6 justify-between gap-2 items-center h-[45px]">
        <div className="flex gap-3 items-center text-sm min-h-[45px]">
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
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
          </span>
        </div>
      </CardTitle>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-7">
            <Card className="p-6 bg-secondary">
              <CardTitle className="flex items-center justify-between gap-2 text-lg">
                <PrimaryClientBadge client={order.user} />
                <span className="text-muted-foreground text-sm">
                  {calculateTotalAmount(optimisticOrder || order)}
                </span>
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

                                  // Optimistic update for primaryClientData
                                  if (primaryClientDataQuery?.client) {
                                    const updatedData = {
                                      ...primaryClientDataQuery,
                                      client: {
                                        ...primaryClientDataQuery.client,
                                        citizenshipId: value === 'none' ? null : value,
                                      },
                                    };
                                    setOptimisticPrimaryClientData(updatedData);

                                    // Trigger autosave directly
                                    const currentData = form.getValues();
                                    currentData.citizenshipId = value;

                                    // Call autoSave directly to avoid debounce issues
                                    console.log('About to call autoSave with:', currentData);
                                    setTimeout(() => {
                                      autoSave(currentData as OrderFormData, 'client');
                                    }, 100);
                                  }
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

                                      // Use regular form.watch for passport date changes
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

                    {shouldShowVisaSection() ? (
                      <VisaSection
                        orderData={orderData}
                        primaryClientData={primaryClientData}
                        setErrorMessage={setErrorMessage}
                        updateOrderMutation={updateOrderMutation}
                        setLastSavedTime={setLastSavedTime}
                        setSaveStatus={setSaveStatus}
                        updateOptimisticOrderItem={updateOptimisticOrderItem}
                        addOptimisticOrderItem={addOptimisticOrderItem}
                        removeOptimisticOrderItem={removeOptimisticOrderItem}
                      />
                    ) : (
                      <Alert className="bg-yellow-50 border-yellow-200">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                          {!citizenshipId || citizenshipId === 'none'
                            ? 'Please select a citizenship to add services.'
                            : passportExpirationDate &&
                                isPassportExpiringWithin6Months(passportExpirationDate || null)
                              ? 'Passport expires within 6 months. Client should renew their passport before applying for services.'
                              : 'Please set passport expiration date to add services.'}
                        </AlertDescription>
                      </Alert>
                    )}

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
                            disabled={
                              !citizenshipId ||
                              citizenshipId === 'none' ||
                              (passportExpirationDate
                                ? isPassportExpiringWithin6Months(passportExpirationDate)
                                : false)
                            }
                            variant="accent"
                            size="sm"
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
          <div className="grid space-y-4 sticky top-[69px] self-start lg:col-span-3">
            <span className="text-sm font-semibold">Summary</span>
            <PrimaryClientBadge client={order.user} />
            <Card className="p-3 bg-secondary">
              <CardContent className="space-y-4 p-0">
                {(() => {
                  const currentOrder = optimisticOrder || order;
                  const visaItems =
                    currentOrder?.items?.filter((item: any) => item.serviceType === 'visa') || [];

                  const generateSummaryText = () => {
                    const primaryClient = optimisticPrimaryClientData || primaryClientData?.client;
                    const clientName = primaryClient
                      ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() ||
                        'Client'
                      : 'Client';
                    const total = calculateTotalAmount(currentOrder);
                    const currentDate = new Date().toLocaleDateString('en-GB');

                    let summary = `VISA SERVICE ORDER\n`;
                    summary += `Date: ${currentDate}\n`;
                    summary += `Client: ${clientName}\n`;

                    if (visaItems.length > 0) {
                      summary += `SERVICES:\n`;
                      summary += `${'='.repeat(50)}\n`;

                      visaItems.forEach((item: any, index: number) => {
                        const country = countriesData?.countries?.find(
                          (c: any) => c.id === item.serviceTypeId
                        );
                        const countryName = country?.name || 'Unknown Country';
                        const amount = formatCurrency(item.finalPrice || 0, 'VND');

                        // Check if it's multi-entry from visa application data
                        const visaApp = visaApplicationsData?.visaApplications?.find(
                          (app: any) => app.countryId === item.serviceTypeId
                        );
                        const isMulti =
                          (visaApp as any)?.isMultientry ||
                          item.note?.toLowerCase().includes('multi') ||
                          item.finalPrice > (item.basePrice || 0);
                        const multiType = isMulti ? ' (Multi-Entry)' : ' (Single-Entry)';

                        // Get visa type name and entry date
                        const visaTypeName = visaApp?.visaType?.name || 'Standard';
                        const entryDate = visaApp?.plannedCountryEntryDate
                          ? new Date(visaApp.plannedCountryEntryDate).toLocaleDateString('en-GB')
                          : 'Not specified';

                        summary += `${index + 1}. Visa Service - ${countryName}\n`;
                        summary += `   Type: ${visaTypeName}${multiType}\n`;
                        summary += `   Entry Date: ${entryDate}\n`;
                        summary += `   Amount: ${amount}\n\n`;
                      });

                      summary += `${'='.repeat(50)}\n`;
                    } else {
                      summary += `No services added yet\n\n`;
                    }

                    summary += `TOTAL AMOUNT: ${total}\n`;
                    summary += `\nThank you for choosing our visa services.`;
                    return summary;
                  };

                  const copyToClipboard = async () => {
                    try {
                      await navigator.clipboard.writeText(generateSummaryText());
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    } catch (err) {
                      console.error('Failed to copy to clipboard:', err);
                    }
                  };

                  return (
                    <>
                      {visaItems.length > 0 ? (
                        <div className="space-y-2 text-sm">
                          {visaItems.map((item: any, index: number) => {
                            const country = countriesData?.countries?.find(
                              (c: any) => c.id === item.serviceTypeId
                            );
                            const countryName = country?.name || 'Unknown Country';
                            const amount = formatCurrency(item.finalPrice || 0, 'VND');

                            // Check if it's multi-entry from visa application data
                            const visaApp = visaApplicationsData?.visaApplications?.find(
                              (app: any) => app.countryId === item.serviceTypeId
                            );
                            const isMulti =
                              (visaApp as any)?.isMultientry ||
                              item.note?.toLowerCase().includes('multi') ||
                              item.finalPrice > (item.basePrice || 0);

                            // Get visa type name
                            const visaTypeName = visaApp?.visaType?.name || 'Standard';

                            return (
                              <div
                                key={item.id || index}
                                className="flex justify-between items-center"
                              >
                                <span className="text-muted-foreground flex items-center gap-1">
                                  Visa - {countryName} - {visaTypeName} {isMulti ? '- Multi' : ''}
                                </span>
                                <span className="font-medium">{amount}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No services added yet
                        </div>
                      )}

                      <hr />

                      <div className="text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Total:</span>
                          <span className="font-bold text-lg">
                            {calculateTotalAmount(currentOrder)}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        className={`w-full transition-all duration-300 ${
                          isCopied ? 'bg-green-500/10' : 'hover:bg-muted/50'
                        }`}
                        onClick={copyToClipboard}
                      >
                        {isCopied ? (
                          <Check className="w-4 h-4 animate-pulse" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        {isCopied ? 'Copied!' : 'Copy'}
                      </Button>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            <Button
              variant="secondary"
              className="flex border-none items-center justify-between text-sm"
            >
              <span>Next step</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </>
  );
};

export default EditOrderPage;
