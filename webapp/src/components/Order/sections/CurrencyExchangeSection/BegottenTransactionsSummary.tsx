import { formatCurrency, getCurrencySymbol } from '@/utils/currency';
import { Progress } from '@/components/ui/progress';
import Summ from '@/components/ui/summ';
import IconCoins from '@/assets/tabler-icons/IconCoins';
import IconLoader from '@/assets/tabler-icons/IconLoader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Copy, Crown, Undo2 } from 'lucide-react';
import ContactMethodIcon from '../../../ContactMethod/ContactMethodIcon';
import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { StoreCurrencyExchange } from '@/stores/currencyExchange/currency-exchange-store';

const BegottenTransactionsSummary = ({
  currencyExchange,
  onEditOrder,
}: {
  currencyExchange: StoreCurrencyExchange;
  onEditOrder: () => void;
}) => {
  const [copiedText, setCopiedText] = useState<any | undefined>();
  const handleCopyToClipboard = (event: React.MouseEvent, text: string) => {
    event.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedText(text);
  };

  return (
    <div className="flex justify-between gap-5">
      <div className="flex gap-5 items-center">
        <span>Exchange</span>
        {currencyExchange?.amountInSelectedCurrencyFrom &&
          currencyExchange?.fromCurrency &&
          (currencyExchange?.inProgressBegottenTransactionsAmountInSelectedCurrency ||
            currencyExchange?.inProgressBegottenTransactionsAmountInSelectedCurrency === 0) && (
            <div className="flex min-w-1/2 flex-col justify-center pt-1 gap-0.5">
              <div className={`text-white flex gap-2 justify-between text-sm`}>
                <span>{currencyExchange.amountInSelectedCurrencyFrom}</span>
                <span>{getCurrencySymbol(currencyExchange.fromCurrency.name)}</span>
              </div>

              <Progress
                value={
                  (currencyExchange.inProgressBegottenTransactionsAmountInSelectedCurrency /
                    currencyExchange.amountInSelectedCurrencyFrom) *
                    100 || 0
                }
                className="w-full bg-emerald-900 [&>div]:bg-amber-700 h-[4px]"
              />
            </div>
          )}

        {(currencyExchange?.inProgressBegottenTransactionsAmountInSelectedCurrency ||
          currencyExchange?.inProgressBegottenTransactionsAmountInSelectedCurrency === 0) &&
          currencyExchange?.amountInSelectedCurrencyFrom &&
          currencyExchange?.fromCurrency && (
            <div className="">
              <Summ className="bg-emerald-900 h-fit">
                <IconCoins />
                {formatCurrency(
                  currencyExchange.amountInSelectedCurrencyFrom -
                    currencyExchange.inProgressBegottenTransactionsAmountInSelectedCurrency,
                  currencyExchange.fromCurrency.name
                )}
              </Summ>
            </div>
          )}

        {(currencyExchange?.inProgressBegottenTransactionsAmountInSelectedCurrency ||
          currencyExchange?.inProgressBegottenTransactionsAmountInSelectedCurrency === 0) &&
          currencyExchange?.fromCurrency && (
            <div className="">
              <Summ className="bg-amber-600">
                <IconLoader />
                {formatCurrency(
                  currencyExchange.inProgressBegottenTransactionsAmountInSelectedCurrency,
                  currencyExchange.fromCurrency.name
                )}
              </Summ>
            </div>
          )}
      </div>

      <Card className="bg-secondary p-4">
        <div className="flex gap-2">
          <div className="flex items-center">
            {currencyExchange?.orderItem?.client && (
              <Badge variant="primary" className="w-full justify-start">
                <Crown />
                <span>
                  {currencyExchange.orderItem.client.firstName || '\u00A0'}{' '}
                  {currencyExchange.orderItem.client.lastName || ''}
                </span>
              </Badge>
            )}
          </div>
          <div className="flex items-center">
            {currencyExchange?.orderItem?.client?.user?.contactMethods
              ?.filter((contact: any) => contact.method)
              .map((contact: any) => (
                <Badge
                  key={contact.id}
                  variant="secondary"
                  className={`cursor-pointer transition-all duration-300 ${
                    copiedText === contact.value
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                  onClick={e =>
                    contact.value && contact.id && handleCopyToClipboard(e, contact.value)
                  }
                >
                  <ContactMethodIcon
                    method={
                      contact.method
                        ? { name: contact.method.name, icon: contact.method.icon }
                        : { name: 'unknown', icon: null }
                    }
                    className="w-3 h-3"
                  />
                  {contact.value}
                  {copiedText === contact.value ? (
                    <Check className="w-3 h-3 ml-1 animate-pulse" />
                  ) : (
                    <Copy className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
          </div>
          <div className="flex items-center">
            {currencyExchange.amountInSelectedCurrencyFrom && currencyExchange.fromCurrency && (
              <Badge variant="secondary" className="bg-gray-950">
                {formatCurrency(
                  currencyExchange.amountInSelectedCurrencyFrom,
                  currencyExchange.fromCurrency.name
                )}
              </Badge>
            )}
          </div>
          <Button variant="secondary" onClick={onEditOrder}>
            <Undo2 />
            <span>Edit</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default BegottenTransactionsSummary;
