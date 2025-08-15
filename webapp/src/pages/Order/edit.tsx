import { useState, useEffect, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useParams } from 'react-router-dom';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Puzzle, ArrowRight, CheckCircleIcon } from 'lucide-react';

import ClientSection from '@/components/Order/sections/ClientSection';

import useOrderStore from '@/stores/order/order-store';

import ServicePuzzle from '@/components/Order/steps/ServicePuzzle';
import SummarySection from '@/components/Order/sections/SummarySection';
import AddClientCard from '@/components/Order/AddClientCard';
import OrderSummary from '@/components/Order/sections/SummarySection/OrderSummary';

import { clientHasErrors } from '@/utils/clientHasErrors';

import { isPassportExpiringWithin6Months } from '@/utils/passportExpirationDate';
import PersonalData from '@/components/Order/steps/PersonalData';

// Define the restricted status types that can be used in step navigation
type StepStatus = 'draft' | 'personal_data_verification' | 'payment_pending';

const EditOrderPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: orderData } = trpc.order.getOne.useQuery({ id: id! }, { enabled: !!id });
  const { data: allClientsData } = trpc.client.getAllByUserId.useQuery({
    userId: orderData?.userId || '',
  });

  const notIncludedClients = allClientsData?.clients?.map(client => ({
    ...client,
    firstName: client.firstName ?? undefined,
    lastName: client.lastName ?? undefined,
    passportExpirationDate: client.passportExpirationDate
      ? new Date(client.passportExpirationDate)
      : undefined,
    isOutsideTheCountryAt: client.isOutsideTheCountryAt
      ? new Date(client.isOutsideTheCountryAt)
      : undefined,
    citizenship: client.citizenship
      ? {
          id: client.citizenship.id,
          name: client.citizenship.name,
          abbreviation: client.citizenship.abbreviation,
          favourite: false,
          emoji: '',
          blacklisted: client.citizenship.blacklisted || [],
          visaFree: client.citizenship.visaFree || [],
          surcharges: client.citizenship.surcharges || [],
        }
      : undefined,
  }));

  const {
    contactMethods,
    activeClientId,
    setActiveClientId,
    saveStatus,
    order,
    orderItems = [],
    clients,
    visaApplications = [],
    setOrder,
    updateOrderStatus,
    setUser,
    setClients,
    setContactMethods,
    setOrderItems,
    setVisaApplications,
    setActiveServicePuzzleSection,
  } = useOrderStore();

  useEffect(() => {
    if (!orderData) return;
    setOrder({
      id: orderData.id,
      userId: orderData.userId,
      status: orderData.status,
      createdAt: new Date(orderData.createdAt),
      updatedAt: new Date(orderData.updatedAt),
      comment: orderData.comment || '',
    });

    if (orderData.user) {
      const { user } = orderData;
      setUser({
        id: user.id,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        updatedAt: new Date(user.updatedAt),
      });
    }

    if (orderData.clients) {
      if (orderData.user?.contactMethods.length === 0) {
        setActiveClientId(orderData?.clients[0]?.id);
      }

      setClients(
        orderData.clients.map(client => ({
          ...client,
          firstName: client.firstName ?? undefined,
          lastName: client.lastName ?? undefined,
          passportExpirationDate: client.passportExpirationDate
            ? new Date(client.passportExpirationDate)
            : undefined,
          isOutsideTheCountryAt: client.isOutsideTheCountryAt
            ? new Date(client.isOutsideTheCountryAt)
            : undefined,
          citizenship: client.citizenship
            ? {
                id: client.citizenship.id,
                name: client.citizenship.name,
                abbreviation: client.citizenship.abbreviation,
                favourite: false,
                emoji: '',
                blacklisted: client.citizenship.blacklisted || [],
                visaFree: client.citizenship.visaFree || [],
                surcharges: client.citizenship.surcharges || [],
              }
            : undefined,
        }))
      );
    }

    if (orderData.user?.contactMethods) {
      setContactMethods(
        orderData.user.contactMethods.map(m => ({
          id: m.id,
          userId: orderData.user!.id,
          value: m.value,
          url: m.url,
          createdAt: new Date(),
          updatedAt: new Date(),
          method: m.method
            ? {
                id: m.method.id,
                name: m.method.name,
                icon: m.method.icon,
                description: m.method.description,
              }
            : null,
        }))
      );
    }

    if (orderData.items) {
      setOrderItems(
        orderData.items.map(i => ({
          id: i.id,
          orderId: i.orderId,
          clientId: i.clientId,
          serviceType: i.serviceType,
          serviceTypeId: i.serviceTypeId,
          discountAppliedType: i.discountAppliedType || null,
          discountRuleId: i.discountRuleId || null,
          discountAmount: i.discountAmount || 0,
          discountComment: i.discountComment || null,
          note: i.note || null,
          basePrice: i.basePrice,
          finalPrice: i.finalPrice,
          createdAt: new Date(i.createdAt),
          updatedAt: new Date(i.updatedAt),
        }))
      );
    }

    if (orderData.visaApplications) {
      const { visaApplications } = orderData;
      setVisaApplications(
        visaApplications.map(i => ({
          id: i.id,
          orderItemId: i.orderItemId,
          applicationCode: i.applicationCode,
          submittedByAgent: i.submittedByAgent,
          country: {
            id: i.country?.id,
            name: i.country?.name,
          },
          visaType: {
            id: i.visaType?.id,
            name: i.visaType?.name,
            serviceCost: i.visaType?.serviceCost ?? undefined,
            isMultientry: i.visaType?.isMultientry,
            multientryExtraCost: i.visaType?.multientryExtraCost ?? undefined,
            processingMode: i.visaType?.processingMode,
            processingUnit: i.visaType?.processingUnit,
            processingValueFixed: i.visaType?.processingValueFixed ?? undefined,
            processingValueMin: i.visaType?.processingValueMin ?? undefined,
            processingValueMax: i.visaType?.processingValueMax ?? undefined,
          },
          plannedCountryEntryDate: i.plannedCountryEntryDate
            ? new Date(i.plannedCountryEntryDate)
            : null,
          isMultientry: i.isMultientry,
          note: i.note,
          revisedActivationDate: i.revisedActivationDate ? new Date(i.revisedActivationDate) : null,
          statusNote: i.statusNote,
          status: i.status,
          clientVisas:
            i.clientVisas?.map(cv => ({
              id: cv.id,
              validFrom: new Date(cv.validFrom),
              validTo: new Date(cv.validTo),
              notifiedExpiry: cv.notifiedExpiry,
            })) || [],
        }))
      );
    }

    setActiveServicePuzzleSection('visa');
  }, [
    orderData,
    setContactMethods,
    setOrder,
    setOrderItems,
    setUser,
    setClients,
    setActiveServicePuzzleSection,
    setVisaApplications,
    setActiveClientId,
  ]);

  const clientsHaveErrors =
    clients.filter(
      client => Array.from(clientHasErrors(client, orderItems, visaApplications) || []).length > 0
    ).length > 0;

  const servicePuzzleIsActive: boolean = useMemo(() => {
    // Basic requirements
    const hasContactMethod = !!(contactMethods?.length > 0 && contactMethods[0]?.value);
    const hasClients = clients.length > 0;

    if (!hasContactMethod || !hasClients) return false;

    if (activeClientId) {
      // If there's an active client, check if that specific client has required data
      const activeClient = clients.find(c => c.id === activeClientId);
      if (
        isPassportExpiringWithin6Months(
          activeClient?.passportExpirationDate
            ? activeClient?.passportExpirationDate.toISOString()
            : ''
        )
      )
        return false;
      return !!(activeClient?.citizenship?.id && activeClient?.passportExpirationDate);
    }

    // Otherwise, check for any primary client with required data
    return !!(
      clients?.find(c => c.isPrimary)?.citizenship?.id &&
      clients?.find(c => c.isPrimary)?.passportExpirationDate
    );
  }, [contactMethods, clients, activeClientId]);

  const steps = useMemo(
    () => [
      {
        name: 'Service Puzzle',
        status: 'draft',
        canProceed: !clientsHaveErrors,
        isCompleted: !clientsHaveErrors,
      },
      {
        name: 'Personal Data',
        status: 'personal_data_verification',
        canProceed: false,
        isCompleted: false,
      },
      { name: 'Payment', status: 'payment_pending', canProceed: false, isCompleted: false },
    ],
    [clientsHaveErrors]
  );

  const [activeStep, setActiveStep] = useState(order.status === 'draft' ? steps[0] : steps[1]);

  useEffect(() => {
    setActiveStep(order.status === 'draft' ? steps[0] : steps[1]);
  }, [order, steps]);

  const editOrderMutation = trpc.order.edit.useMutation();

  const handleStepClick = async (clickedStep: (typeof steps)[0]) => {
    // Only allow navigation to completed steps or the next step
    const currentStepIndex = steps.findIndex(step => step.status === activeStep.status);
    const clickedStepIndex = steps.findIndex(step => step.status === clickedStep.status);

    // Allow clicking on current step, completed steps, or the immediate next step (if current can proceed)
    const canNavigate =
      clickedStepIndex <= currentStepIndex || // Current or previous steps
      (clickedStepIndex === currentStepIndex + 1 && activeStep.canProceed); // Next step if can proceed

    if (!canNavigate) return;

    try {
      setActiveStep(clickedStep);

      // Update order status in backend
      await editOrderMutation.mutateAsync({
        id: order.id,
        status: clickedStep.status as StepStatus,
      });

      // Update order status in store
      updateOrderStatus(clickedStep.status as StepStatus);
    } catch (error) {
      console.error('Failed to update order status:', error);
      // Revert on error
      setActiveStep(activeStep);
    }
  };

  const handleNext = async () => {
    if (activeStep.status === 'draft') {
      await handleStepClick(steps[1]);
    }
  };

  const lastUpdated = new Date(order?.updatedAt || '');

  return (
    <>
      <div className="sticky top-0 z-10 bg-background border-b flex  px-6 justify-between gap-2 items-center h-[45px]">
        <div className="flex gap-3 items-center text-sm min-h-[45px]">
          <Puzzle />
          {steps.map(step => {
            const currentStepIndex = steps.findIndex(s => s.status === activeStep.status);
            const stepIndex = steps.findIndex(s => s.status === step.status);
            const canNavigate =
              stepIndex <= currentStepIndex || // Current or previous steps
              (stepIndex === currentStepIndex + 1 && activeStep.canProceed); // Next step if can proceed

            return (
              <div key={step.status} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-0.5 ${
                    step.status === activeStep.status
                      ? 'text-primary underline'
                      : step.isCompleted
                        ? 'text-[#4ADE80]'
                        : 'text-muted-foreground'
                  } ${canNavigate ? 'cursor-pointer hover:text-primary' : 'cursor-not-allowed'}`}
                  onClick={() => canNavigate && handleStepClick(step)}
                >
                  {step.name}{' '}
                  {step.status !== activeStep.status && step.isCompleted && (
                    <CheckCircleIcon className="w-4 h-4 text-[#4ADE80]" />
                  )}
                </div>
                {step.name !== 'Payment' && (
                  <span className="text-muted-foreground">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {saveStatus === 'saving'
              ? 'Saving...'
              : saveStatus === 'saved' && lastUpdated
                ? `Saved at ${lastUpdated.toLocaleTimeString([], {
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
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-9">
            {clients
              ?.sort((a, b) => {
                // Primary client first
                if (a.isPrimary && !b.isPrimary) return -1;
                if (!a.isPrimary && b.isPrimary) return 1;
                return 1;
              })
              .map(client => {
                const totalAmount = orderItems?.reduce((acc, item) => {
                  if (item.clientId === client.id && item.finalPrice) {
                    return acc + item.finalPrice;
                  }
                  return acc;
                }, 0);
                return (
                  <Card className="bg-secondary mr-2.5 p-0 mb-2.5" key={client.id}>
                    <ClientSection totalAmount={totalAmount} client={client} />
                    {activeClientId === client.id && (
                      <div className="grid grid-col-1 gap-6 px-6 pb-5">
                        {activeStep.status === 'personal_data_verification' && <PersonalData />}
                        {activeStep.status === 'draft' && (
                          <ServicePuzzle
                            client={client}
                            servicePuzzleIsActive={servicePuzzleIsActive}
                          />
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            {activeClientId === '' && activeStep.status === 'draft' && <AddClientCard />}
            {activeClientId === '' && activeStep.status === 'draft' && (
              <>
                {notIncludedClients
                  ?.filter(
                    notIncludedClient => !clients.map(c => c.id).includes(notIncludedClient.id)
                  )
                  .map(client => {
                    const totalAmount = orderItems?.reduce((acc, item) => {
                      if (item.clientId === client.id && item.finalPrice) {
                        return acc + item.finalPrice;
                      }
                      return acc;
                    }, 0);
                    return (
                      <Card className="bg-secondary mr-2.5 p-0 mb-2.5" key={client.id}>
                        <ClientSection totalAmount={totalAmount} client={client} />
                        {activeClientId === client.id && (
                          <div className="grid grid-col-1 gap-6 px-6 pb-5">
                            <ServicePuzzle
                              client={client}
                              servicePuzzleIsActive={servicePuzzleIsActive}
                            />
                          </div>
                        )}
                      </Card>
                    );
                  })}
              </>
            )}
          </div>

          <div className="grid space-y-2 sticky top-[45px] self-start lg:col-span-3 text-sm">
            <SummarySection />
            <OrderSummary />
            <Button
              variant={!clientsHaveErrors && activeClientId === '' ? 'default' : 'secondary'}
              disabled={!clientsHaveErrors && activeClientId === '' ? false : true}
              onClick={handleNext}
              className="flex border-none w-full items-center justify-between text-sm"
            >
              <span>Next step</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditOrderPage;
