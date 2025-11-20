import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getAllOrdersRoute } from '@/lib/routes';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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

import { StoreClient } from '@/stores/order/order-store';

import { trpc } from '@/lib/trpc';

import useOrderStore from '@/stores/order/order-store.js';

import ClientName from '../sections/ClientSection/ClientName';
import Comments from '../Comments';
import VisarunSection from '../sections/VisarunSection/VisarunSection';
import CurrencyExchangeSection from '../sections/CurrencyExchangeSection/CurrencyExchangeSection';
import AddExchangeButton from '@/components/Order/sections/CurrencyExchangeSection/AddExchangeButton';

const ServicePuzzle = ({
  client,
  servicePuzzleIsActive,
}: {
  client: StoreClient;
  servicePuzzleIsActive: boolean;
}) => {
  const navigate = useNavigate();
  const {
    orderItems,
    setOrderItems,
    setActiveClientId,
    setSaveStatus,
    contactMethods,
    user,
    order,
    clients,
    setClients,
    visarunPassengers,
    setCurrencyExchanges,
    currencyExchanges,
  } = useOrderStore();

  const detectActiveService =
    visarunPassengers.length > 0
      ? 'visarun'
      : orderItems.filter(i => i.serviceType === 'acceleration').length > 0
        ? 'acceleration'
        : orderItems.filter(i => i.serviceType === 'visa').length > 0
          ? 'visa'
          : 'currencyExchange';

  const [activeService, setActiveService] = useState(detectActiveService);

  const isDisabled = !client.citizenship?.id || !client.preConfirmPassportIsValid;

  // At least one contact method exists
  const hasContactMethod = contactMethods.find(method => method.value) != undefined;

  const handleServiceButtonClick = async (service: string) => {
    setActiveService(service);
  };

  const canDeleteOrder =
    !contactMethods || !contactMethods[0]?.method?.id || !contactMethods[0]?.value;

  const deleteOrderMutation = trpc.order.delete.useMutation();
  const deleteUserMutation = trpc.user.delete.useMutation();
  const deleteOrderItemMutation = trpc.orderItem.delete.useMutation();
  const deleteVisaApplicationMutation = trpc.visaApplication.delete.useMutation();
  const editOrderMutation = trpc.order.edit.useMutation();

  const handleDelete = async (client: StoreClient) => {
    setSaveStatus('saving');
    if (client.isPrimary && canDeleteOrder) {
      const deletedOrderItems = orderItems.filter(item => item.clientId === client.id);
      for (const item of deletedOrderItems) {
        if (item.serviceType === 'visa') {
          await deleteVisaApplicationMutation.mutateAsync({
            id: item.serviceTypeId || '',
          });
        }
        await deleteOrderItemMutation.mutateAsync({
          id: item.id || '',
        });
      }

      await deleteOrderMutation.mutateAsync({
        id: order?.id || '',
      });

      await deleteUserMutation.mutateAsync({
        id: user?.id || '',
      });
      navigate(getAllOrdersRoute());
    } else {
      setClients(clients.filter(c => c.id !== client.id));
      setOrderItems(orderItems.filter(i => i.clientId !== client.id));
      const deletedOrderItems = orderItems.filter(item => item.clientId === client.id);
      for (const item of deletedOrderItems) {
        if (item.serviceType === 'visa') {
          await deleteVisaApplicationMutation.mutateAsync({
            id: item.serviceTypeId || '',
          });
        }
        await deleteOrderItemMutation.mutateAsync({
          id: item.id || '',
        });
      }

      await editOrderMutation.mutateAsync({
        id: order?.id || '',
        clients: clients ? clients.filter(c => c.id !== client.id).map(c => c.id) : undefined,
      });

      setActiveClientId('');
    }

    setSaveStatus('saved');
  };

  const handleDeleteCurrencyExchange = async (orderItemId: string) => {
    try {
      setSaveStatus('saving');

      await deleteOrderItemMutation.mutateAsync({
        id: orderItemId,
      });

      setOrderItems([...orderItems.filter(item => item.id !== orderItemId)]);

      setCurrencyExchanges([...currencyExchanges.filter(ex => ex.orderItemId !== orderItemId)]);

      setSaveStatus('saved');
    } catch (e) {
      console.error('Currency exchange was not deleted', e);
      setSaveStatus('error');
    }
  };

  const handleConfirm = () => {
    setActiveClientId('-');
  };

  return (
    <>
      {activeService === 'currencyExchange' && (
        <CurrencyExchangeSection
          client={client}
          handleDeleteCurrencyExchange={handleDeleteCurrencyExchange}
        />
      )}

      {servicePuzzleIsActive && ['visa', 'acceleration'].includes(activeService) && (
        <AddVisa activeService={activeService} client={client} />
      )}

      {(servicePuzzleIsActive || activeService === 'currencyExchange') && (
        <ClientName client={client} />
      )}

      {servicePuzzleIsActive && (
        <>
          {activeService === 'visarun' && <VisarunSection client={client} />}
          <hr />
          <Comments clientId={client.id} orderId={order.id} />
        </>
      )}

      <div className="flex justify-end gap-2">
        {((client.isPrimary && canDeleteOrder) || !client.isPrimary) && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="secondary">Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Client from order</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this client from order? This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDelete(client);
                  }}
                >
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button type="button" disabled={false} onClick={handleConfirm}>
          Save & close
        </Button>
      </div>
      <Card className="p-0 bg-muted border-none rounded-md">
        <CardContent className="p-2 md:p-3">
          <div className="flex flex-wrap gap-2 md:gap-0 items-center justify-center md:justify-between">
            <div className="font-medium">Service puzzle</div>
            <Card className="flex items-center gap-1 p-1 bg-secondary rounded-md border-none">
              <div className="flex gap-2">
                <Button
                  disabled={isDisabled}
                  variant={activeService === 'visarun' ? 'accent-pink' : 'secondary'}
                  size="sm"
                  className="border-none"
                  onClick={() => handleServiceButtonClick('visarun')}
                >
                  Visarun
                </Button>
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
                  variant={activeService === 'acceleration' ? 'accent-green' : 'secondary'}
                  size="sm"
                  className="border-none"
                  onClick={() => handleServiceButtonClick('acceleration')}
                >
                  Acceleration
                </Button>
              </div>
            </Card>
            <div className="flex gap-2">
              <Button disabled variant="secondary" size="sm" className="border-none">
                + Transfer
              </Button>
              <AddExchangeButton
                client={client}
                disabled={!hasContactMethod}
                setActiveService={setActiveService}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ServicePuzzle;
