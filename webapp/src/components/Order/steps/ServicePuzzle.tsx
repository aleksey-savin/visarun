import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getAllOrdersRoute } from '@/lib/routes';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import AddVisarun from '@/components/Order/sections/VisarunSection/AddVisarun';
import AddVisa from '@/components/Order/sections/VisaSection/AddVisa';

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

import { Client } from '@/types/Client.js';

import { trpc } from '@/lib/trpc';

import useOrderStore from '@/stores/order/order-store.js';

const ServicePuzzle = ({
  client,
  servicePuzzleIsActive,
}: {
  client: Client;
  servicePuzzleIsActive: boolean;
}) => {
  const navigate = useNavigate();
  const { contactMethods, user, order } = useOrderStore();

  const [activeService, setActiveService] = useState('visa');

  const isDisabled = !client.citizenshipId || !client.passportExpirationDate;

  const handleServiceButtonClick = (service: string) => {
    setActiveService(service);
  };

  const deleteOrderMutation = trpc.order.delete.useMutation();
  const deleteUserMutation = trpc.user.delete.useMutation();

  const handleDeleteOrder = async () => {
    await deleteOrderMutation.mutateAsync({
      id: order?.id || '',
    });

    await deleteUserMutation.mutateAsync({
      id: user?.id || '',
    });

    navigate(getAllOrdersRoute());
  };

  return (
    <>
      {servicePuzzleIsActive && (
        <>
          {activeService === 'visa' && <AddVisa client={client} />}
          {activeService === 'visarun' && <AddVisarun />}
        </>
      )}
      <div className="flex justify-end mt-6 gap-2">
        {(!contactMethods || !contactMethods[0]?.method?.id || !contactMethods[0]?.value) && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="secondary">Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Order</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this order? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button variant="destructive" onClick={handleDeleteOrder}>
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button type="button" disabled={!servicePuzzleIsActive}>
          Confirm
        </Button>
      </div>
      <Card className="mt-6 p-0 bg-muted border-none">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">Service puzzle</div>
            <Card className="flex items-center gap-1 p-1 bg-secondary rounded-md border-none">
              <div className="flex gap-2">
                <Button
                  disabled={isDisabled}
                  variant={activeService === 'visa' ? 'accent' : 'secondary'}
                  size="sm"
                  className="border-none"
                  onClick={() => handleServiceButtonClick('visa')}
                >
                  Visa
                </Button>
                <Button
                  disabled={isDisabled}
                  variant={activeService === 'visarun' ? 'accent' : 'secondary'}
                  size="sm"
                  className="border-none"
                  onClick={() => handleServiceButtonClick('visarun')}
                >
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
    </>
  );
};

export default ServicePuzzle;
