import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Plus } from 'lucide-react';

import { trpc } from '@/lib/trpc';

import useOrderStore from '@/stores/order/order-store';
import { Client } from '@/types/Client';

import VisaCard from './VisaCard';

const AddVisa = ({ client }: { client: Client }) => {
  const { order, orderItems, setOrderItems, setSaveStatus } = useOrderStore();
  const clientOrderItems = orderItems?.filter(item => item.client?.id === client.id) || [];

  const { data: countriesData } = trpc.country.getAll.useQuery();
  const countries = (
    countriesData?.countries?.filter(country => country.eVisaAvailable) || []
  ).sort((a, b) => {
    if (a.favourite && !b.favourite) return -1;
    if (!a.favourite && b.favourite) return 1;
    return a.name.localeCompare(b.name);
  });

  const createOrderItemMutation = trpc.orderItem.create.useMutation();

  const handleAddOrderItem = async (countryId: string) => {
    setSaveStatus('saving');

    const newData = await createOrderItemMutation.mutateAsync({
      orderId: order.id || '',
      countryId,
      clientId: client.id,
      serviceType: 'visa',
      basePrice: 0,
      finalPrice: 0,
    });

    setOrderItems([
      ...orderItems,
      { ...newData.orderItem, visaApplication: newData.visaApplication },
    ]);

    setSaveStatus('saved');
  };

  return (
    <Card className="border-none p-4">
      <div>Add Visa</div>
      {clientOrderItems?.map((item, index) => <VisaCard item={item} key={index} />)}
      <div className="flex justify-start gap-3">
        {countries
          .filter(
            country =>
              !clientOrderItems.some(item => item.visaApplication?.country?.id === country.id)
          )
          .map(country => (
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleAddOrderItem(country.id)}
              key={country.id}
            >
              <Plus /> {country.name}
            </Button>
          ))}
      </div>
    </Card>
  );
};

export default AddVisa;
