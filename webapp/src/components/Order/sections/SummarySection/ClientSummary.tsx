import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

import { formatCurrency } from '@/utils/currency.js';

import ClientBadge from '../../ClientBadge';

import useOrderStore, { StoreClient } from '@/stores/order/order-store';
import { Badge } from '@/components/ui/badge';

const ClientSummary = ({ client }: { client: StoreClient }) => {
  const { orderItems = [], visaApplications } = useOrderStore();

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

  const copyToClipboard = async () => {
    const currentDate = new Date().toLocaleDateString('ru-RU');
    const clientName = `${client.firstName} ${client.lastName}`;

    let summaryText = `VISA SERVICE ORDER\nDate: ${currentDate}\n${clientName.trim().length > 0 ? 'Client: ' + clientName + '\n' : ''}\nSERVICES:\n==================================================\n`;

    if (orderItems.length > 0) {
      orderItems.forEach((item: any, index: number) => {
        const amount = formatCurrency(item.finalPrice, 'VND');
        const serviceTypeName = getServiceTypeName(item.serviceType);

        if (item.serviceType === 'visa') {
          const visaApp = visaApplications?.find((app: any) => app.id === item.serviceTypeId);
          const isMulti = visaApp?.isMultientry || false;
          const countryName = visaApp?.country?.name || '';
          const visaTypeName = visaApp?.visaType?.name ? `- ${visaApp.visaType.name}` : '';

          summaryText += `${index + 1}. ${serviceTypeName} - ${countryName} ${visaTypeName}${isMulti ? ' - Multi' : ''} - ${amount}\n`;
        } else {
          summaryText += `${index + 1}. ${serviceTypeName}\n   Amount: ${amount}\n`;
        }
      });
    } else {
      summaryText += `No services added yet\n\n`;
    }

    const total = orderItems.reduce((sum: number, item: any) => {
      return sum + item.finalPrice;
    }, 0);

    summaryText += `==================================================\nTOTAL AMOUNT: ${formatCurrency(total, 'VND')}\n\nThank you for choosing our visa services.`;

    try {
      await navigator.clipboard.writeText(summaryText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const clientOrderItemsWithPrice = orderItems.filter(
    item => item.finalPrice > 0 && item.clientId === client.id
  );

  return (
    <div className="grid space-y-4 lg:col-span-3">
      <Card className="p-3 bg-secondary rounded-md">
        <CardContent className="space-y-4 p-0">
          <div className="flex justify-between items-start">
            <ClientBadge client={client} showLinkedClients={false} />
            <Badge
              variant="outline"
              className={`p-1 h-auto transition-all duration-300 ${
                isCopied ? 'text-green-500' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={copyToClipboard}
            >
              {isCopied ? (
                <Check className="w-4 h-4 animate-pulse" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Badge>
          </div>
          <div className="space-y-2 text-sm">
            {clientOrderItemsWithPrice.length > 0 && (
              <>
                {clientOrderItemsWithPrice.map((item: any, index: number) => {
                  const amount = formatCurrency(item.finalPrice, 'VND');
                  const serviceTypeName = getServiceTypeName(item.serviceType);

                  if (item.serviceType === 'visa') {
                    // Check if it's multi-entry from visa application data
                    const visaApp = visaApplications?.find(
                      (app: any) => app.id === item.serviceTypeId
                    );
                    const isMulti = visaApp?.isMultientry || false;
                    const countryName = visaApp?.country?.name || '';
                    const visaTypeName = visaApp?.visaType?.name
                      ? `- ${visaApp.visaType.name}`
                      : '';

                    return (
                      <div key={item.id || index} className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          {serviceTypeName} - {countryName} {visaTypeName}{' '}
                          {isMulti ? '- Multi' : ''}
                        </span>
                        <span className="text-sm">{amount}</span>
                      </div>
                    );
                  } else {
                    // For non-visa services
                    return (
                      <div key={item.id || index} className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          {serviceTypeName}
                        </span>
                        <span className="text-sm">{amount}</span>
                      </div>
                    );
                  }
                })}
              </>
            )}
            {clientOrderItemsWithPrice.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">
                No services added yet
              </div>
            )}
          </div>
          <hr />
          <div className="text-sm">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-sm">
                {(() => {
                  // Calculate total using dynamic prices
                  const total = clientOrderItemsWithPrice.reduce((sum: number, item: any) => {
                    return sum + item.finalPrice;
                  }, 0);
                  return formatCurrency(total, 'VND');
                })()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientSummary;
