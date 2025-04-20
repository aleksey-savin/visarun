import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ExchangeRatesDisplayProps {
  rates: {
    rubPerTen: number;
    vndPerMillion: number;
    vndPerUsdt: number;
    vndPerUsdt2: number;
    usdPerUsdt: number;
  };
}

export function ExchangeRatesDisplay({ rates }: ExchangeRatesDisplayProps) {
  // Format numbers with proper separators
  const formatNumber = (num: number): string => {
    return num.toLocaleString('ru-RU');
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Текущие курсы обмена</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-lg">
          <li className="font-medium">За 10 т.р. даём {formatNumber(rates.rubPerTen)} vnd</li>
          <li className="font-medium">За 1 млн даём {formatNumber(rates.vndPerMillion)} руб</li>
          <li className="font-medium">За 1 usdt даём {formatNumber(rates.vndPerUsdt)} vnd</li>
          <li className="font-medium">За {formatNumber(rates.vndPerUsdt2)} vnd даём 1 usdt</li>
          <li className="font-medium">
            За 1 usdt даём {rates.usdPerUsdt.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}{' '}
            usd нал в Камбодже
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
