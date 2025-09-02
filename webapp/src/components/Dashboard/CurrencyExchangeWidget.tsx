import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowUpDown, ExternalLink, RefreshCw } from 'lucide-react';
import { trpc } from '@/lib/trpcProvider';
import { Link } from 'react-router-dom';
import { getCurrencyExchangeRoute } from '@/lib/routes';
import { useAuth } from '@/lib/auth';

export function CurrencyExchangeWidget() {
  const { hasPermission } = useAuth();
  const {
    data: latestRates,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = trpc.exchangeRates.getLatestExchangeRate.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
  });

  const formatNumber = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) return '0';
    return value.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Currency Exchange
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !latestRates?.exchangeRate) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Currency Exchange
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-xs">Rates unavailable</AlertDescription>
          </Alert>
          {hasPermission('exchangeRates.create') && (
            <Link to={getCurrencyExchangeRoute()}>
              <Button variant="secondary" size="sm" className="w-full mt-2">
                <ExternalLink className="h-3 w-3 mr-1" />
                View Exchange
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    );
  }

  const rates = latestRates.exchangeRate;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Currency Exchange
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="w-full max-w-2xl mx-auto space-y-1 text-xs">
          {/* RUB to VND Section */}
          <div className="bg-muted/40 p-3 rounded-md">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="w-full md:w-1/2 mb-2 md:mb-0">
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Badge variant="accent" className="text-xs font-normal">
                    RUB - VND
                  </Badge>
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
                  <Badge variant="accent">VND - RUB</Badge>
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
                  <Badge variant="accent">USDT - VND</Badge>
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
                  <Badge variant="accent">VND - USDT</Badge>
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
                  <Badge variant="accent">USDT - RUB</Badge>
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
                  <Badge variant="accent">RUB - USDT</Badge>
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
        <Link to={getCurrencyExchangeRoute()}>
          <Button variant="default" className="w-full mt-2 text-md">
            <ExternalLink className="h-3 w-3 mr-1" />
            Manage
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
