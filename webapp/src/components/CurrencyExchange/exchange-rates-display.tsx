interface ExchangeRatesDisplayProps {
  rates: {
    rubToVnd: number;
    vndToRub: number;
    usdtToVnd: number;
    vndToUsdt: number;
    usdtToRub: number;
    rubToUsdt: number;
  };
}

export function ExchangeRatesDisplay({ rates }: ExchangeRatesDisplayProps) {
  // Function to format numbers for display
  const formatNumber = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) return '0';
    return value.toLocaleString('ru-RU', { maximumFractionDigits: 4 });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
      <div>
        <p>1 RUB = {formatNumber(rates.rubToVnd)} VND</p>
        <p>1 000 RUB = {formatNumber(rates.rubToUsdt * 1000)} USDT</p>
      </div>
      <div>
        <p>1 000 VND = {formatNumber(rates.vndToRub * 1000)} RUB</p>
        <p>1 000 VND = {formatNumber(rates.vndToUsdt * 1000)} USDT</p>
      </div>
      <div>
        <p>1 USDT = {formatNumber(rates.usdtToRub)} RUB</p>
        <p>1 USDT = {formatNumber(rates.usdtToVnd)} VND</p>
      </div>
    </div>
  );
}
