import { CurrencyExchangeForm } from '@/components/CurrencyExchange/exchange-calc-form';
import { ExchangeRatesForm } from '@/components/CurrencyExchange/exchange-rates-form';
import { ExchangeRatesDisplay } from '@/components/CurrencyExchange/exchange-rates-display';

const CurrencyExchangePage = () => {
  const currentRates = {
    rubPerTen: 2900000,
    vndPerMillion: 3000,
    vndPerUsdt: 25100,
    vndPerUsdt2: 26300,
    usdPerUsdt: 0.94,
  };

  return (
    <div>
      <div className="text-5xl font-semibold capitalize text-center">Currency exchange</div>
      <div className="flex justify-center py-10">
        <ExchangeRatesDisplay rates={currentRates} />
      </div>
      <div className="flex justify-center py-10">
        <CurrencyExchangeForm />
      </div>
      <div className="flex justify-center py-10">
        <ExchangeRatesForm />
      </div>
    </div>
  );
};

export default CurrencyExchangePage;
