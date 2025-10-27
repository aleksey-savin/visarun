import {StoreCurrencyExchange} from "@/stores/currencyExchange/currency-exchange-store.ts";
import {Badge} from "@/components/ui/badge.tsx";
import {ArrowRight} from "lucide-react";
import {formatCurrency} from "@/utils/currency.ts";

const ExchangeTag = ({
    currencyExchange,
    disabled,
} : {
    currencyExchange: StoreCurrencyExchange;
    disabled?: boolean;
}) => {
    if (!currencyExchange
        || !currencyExchange.amountInSelectedCurrencyFrom
        || !currencyExchange.amountInSelectedCurrencyTo
        || !currencyExchange.fromCurrency
        || !currencyExchange.toCurrency
    ) {
        return;
    }

    return (
        <div className="flex">
            <Badge className={`${disabled ? 'text-neutral-300' : 'text-gray-50'} border-0 bg-neutral-700 p-0!`}>
                <div className={`${disabled ? 'bg-neutral-800' : 'bg-yellow-700'} py-0.5 px-2`}>Ex</div>
                <div className="flex py-0.5 px-2">
                    <div>
                        {formatCurrency(currencyExchange.amountInSelectedCurrencyFrom, currencyExchange.fromCurrency.name)}
                    </div>
                    <div className="flex items-center">
                        <ArrowRight className="h-4" />
                    </div>
                    <div>
                        {formatCurrency(currencyExchange.amountInSelectedCurrencyTo, currencyExchange.toCurrency.name)}
                    </div>
                </div>
            </Badge>
        </div>
    );
};

export default ExchangeTag;