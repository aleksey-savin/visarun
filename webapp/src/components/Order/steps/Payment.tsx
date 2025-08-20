import { useState, useMemo, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { OrderItem } from '@visarun/backend/node_modules/@prisma/client';

import { trpc } from '@/lib/trpc';

import useOrderStore from '@/stores/order/order-store';

import { formatCurrency } from '@/utils/currency';

const Payment = () => {
  const { orderItems } = useOrderStore();

  const { data: currencyData } = trpc.currency.getAll.useQuery({
    search: '',
  });

  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('transfer');

  const handlePaymentMethodChange = () => {
    if (paymentMethod === 'transfer') {
      setPaymentMethod('cash');
    } else {
      setPaymentMethod('transfer');
    }
  };

  // Set VND as default currency when currencies are loaded
  const vndCurrency = useMemo(() => {
    return currencyData?.currencies?.find(curr => curr.name === 'VND');
  }, [currencyData?.currencies]);

  // Set VND as default when available
  useEffect(() => {
    if (vndCurrency && !selectedCurrencyId) {
      setSelectedCurrencyId(vndCurrency.id);
    }
  }, [vndCurrency, selectedCurrencyId]);

  const handleCurrencyChange = (value: string) => {
    setSelectedCurrencyId(value);
  };

  const selectedCurrency = useMemo(() => {
    if (selectedCurrencyId) {
      return currencyData?.currencies?.find(curr => curr.id === selectedCurrencyId);
    }
    return vndCurrency; // Fallback to VND
  }, [currencyData?.currencies, selectedCurrencyId, vndCurrency]);

  const total = orderItems.reduce((sum: number, item: OrderItem) => {
    return sum + item.finalPrice;
  }, 0);

  const formattedAmount = useMemo(() => {
    const currency = selectedCurrency || vndCurrency;
    if (!currency) return total.toString();
    return formatCurrency(total, currency.name);
  }, [total, selectedCurrency, vndCurrency]);

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button variant="accent">Full payment</Button>
        <Button variant="secondary" disabled>
          Partial payment
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        <Label>Payment Order</Label>
        <div className="flex gap-2">
          <Select
            value={selectedCurrencyId || vndCurrency?.id || ''}
            onValueChange={handleCurrencyChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {currencyData?.currencies?.map(currency => (
                  <SelectItem key={currency.id} value={currency.id}>
                    {currency.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Input disabled className="w-auto" value={formattedAmount} />
          <div className="flex gap-2 items-center">
            <Switch
              checked={paymentMethod === 'cash'}
              onCheckedChange={handlePaymentMethodChange}
            />
            <Label>Cash</Label>
          </div>
        </div>
      </div>
    </>
  );
};
export default Payment;
