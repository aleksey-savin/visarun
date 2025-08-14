import { UserPlus } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

import useOrderStore from '@/stores/order/order-store';

import { trpc } from '@/lib/trpc';

const AddClientCard = () => {
  const { user, order, clients, setClients, setSaveStatus, setActiveClientId } = useOrderStore();

  const createClientMutation = trpc.client.create.useMutation();
  const editOrderMutation = trpc.order.edit.useMutation();

  const handleAddClient = async () => {
    setSaveStatus('saving');
    const newClientData = await createClientMutation.mutateAsync({
      userId: user?.id,
      firstName: '',
      lastName: '',
    });

    await editOrderMutation.mutateAsync({
      id: order.id,
      clients: [...clients.map(c => c.id), newClientData.client.id],
    });

    setClients([
      ...clients,
      {
        id: newClientData.client.id,
        userId: newClientData.client.userId,
        isPrimary: false,
      },
    ]);
    setActiveClientId(newClientData.client.id);
    setSaveStatus('saved');
  };

  return (
    <Card className=" bg-secondary mr-2.5 p-6 my-2.5">
      <div className="flex justify-between items-center ">
        <span>Linked Client</span>
        <Button variant="secondary" onClick={handleAddClient}>
          Add <UserPlus />
        </Button>
      </div>
    </Card>
  );
};

export default AddClientCard;
