import { StoreCurrencyExchange } from '@/stores/currencyExchange/currency-exchange-store';
import { Badge } from '@/components/ui/badge';
import {AlertTriangle, ArrowRight} from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";

const ExchangeTag = ({
  currencyExchange,
  disabled,
}: {
  currencyExchange: StoreCurrencyExchange;
  disabled?: boolean;
}) => {
  if (!currencyExchange) {
    return (
      <div>
        Error: no currency exchange
      </div>
    );
  }

  const errors: string[] = [];

  if (!currencyExchange.amountInSelectedCurrencyFrom) {
    errors.push('"From" amount wasn\'t specified');
  }

  if (!currencyExchange.amountInSelectedCurrencyTo) {
    errors.push('"To" amount wasn\'t specified');
  }

  if (!currencyExchange.fromCurrency || !currencyExchange.fromCurrency.name) {
    errors.push('"From" currency wasn\'t selected');
  }

  if (!currencyExchange.toCurrency || !currencyExchange.toCurrency.name) {
    errors.push('"To" currency wasn\'t selected');
  }

  if (!currencyExchange.exchangeRate) {
    errors.push('Exchange rate wasn\'t specified');
  }

  if (!currencyExchange.bankingDetails?.id) {
    errors.push('Banking details wasn\'t specified');
  }

  return (
    <div className="flex gap-1">
      <Badge
        variant={errors.length > 0 ? "destructive" : undefined}
        className={
          errors.length === 0
            ? `${disabled ? 'text-neutral-300' : 'text-gray-50'} bg-neutral-700 border-0 p-0!`
            : 'border-0 p-0!'
        }
      >
        <div
          className={`${disabled ? 'bg-neutral-800' : errors.length > 0 ? 'bg-neutral-100' : 'bg-yellow-700'} py-0.5 px-2`}
        >
          Ex
        </div>
        <div className="flex py-0.5 px-2">
          <div>
            {currencyExchange.amountInSelectedCurrencyFrom && currencyExchange.fromCurrency?.name
              ? formatCurrency(
                currencyExchange.amountInSelectedCurrencyFrom,
                currencyExchange.fromCurrency.name
              )
              : '-'
            }
          </div>
          <div className="flex items-center">
            <ArrowRight className="h-4" />
          </div>
          <div>
            {currencyExchange.amountInSelectedCurrencyTo && currencyExchange.toCurrency?.name
              ? formatCurrency(
                currencyExchange.amountInSelectedCurrencyTo,
                currencyExchange.toCurrency.name
              )
              : '-'
            }
          </div>
        </div>
      </Badge>

      {errors.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertTriangle className="text-destructive" />
          </TooltipTrigger>
          <TooltipContent className="bg-destructive">
            <ul>
              {errors.map(error => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

export default ExchangeTag;
