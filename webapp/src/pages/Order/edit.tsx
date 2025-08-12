import { useState, useEffect, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useParams } from 'react-router-dom';

import { Card, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Puzzle, ArrowRight } from 'lucide-react';

import ClientSection from '@/components/Order/sections/ClientSection';

import useOrderStore from '@/stores/order/order-store';

import ServicePuzzle from '@/components/Order/steps/ServicePuzzle';
import SummarySection from '@/components/Order/sections/SummarySection';
import AddClientCard from '@/components/Order/AddClientCard';

const EditOrderPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: orderData } = trpc.order.getOne.useQuery({ id: id! }, { enabled: !!id });

  const {
    contactMethods,
    activeClientId,
    saveStatus,
    order,
    orderItems = [],
    clients,
    visaApplications = [],
    setOrder,
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
          createdAt: new Date(orderData.createdAt),
          updatedAt: new Date(orderData.updatedAt),
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
  ]);

  const servicePuzzleIsActive: boolean = useMemo(
    () =>
      !!(
        contactMethods?.length > 0 &&
        contactMethods[0]?.value &&
        clients.length > 0 &&
        clients?.find(c => c.isPrimary)?.citizenshipId &&
        clients?.find(c => c.isPrimary)?.passportExpirationDate
      ),
    [contactMethods, clients]
  );

  // Check if ServicePuzzle step can proceed
  const canProceedServicePuzzle = useMemo(() => {
    // Basic checks
    if (!servicePuzzleIsActive) return false;
    if (visaApplications.length === 0) return false;

    // Check if all visa applications have entry date and visa type
    const allHaveRequiredFields = visaApplications.every(
      va => va.plannedCountryEntryDate && va.visaType?.id
    );
    if (!allHaveRequiredFields) return false;

    // Check if any client is blacklisted for countries they're applying visas for
    const hasBlacklistedApplications = visaApplications.some(va => {
      // Find the client for this visa application through order items
      const orderItem = orderItems.find(item => item.id === va.orderItemId);
      if (!orderItem) return false;

      const client = clients.find(c => c.id === orderItem.clientId);
      if (!client?.citizenship?.blacklisted) return false;

      // Check if client's citizenship is blacklisted for this country
      return client.citizenship.blacklisted.some(bl => bl.countryId === va.country.id);
    });

    return !hasBlacklistedApplications;
  }, [servicePuzzleIsActive, visaApplications, orderItems, clients]);

  const steps = [
    {
      name: 'ServicePuzzle',
      canProceed: canProceedServicePuzzle,
      isCompleted: canProceedServicePuzzle,
    },
    { name: 'PersonalData', canProceed: false, isCompleted: false },
    { name: 'Payment', canProceed: false, isCompleted: false },
  ];

  const [activeStep, setActiveStep] = useState('ServicePuzzle');

  const handleNext = () => {
    setActiveStep(prev => steps.find(step => step.name === prev)?.name || 'ServicePuzzle');
  };

  const lastUpdated = new Date(order?.updatedAt || '');

  return (
    <>
      <CardTitle className="sticky top-0 z-10 bg-background border-b flex py-1.5 px-6 justify-between gap-2 items-center h-[45px]">
        <div className="flex gap-3 items-center text-sm min-h-[45px]">
          <Puzzle />
          {steps.map(step => (
            <div key={step.name} className="flex items-center gap-3">
              <span
                className={`${
                  step.name === activeStep
                    ? 'text-primary underline'
                    : step.isCompleted
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                }`}
              >
                {step.name}
              </span>
              {step.name !== 'Payment' && <span className="text-muted-foreground">▶</span>}
            </div>
          ))}
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
      </CardTitle>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-9">
            {clients
              ?.sort((a, b) => {
                // Primary client first
                if (a.isPrimary && !b.isPrimary) return -1;
                if (!a.isPrimary && b.isPrimary) return 1;

                // Then sort alphabetically by first name, then last name
                const aName = `${a.firstName || ''} ${a.lastName || ''}`.trim();
                const bName = `${b.firstName || ''} ${b.lastName || ''}`.trim();
                return aName.localeCompare(bName);
              })
              .map(client => {
                const totalAmount = orderItems?.reduce((acc, item) => {
                  if (item.clientId === client.id && item.finalPrice) {
                    return acc + item.finalPrice;
                  }
                  return acc;
                }, 0);
                return (
                  <Card className="bg-secondary mr-2.5 p-0 mt-6" key={client.id}>
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
            {activeClientId === '' && <AddClientCard />}
          </div>

          <div className="grid space-y-4 sticky top-[45px] self-start lg:col-span-3 pt-6 text-sm">
            <SummarySection />
            <Button
              variant="secondary"
              disabled={!canProceedServicePuzzle}
              onClick={handleNext}
              className="flex border-none w-full items-center justify-between text-sm"
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
