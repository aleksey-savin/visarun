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
        <div className="flex flex-col md:flex-row gap-2">
          <div className="w-full md:w-1/2 mb-2 md:mb-0">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs mr-2">
                RUB ↔ VND
              </span>
            </h3>
            <div className="flex justify-between items-center bg-background/60 px-2 py-1 rounded">
              <span className="text-muted-foreground">{formatNumber(10000)} RUB</span>
              <span className="font-medium">
                {formatNumber(Math.floor(10000 * rates.rubToVnd * 10) / 10)} VND
              </span>
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs mr-2">
                VND ↔ RUB
              </span>
            </h3>
            <div className="flex justify-between items-center bg-background/60 px-2 py-1 rounded">
              <span className="text-muted-foreground">{formatNumber(1000000)} VND</span>
              <span className="font-medium">
                {formatNumber(Math.floor(((1000000 * rates.vndToRub) / 1000) * 10) / 10)} RUB
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* USDT to VND Section */}
      <div className="bg-muted/40 p-3 rounded-md">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="w-full md:w-1/2 mb-2 md:mb-0">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs mr-2">
                USDT ↔ VND
              </span>
            </h3>
            <div className="flex justify-between items-center bg-background/60 px-2 py-1 rounded">
              <span className="text-muted-foreground">{formatNumber(1)} USDT</span>
              <span className="font-medium">
                {formatNumber(Math.floor(1 * rates.usdtToVnd * 10) / 10)} VND
              </span>
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs mr-2">
                VND ↔ USDT
              </span>
            </h3>
            <div className="flex justify-between items-center bg-background/60 px-2 py-1 rounded">
              <span className="text-muted-foreground">{formatNumber(1000000)} VND</span>
              <span className="font-medium">
                {formatNumber(Math.floor((1000000 / rates.vndToUsdt) * 10) / 10)} USDT
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* USDT to RUB Section */}
      <div className="bg-muted/40 p-3 rounded-md">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="w-full md:w-1/2 mb-2 md:mb-0">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs mr-2">
                USDT ↔ RUB
              </span>
            </h3>
            <div className="flex justify-between items-center bg-background/60 px-2 py-1 rounded">
              <span className="text-muted-foreground">{formatNumber(1)} USDT</span>
              <span className="font-medium">
                {formatNumber(Math.floor(1 * rates.usdtToRub * 10) / 10)} RUB
              </span>
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs mr-2">
                RUB ↔ USDT
              </span>
            </h3>
            <div className="flex justify-between items-center bg-background/60 px-2 py-1 rounded">
              <span className="text-muted-foreground">{formatNumber(10000)} RUB</span>
              <span className="font-medium">
                {formatNumber(Math.floor((10000 / rates.rubToUsdt) * 10) / 10)} USDT
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
