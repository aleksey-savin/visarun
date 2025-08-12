import { UserPlus } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

import useOrderStore from '@/stores/order/order-store';

import { trpc } from '@/lib/trpc';

const AddClientCard = () => {
  const { user, clients, setClients, setSaveStatus } = useOrderStore();

  const createClientMutation = trpc.client.create.useMutation();

  const handleAddClient = async () => {
    setSaveStatus('saving');
    const newClientData = await createClientMutation.mutateAsync({
      userId: user?.id,
      firstName: '',
      lastName: '',
    });
    setClients([
      ...clients,
      {
        id: newClientData.client.id,
        userId: newClientData.client.userId,
        isPrimary: false,
      },
    ]);
    setSaveStatus('saved');
  };

  return (
    <Card className=" bg-secondary mr-2.5 p-6 mt-6">
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
