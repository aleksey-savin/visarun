import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

import { formatCurrency } from '@/utils/currency.js';

import useOrderStore, { StoreVisaApplication } from '@/stores/order/order-store';
import type { OrderItem } from '@visarun/backend/node_modules/@prisma/client';
import { Badge } from '@/components/ui/badge';

const OrderSummary = () => {
  const { orderItems = [], visaApplications, clients } = useOrderStore();

  const [isCopied, setIsCopied] = useState(false);

  const getServiceTypeName = (serviceType: string) => {
    switch (serviceType) {
      case 'visa':
        return 'Visa';
      case 'visarun':
        return 'Visarun';
      case 'transfer':
        return 'Transfer';
      default:
        return 'Service';
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return 'Unknown Client';
    return `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Unknown Client';
  };

  const copyToClipboard = async () => {
    const currentDate = new Date().toLocaleDateString('ru-RU');

    let summaryText = `COMPLETE ORDER SUMMARY\nDate: ${currentDate}\n\nALL SERVICES:\n==================================================\n`;

    if (orderItems.length > 0) {
      orderItems.forEach((item: OrderItem, index: number) => {
        const amount = formatCurrency(item.finalPrice, 'VND');
        const serviceTypeName = getServiceTypeName(item.serviceType);
        const clientName = getClientName(item.clientId);

        if (item.serviceType === 'visa') {
          const visaApp = visaApplications?.find(
            (app: StoreVisaApplication) => app.id === item.serviceTypeId
          );
          const isMulti = visaApp?.isMultientry || false;
          const countryName = visaApp?.country?.name || '';
          const visaTypeName = visaApp?.visaType?.name ? `- ${visaApp.visaType.name}` : '';

          summaryText += `${index + 1}. ${serviceTypeName} - ${countryName} ${visaTypeName}${isMulti ? ' - Multi' : ''}\n   Client: ${clientName}\n   Amount: ${amount}\n\n`;
        } else {
          summaryText += `${index + 1}. ${serviceTypeName}\n   Client: ${clientName}\n   Amount: ${amount}\n\n`;
        }
      });
    } else {
      summaryText += `No services added yet\n\n`;
    }

    const total = orderItems.reduce((sum: number, item: OrderItem) => {
      return sum + item.finalPrice;
    }, 0);

    summaryText += `==================================================\nTOTAL ORDER AMOUNT: ${formatCurrency(total, 'VND')}\n\nThank you for choosing our visa services.`;

    try {
      await navigator.clipboard.writeText(summaryText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const orderItemsWithPrice = orderItems.filter(item => item.finalPrice > 0);

  const calcTotal = () => {
    const total = orderItemsWithPrice.reduce((sum: number, item: OrderItem) => {
      return sum + item.finalPrice;
    }, 0);

    return formatCurrency(total, 'VND');
  };

  return (
    <Card className="p-3 bg-primary/5 border-primary/20 rounded-md">
      <CardContent className="space-y-4 p-0">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-primary">Order Summary</span>
          <Badge
            variant="secondary"
            className={`p-1 h-auto transition-all duration-300 ${
              isCopied ? 'text-green-500' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={copyToClipboard}
          >
            {isCopied ? <Check className="w-4 h-4 animate-pulse" /> : <Copy className="w-4 h-4" />}
          </Badge>
        </div>
        <hr />
        <div className="text-sm">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total:</span>
            <span className="font-bold text-sm text-primary">{calcTotal()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderSummary;
