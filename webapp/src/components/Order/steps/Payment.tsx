import { useState, useMemo, useEffect } from 'react';
import { trpc } from '@/lib/trpc';

import { Separator } from '@/components/ui/separator';

import useOrderStore from '@/stores/order/order-store';

import Comments from '../Comments';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddPayment from '../sections/PaymentSection/AddPayment';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const Payment = () => {
  const { orderItems, orderPayments = [], order, setOrder, setSaveStatus } = useOrderStore();

  const isPostPaymentActive = order.postPayment || false;
  const hasExistingPayments = orderPayments.length > 0;

  // Check if there are any visa or acceleration services in the order
  const hasVisaOrAcceleration = orderItems.some(
    item => item.serviceType === 'visa' || item.serviceType === 'acceleration'
  );

  // Check if all order items are only visa or acceleration types
  const hasOnlyVisaOrAcceleration =
    orderItems.length > 0 &&
    orderItems.every(item => item.serviceType === 'visa' || item.serviceType === 'acceleration');

  const canTogglePostPayment = !hasExistingPayments && !hasVisaOrAcceleration;

  const [paymentType, setPaymentType] = useState<string>(
    orderPayments
      ? (() => {
          const orderPaymentsSum = orderPayments.reduce(
            (sum, payment) => sum + Number(payment.amount || 0),
            0
          );
          const orderItemsSum = orderItems.reduce((sum, item) => sum + item.finalPrice, 0);
          return orderPaymentsSum === orderItemsSum || orderPayments.length === 0
            ? 'full-payment'
            : 'partial-payment';
        })()
      : 'full-payment'
  );

  // Calculate totals and payment restrictions
  const { canSwitchToPartial, canSwitchToFull } = useMemo(() => {
    const orderItemsSum = orderItems.reduce((sum, item) => sum + item.finalPrice, 0);
    const orderPaymentsSum = orderPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

    // Can't switch to partial if there's already a full payment
    const hasFullPayment = orderPayments.some(
      payment => Number(payment.amount || 0) === orderItemsSum
    );

    const canSwitchToPartial = !hasFullPayment && !hasOnlyVisaOrAcceleration;

    // Can't switch to full if there are multiple payments or if single payment amount doesn't equal total
    const canSwitchToFull =
      orderPayments.length <= 1 &&
      (orderPayments.length === 0 || orderPaymentsSum === orderItemsSum);

    return { canSwitchToPartial, canSwitchToFull };
  }, [orderItems, orderPayments, hasOnlyVisaOrAcceleration]);

  // Update payment type when restrictions change
  useEffect(() => {
    if (paymentType === 'partial-payment' && !canSwitchToPartial) {
      setPaymentType('full-payment');
    } else if (paymentType === 'full-payment' && !canSwitchToFull) {
      setPaymentType('partial-payment');
    }
  }, [paymentType, canSwitchToPartial, canSwitchToFull]);

  const paymentTypeChangeHandler = (value: string) => {
    // Check restrictions before allowing the change
    if (value === 'partial-payment' && !canSwitchToPartial) {
      return;
    }
    if (value === 'full-payment' && !canSwitchToFull) {
      return;
    }
    setPaymentType(value);
  };

  const editOrderMutation = trpc.order.edit.useMutation();

  const handlePostPaymentChange = async (checked: boolean) => {
    setSaveStatus('saving');

    try {
      await editOrderMutation.mutateAsync({
        id: order.id,
        postPayment: checked,
      });

      // Update order state directly
      setOrder({ ...order, postPayment: checked });
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to update post payment:', error);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <Tabs value={paymentType}>
          <TabsList>
            <TabsTrigger
              value="full-payment"
              onClick={() => paymentTypeChangeHandler('full-payment')}
              disabled={!canSwitchToFull || isPostPaymentActive}
              className={
                !canSwitchToFull || isPostPaymentActive ? 'opacity-50 cursor-not-allowed' : ''
              }
            >
              Full payment
            </TabsTrigger>
            <TabsTrigger
              value="partial-payment"
              onClick={() => paymentTypeChangeHandler('partial-payment')}
              disabled={!canSwitchToPartial || isPostPaymentActive}
              className={
                !canSwitchToPartial || isPostPaymentActive ? 'opacity-50 cursor-not-allowed' : ''
              }
            >
              Partial payment
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Switch
            checked={order.postPayment || false}
            onCheckedChange={handlePostPaymentChange}
            disabled={!canTogglePostPayment}
          />
          <Label className={!canTogglePostPayment ? 'opacity-50' : ''}>Full postpayment</Label>
        </div>
      </div>

      {isPostPaymentActive && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Full postpayment is active. Payment tab functionality is disabled until this option is
            turned off.
          </AlertDescription>
        </Alert>
      )}

      {!isPostPaymentActive && <AddPayment paymentType={paymentType} />}
      <Separator />
      <div className="flex flex-wrap justify-between align-center">
        <Comments />
      </div>
    </>
  );
};
export default Payment;
