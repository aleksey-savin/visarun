import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useParams } from 'react-router-dom';

import { Card, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Puzzle, ArrowRight } from 'lucide-react';

import ClientSection from '@/components/Order/sections/ClientSection';

import useOrderStore from '@/stores/order/order-store';

import ServicePuzzle from '@/components/Order/steps/ServicePuzzle';

const EditOrderPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: orderData } = trpc.order.getOne.useQuery({ id: id! }, { enabled: !!id });

  const {
    saveStatus,
    order,
    orderItems = [],
    clients,
    setOrder,
    setUser,
    setClients,
    setContactMethods,
    setOrderItems,
    setActiveServicePuzzleSection,
  } = useOrderStore();

  useEffect(() => {
    setOrder({
      id: orderData?.id,
      userId: orderData?.userId,
      status: orderData?.status,
      updatedAt: orderData?.updatedAt,
    });
    setUser({
      id: orderData?.user?.id,
      firstName: orderData?.user?.firstName,
      lastName: orderData?.user?.lastName,
    });
    setClients(orderData?.clients || []);
    setContactMethods(
      orderData?.user?.contactMethods.map(m => ({
        id: m.id,
        method: { id: m.method.id, name: m.method.name },
        url: m.url,
        value: m.value,
      })) || []
    );
    setOrderItems(
      orderData?.items?.map(i => ({
        id: i.id,
        orderId: i.orderId,
        serviceType: i.serviceType,
        serviceTypeId: i.serviceTypeId,
        client: {
          id: i.client?.id,
          firstName: i.client?.firstName,
          lastName: i.client?.lastName,
          citizenship: {
            id: i.client?.citizenship?.id,
            name: i.client?.citizenship?.name,
            abbreviation: i.client?.citizenship?.abbreviation,
            blacklisted: i.client?.citizenship?.blacklisted,
            visaFree: i.client?.citizenship?.visaFree,
            surcharges: i.client?.citizenship?.surcharges,
          },
        },
        basePrice: i.basePrice,
        finalPrice: i.finalPrice,
        visaApplication: i.visaApplication,
      })) || []
    );
    setActiveServicePuzzleSection('visa');
  }, [
    orderData,
    setContactMethods,
    setOrder,
    setOrderItems,
    setUser,
    setClients,
    setActiveServicePuzzleSection,
  ]);

  const steps = [
    { name: 'ServicePuzzle', isCompleted: false },
    { name: 'PersonalData', isCompleted: false },
    { name: 'Payment', isCompleted: false },
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
        <div className="grid grid-cols-1 lg:grid-cols-10">
          <div className="lg:col-span-7 gap-2.5">
            {clients
              ?.sort((a, b) => b.id.localeCompare(a.id))
              .map(client => {
                const totalAmount = orderItems?.reduce((acc, item) => {
                  if (item.client.id === client.id && item.finalPrice) {
                    return acc + item.finalPrice;
                  }
                  return acc;
                }, 0);
                return (
                  <Card className="bg-secondary mb-2.5 mr-2.5 p-0" key={client.id}>
                    <ClientSection totalAmount={totalAmount} client={client} />
                    <div className="p-6">
                      <ServicePuzzle client={client} />
                    </div>
                  </Card>
                );
              })}
          </div>
          <div className="grid space-y-4 sticky top-[69px] self-start lg:col-span-3">
            <Button
              variant="secondary"
              disabled={true}
              onClick={handleNext}
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
