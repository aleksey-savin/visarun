import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

import useOrderStore, { StoreOrderPayment } from '@/stores/order/order-store';
import { Plus } from 'lucide-react';
import PaymentCard from './PaymentCard';
import { useMemo } from 'react';

const AddPayment = ({ paymentType }: { paymentType: string }) => {
  const {
    order,
    orderPayments = [],
    setOrderPayments,
    setSaveStatus,
    orderItems,
  } = useOrderStore();

  const createOrderPaymentMutation = trpc.orderPayment.create.useMutation();

  const { data: currencyData } = trpc.currency.getAll.useQuery({
    search: '',
  });

  const vndCurrency = useMemo(() => {
    return currencyData?.currencies?.find(curr => curr.name === 'VND');
  }, [currencyData?.currencies]);

  const orderItemsSum = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + item.finalPrice, 0);
  }, [orderItems]);

  const addPaymentHandler = async () => {
    setSaveStatus('saving');

    try {
      const paymentData: any = {
        orderId: order.id,
      };

      // If it's full payment, set amount and currency
      if (paymentType === 'full-payment') {
        paymentData.amount = orderItemsSum;
        paymentData.amountInSelectedCurrency = orderItemsSum;
        if (vndCurrency) {
          paymentData.currencyId = vndCurrency.id;
        }
      }

      const newPayment = await createOrderPaymentMutation.mutateAsync(paymentData);

      const newOrderPayment = newPayment.orderPayment;
      const newStorePayment: StoreOrderPayment = {
        id: newOrderPayment.id,
        amount: newOrderPayment.amount ?? undefined,
        amountInSelectedCurrency: newOrderPayment.amountInSelectedCurrency ?? undefined,
        currencyId: newOrderPayment.currencyId ?? undefined,
        paidAt: newOrderPayment.paidAt ? new Date(newOrderPayment.paidAt) : undefined,
      };

      const updatedPayments = [...orderPayments, newStorePayment];

      setOrderPayments(updatedPayments);

      setSaveStatus('saved');
    } catch (error) {
      console.error('Failed to save partial payment:', error);
      setSaveStatus('error');
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {orderPayments.map(payment => (
          <PaymentCard payment={payment} key={payment.id} />
        ))}
      </div>
      {((paymentType === 'full-payment' && orderPayments.length < 1) ||
        paymentType === 'partial-payment') && (
        <div className="flex items-center w-full">
          <Button variant="secondary" className="w-full" onClick={addPaymentHandler}>
            Add payment <Plus />
          </Button>
        </div>
      )}
    </>
  );
};

export default AddPayment;
