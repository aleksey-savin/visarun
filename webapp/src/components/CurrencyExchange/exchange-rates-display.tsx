import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
  // Format numbers with proper separators
  const formatNumber = (num: number): string => {
    return num.toLocaleString('ru-RU');
  };

  // Calculate display values
  const tenThousandRubToVnd = rates.rubToVnd * 10000;
  const millionVndToRub = rates.vndToRub * 1000;

  // Assume USDT to USD rate is 0.94 for display purposes
  const usdtToUsd = 0.94;

  return (
    <Card className="w-full max-w-lg mx-auto bg-card/50 border-none shadow-none">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="rounded-md overflow-hidden border">
              <div className="bg-primary text-primary-foreground font-medium p-2 text-center">
                RUB ↔ VND
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">10,000₽</span>
                  <span className="font-semibold">{formatNumber(tenThousandRubToVnd)} ₫</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">1,000,000₫</span>
                  <span className="font-semibold">{formatNumber(millionVndToRub)} ₽</span>
                </div>
              </div>
            </div>

            <div className="rounded-md overflow-hidden border">
              <div className="bg-primary text-primary-foreground font-medium p-2 text-center">
                USDT ↔ USD
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">1 USDT</span>
                  <span className="font-semibold">
                    {usdtToUsd.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} $
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground text-right">
                  Cash in Cambodia
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="rounded-md overflow-hidden border h-full">
              <div className="bg-primary text-primary-foreground font-medium p-2 text-center">
                USDT ↔ VND
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">1 USDT</span>
                  <span className="font-semibold">{formatNumber(rates.usdtToVnd)} ₫</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{formatNumber(rates.vndToUsdt)} ₫</span>
                  <span className="font-semibold">1 USDT</span>
                </div>
                <div className="pt-2 text-xs text-muted-foreground italic">
                  Note: Different rates apply when buying vs selling USDT
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
