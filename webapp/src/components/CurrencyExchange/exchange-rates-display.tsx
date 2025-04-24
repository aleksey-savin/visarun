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
    <div className="w-full max-w-2xl mx-auto space-y-3">
      {/* RUB to VND Section */}
      <div className="bg-muted/40 p-3 rounded-md">
        <h3 className="text-sm font-medium mb-2 flex items-center">
          <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs mr-2">
            RUB ↔ VND
          </span>
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between items-center bg-background/60 px-2 py-1 rounded">
            <span className="text-muted-foreground">10,000 RUB</span>
            <span className="font-medium">{formatNumber(rates.rubToVnd * 10000)} VND</span>
          </div>
          <div className="flex justify-between items-center bg-background/60 px-2 py-1 rounded">
            <span className="text-muted-foreground">1M VND</span>
            <span className="font-medium">{formatNumber(rates.vndToRub * 1000)} RUB</span>
          </div>
        </div>
      </div>

      {/* USDT to VND Section */}
      <div className="bg-muted/40 p-3 rounded-md">
        <h3 className="text-sm font-medium mb-2 flex items-center">
          <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs mr-2">
            USDT ↔ VND
          </span>
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between items-center bg-background/60 px-2 py-1 rounded">
            <span className="text-muted-foreground">1 USDT</span>
            <span className="font-medium">{formatNumber(rates.usdtToVnd)} VND</span>
          </div>
          <div className="flex justify-between items-center bg-background/60 px-2 py-1 rounded">
            <span className="text-muted-foreground">1M VND</span>
            <span className="font-medium">{formatNumber(rates.vndToUsdt * 1000000)} USDT</span>
          </div>
        </div>
      </div>

      {/* USDT to RUB Section */}
      <div className="bg-muted/40 p-3 rounded-md">
        <h3 className="text-sm font-medium mb-2 flex items-center">
          <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs mr-2">
            USDT ↔ RUB
          </span>
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between items-center bg-background/60 px-2 py-1 rounded">
            <span className="text-muted-foreground">1 USDT</span>
            <span className="font-medium">{formatNumber(rates.usdtToRub)} RUB</span>
          </div>
          <div className="flex justify-between items-center bg-background/60 px-2 py-1 rounded">
            <span className="text-muted-foreground">1 RUB</span>
            <span className="font-medium">{formatNumber(rates.rubToUsdt)} USDT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
