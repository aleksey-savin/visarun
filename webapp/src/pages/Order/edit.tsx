import { useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Puzzle, Crown } from 'lucide-react';
import { getAllOrdersRoute, type EditOrderRouteParams } from '@/lib/routes';

import { isPassportExpiringWithin6Months } from '@/stores';

import { trpc } from '@/lib/trpc';

import { Badge } from '@/components/ui/badge';
import {
  ContactSection,
  CitizenshipSection,
  ClientNameSection,
  VisaSection,
  SummarySection,
} from '@/components/Order/sections';

import {
  useOrderEditStore,
  useOrderFormStore,
  useAutoSave,
  orderSchema,
  type OrderFormData,
} from '@/stores';
import { useLoadOrderEditData } from '@/hooks/useOrderEditData';
import { formatCurrency } from '@/utils/currency.js';

const EditOrderPage = () => {
  const navigate = useNavigate();
  const { id } = useParams() as EditOrderRouteParams;

  // Zustand stores
  const {
    lastSavedTime,
    saveStatus,
    errorMessage,
    optimisticOrder,
    setIsSubmitting,
    setPassportDate,
    setOptimisticOrder,
  } = useOrderEditStore();

  const { setFormData } = useOrderFormStore();

  // Fetch order data
  const {
    data: orderData,
    isLoading: orderLoading,
    error: orderError,
  } = trpc.order.getOne.useQuery({ id });

  // Load all data into Zustand store
  const { isLoading: dataLoading } = useLoadOrderEditData(
    orderData?.order?.id,
    (orderData?.order as any)?.user?.id
  );

  // Get data from Zustand store
  const {
    countries: countriesData,
    citizenships: citizenshipsData,
    contactMethods: contactMethodsData,
    visaApplications: visaApplicationsData,
    optimisticPrimaryClientData,
    contactMethodsLoading: contactMethodsLoadingState,
  } = useOrderEditStore();

  // Use optimistic data if available
  const primaryClientData = optimisticPrimaryClientData;
  const contactMethodsLoading = contactMethodsLoadingState;
  const contactMethodsError = null; // Remove error handling for now since we're using Zustand

  // Mutations removed - VisaCard uses its own mutations

  // Auto-save hook
  const { performSave } = useAutoSave(orderData, primaryClientData, {
    delay: 1000,
    onError: error => {
      console.error('Auto-save failed:', error);
    },
  });

  // React Hook Form setup
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
  const watchedValues = form.watch(['citizenshipId', 'passportExpirationDate']);
  const [citizenshipId, passportExpirationDate] = watchedValues;

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

  // Initialize optimistic data when query data loads for the first time
  // This is now handled by useLoadOrderEditData hook

  // Initialize and sync optimistic order when order data loads or changes
  useEffect(() => {
    if (orderData?.order) {
      setOptimisticOrder(orderData.order);
    }
  }, [orderData?.order, setOptimisticOrder]);

  // Force re-render when optimistic order changes
  useEffect(() => {
    // This effect ensures the UI updates when optimistic order changes
    if (optimisticOrder) {
      // Force a re-render by triggering validation
      form.trigger();
    }
  }, [optimisticOrder, form]);

  // Populate form when order data loads
  useEffect(() => {
    if (orderData?.order && contactMethodsData && primaryClientData?.client) {
      const order = orderData.order as any;
      // Use optimistic data if available, otherwise use order data
      const user = optimisticPrimaryClientData?.client?.user || order.user;
      const primaryClient = primaryClientData.client;

      // Get the first contact method from user's contact methods
      const firstContactMethod = user.contactMethods?.[0];

      // Validate that the contact method exists in available options
      const contactMethodId = firstContactMethod?.method.id;
      const isValidContactMethod =
        contactMethodId && contactMethodsData.some((method: any) => method.id === contactMethodId);

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
            parsedDate = new Date(dateValue);
          }

          if (parsedDate && !isNaN(parsedDate.getTime())) {
            parsedPassportDate = parsedDate;
          }
        }

        form.setValue('passportExpirationDate', parsedPassportDate);
        setPassportDate(parsedPassportDate);

        const newFormData = {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          contactMethodId: isValidContactMethod ? contactMethodId : '',
          contactValue: firstContactMethod?.value || '',
          citizenshipId: primaryClient?.citizenshipId || 'none',
          passportExpirationDate: parsedPassportDate,
        };

        // Update Zustand form store
        setFormData(newFormData);

        // Reset form with all values at once
        form.reset(newFormData);
      }, 100);
    }
  }, [
    orderData,
    contactMethodsData,
    primaryClientData,
    optimisticPrimaryClientData,
    form,
    setFormData,
    setPassportDate,
  ]);

  // Helper function to trigger auto-save for specific field types
  const triggerAutoSave = useCallback(
    (data: OrderFormData, fieldType: 'user' | 'client' | 'both') => {
      if (orderData?.order) {
        performSave(data, fieldType);
      }
    },
    [orderData, performSave]
  );

  // Clean up on unmount - don't reset state to prevent loops
  useEffect(() => {
    return () => {
      // Cleanup will be handled by component unmount
    };
  }, []);

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

  const contactMethods = contactMethodsData || [];
  const citizenships = citizenshipsData || [];

  if (orderLoading || dataLoading) {
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
                <Badge variant="primary">
                  <Crown />
                  <div className="flex items-center gap-2">
                    {form.getValues('firstName') || order.user.firstName}{' '}
                    {form.getValues('lastName') || order.user.lastName}
                  </div>
                </Badge>
                <span className="text-muted-foreground text-sm">
                  {(() => {
                    const currentOrder = optimisticOrder || order;
                    const allItems = currentOrder?.items || [];

                    // Calculate total using finalPrice which includes surcharges
                    const total = allItems.reduce((sum: number, item: any) => {
                      // For visa items, check blacklist status
                      if (item.serviceType === 'visa') {
                        // Check if client is blacklisted for this country
                        const country = countriesData?.find(
                          (c: any) => c.id === item.serviceTypeId
                        );
                        const clientCitizenshipId = primaryClientData?.client?.citizenshipId;

                        const isBlacklisted =
                          country?.blacklisted?.some(
                            (entry: any) => entry.citizenshipId === clientCitizenshipId
                          ) || false;

                        // If client is blacklisted, price should be 0
                        if (isBlacklisted) {
                          return sum + 0;
                        }
                      }

                      // Use finalPrice which includes surcharges calculated by backend
                      return sum + (item.finalPrice || 0);
                    }, 0);

                    return formatCurrency(total, 'VND');
                  })()}
                </span>
              </CardTitle>
              <CardContent className="p-0">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <ContactSection
                      form={form}
                      contactMethods={contactMethods}
                      contactMethodsLoading={contactMethodsLoading}
                      contactMethodsError={contactMethodsError}
                      orderUserId={(orderData?.order as any)?.user?.id}
                      onAutoSave={triggerAutoSave}
                    />

                    <hr className="my-6" />

                    <CitizenshipSection
                      form={form}
                      citizenships={citizenships as any}
                      primaryClientDataQuery={primaryClientData}
                      autoSave={performSave}
                      onAutoSave={triggerAutoSave}
                    />

                    <hr className="my-6" />

                    <ClientNameSection form={form} onAutoSave={triggerAutoSave} />

                    <hr className="my-6" />

                    <VisaSection
                      citizenshipId={citizenshipId}
                      passportExpirationDate={passportExpirationDate}
                      orderData={orderData}
                      primaryClientData={primaryClientData}
                    />

                    {/* Action Buttons */}
                    <div className="flex justify-end">
                      <Button type="button">Confirm</Button>
                    </div>

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
                                    : true)
                                }
                                variant="accent"
                                size="sm"
                              >
                                Visa
                              </Button>
                              <Button
                                disabled
                                variant="secondary"
                                size="sm"
                                className="border-none"
                              >
                                Visarun
                              </Button>
                              <Button
                                disabled
                                variant="secondary"
                                size="sm"
                                className="border-none"
                              >
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
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <SummarySection
            order={order}
            primaryClientData={primaryClientData}
            countriesData={countriesData}
            visaApplicationsData={visaApplicationsData}
            firstName={form.getValues('firstName')}
            lastName={form.getValues('lastName')}
          />
        </div>
      </CardContent>
    </>
  );
};

export default EditOrderPage;
