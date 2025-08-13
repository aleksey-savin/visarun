import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { Plus } from 'lucide-react';

import { trpc } from '@/lib/trpc';

import useOrderStore, { type StoreClient } from '@/stores/order/order-store';

import VisaCard from './VisaCard';

import { AlertTriangle, CircleAlert } from 'lucide-react';

import { isPassportExpiringWithin6Months } from '@/utils/passportExpirationDate';

import { StoreVisaApplication } from '@/stores/order/order-store';

const AddVisa = ({ client }: { client: StoreClient }) => {
  const { order, orderItems, visaApplications, setOrderItems, setVisaApplications, setSaveStatus } =
    useOrderStore();
  const clientOrderItems = (orderItems?.filter(item => item.clientId === client.id) || []).sort(
    (a, b) => b.id.localeCompare(a.id)
  );
  const clientVisaApplications =
    visaApplications?.filter(va => clientOrderItems.some(item => item.id === va.orderItemId)) || [];

  const { data: countriesData } = trpc.country.getAll.useQuery();
  const countries = (
    countriesData?.countries?.filter(country => country.eVisaAvailable) || []
  ).sort((a, b) => {
    if (a.favourite && !b.favourite) return -1;
    if (!a.favourite && b.favourite) return 1;
    return a.name.localeCompare(b.name);
  });

  const isCountryBlacklisted = (countryId: string): boolean => {
    return (
      client?.citizenship?.blacklisted?.some(
        blacklistedEntry => blacklistedEntry.countryId === countryId
      ) || false
    );
  };

  const createOrderItemMutation = trpc.orderItem.create.useMutation();

  const handleAddOrderItem = async (countryId: string) => {
    if (isCountryBlacklisted(countryId)) {
      return;
    }

    setSaveStatus('saving');

    const newData = await createOrderItemMutation.mutateAsync({
      orderId: order.id || '',
      countryId,
      clientId: client.id,
      serviceType: 'visa',
      basePrice: 0,
      finalPrice: 0,
    });

    if (!newData.orderItem) {
      console.error('Order item was not created');
      setSaveStatus('error');
      return;
    }

    setOrderItems([
      ...orderItems,
      {
        ...newData.orderItem,
        createdAt: new Date(newData.orderItem.createdAt),
        updatedAt: new Date(newData.orderItem.updatedAt),
      },
    ]);

    // Add proper null check
    if (!newData.visaApplication) {
      console.error('Visa application was not created');
      setSaveStatus('error');
      return;
    }

    setVisaApplications([
      ...visaApplications,
      {
        ...newData.visaApplication,
        id: newData.visaApplication.id,
        orderItemId: newData.visaApplication.orderItemId,
        status: newData.visaApplication.status,
        clientVisas: [],
      } as StoreVisaApplication,
    ]);

    setSaveStatus('saved');
  };

  const passportExpires = isPassportExpiringWithin6Months(
    client.passportExpirationDate ? client.passportExpirationDate.toISOString() : ''
  );

  return (
    <>
      {passportExpires && (
        <Card className="text-sm p-3 bg-secondary text-[#FAFAFA]">
          <div className="flex gap-3 items-center">
            <AlertTriangle className="text-destructive" />
            <span>
              {!client.citizenship?.id
                ? 'Please select a citizenship to add services.'
                : client.passportExpirationDate && passportExpires
                  ? 'Passport expires within 6 months. Client should renew their passport before applying for services.'
                  : 'Please set passport expiration date to add services.'}
            </span>
          </div>
        </Card>
      )}
      {!passportExpires && (
        <Card className="border-none p-4">
          <div>Add Visa</div>
          {clientOrderItems
            ?.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map((item, index) => <VisaCard item={item} key={index} />)}
          <div className="flex justify-start gap-3">
            {countries
              .filter(
                country => !clientVisaApplications.some(item => item.country?.id === country.id)
              )
              .map(country => {
                const isBlacklisted = isCountryBlacklisted(country.id);
                return (
                  <div key={country.id}>
                    {!isBlacklisted && (
                      <Button
                        size="sm"
                        variant={'primary'}
                        onClick={() => handleAddOrderItem(country.id)}
                      >
                        <Plus /> {country.name}
                      </Button>
                    )}
                    {isBlacklisted && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="bg-secondary border-transparent hover:bg-secondary text-muted-foreground hover:text-muted-foreground"
                          >
                            <Plus /> {country.name} <CircleAlert />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Citizenship is blacklisted for this country</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                );
              })}
          </div>
        </Card>
      )}
    </>
  );
};

export default AddVisa;
