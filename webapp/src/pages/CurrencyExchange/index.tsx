import { CurrencyExchangeForm } from '@/components/CurrencyExchange/exchange-calc-form';
import { ExchangeRatesForm } from '@/components/CurrencyExchange/exchange-rates-form';
import { ExchangeRatesDisplay } from '@/components/CurrencyExchange/exchange-rates-display';
import { useAuth } from '@/lib/auth';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Settings, ChevronDown, ChevronUp, RefreshCw, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpcProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CurrencyExchangePage = () => {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const [isOpen, setIsOpen] = useState(false);

  // Fetch the latest exchange rates with auto-refresh every 30 seconds
  const {
    data: latestRates,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = trpc.exchangeRates.getLatestExchangeRate.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchInterval: 5000, // Refetch every 10 seconds
    staleTime: 1000, // Consider data stale after 15 seconds
  });

  const handleRefresh = () => {
    refetch();
  };

  const formatLastUpdated = (date: Date) => {
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // If there are no rates yet or if loading, show placeholder or loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading exchange rates...</p>
        </div>
      </div>
    );
  }

  // Get rates or null
  const rates = latestRates?.exchangeRate;

  // Show the main content conditionally, but always render the container with navbar
  let mainContent;

  // If there's an error but we're admin, show the form to add rates
  if (isError && isAdmin) {
    mainContent = (
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Set Initial Exchange Rates</h2>
        <p className="text-muted-foreground mb-6">
          No exchange rates have been set up yet. As an admin, you can add the first exchange rates
          below:
        </p>
        <div className="max-w-2xl mx-auto">
          <ExchangeRatesForm onRatesUpdated={handleRefresh} />
        </div>
      </div>
    );
  }
  // If there's an error and we're not admin, show a friendlier message
  else if (isError) {
    mainContent = (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription>
          Exchange rates are not available yet. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  // If rates is null but no error (this can happen with our backend change)
  else if (!rates && isAdmin) {
    mainContent = (
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Set Initial Exchange Rates</h2>
        <p className="text-muted-foreground mb-6">
          No exchange rates have been set up yet. As an admin, you can add the first exchange rates
          below:
        </p>
        <div className="max-w-2xl mx-auto">
          <ExchangeRatesForm onRatesUpdated={handleRefresh} />
        </div>
      </div>
    );
  } else if (!rates) {
    mainContent = (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription>
          Exchange rates are not available yet. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // If we have rates, show the full content, otherwise just show the appropriate message
  if (rates) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="container mx-auto pt-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-center mb-2">Currency Exchange</h1>
            <p className="text-center text-muted-foreground mb-4">Convert between RUB, VND, USDT</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
            <div className="bg-card rounded-lg shadow-md p-6 border border-border/50 hover:border-border/90 transition-colors">
              <h2 className="text-2xl font-semibold mb-6 text-center">Currency Calculator</h2>
              <CurrencyExchangeForm
                isClient={false}
                rates={{
                  rubToVnd: rates.rubToVnd,
                  vndToRub: rates.vndToRub,
                  usdtToVnd: rates.usdtToVnd,
                  vndToUsdt: rates.vndToUsdt,
                  usdtToRub: rates.usdtToRub,
                  rubToUsdt: rates.rubToUsdt,
                }}
              />
            </div>
            <div className="bg-card rounded-lg shadow-md p-6 border border-border/50 hover:border-border/90 transition-colors">
              <h2 className="text-2xl font-semibold mb-6 text-center">Current Exchange Rates</h2>
              <ExchangeRatesDisplay
                rates={{
                  rubToVnd: rates.rubToVnd,
                  vndToRub: rates.vndToRub,
                  usdtToVnd: rates.usdtToVnd,
                  vndToUsdt: rates.vndToUsdt,
                  usdtToRub: rates.usdtToRub,
                  rubToUsdt: rates.rubToUsdt,
                }}
              />

              <div className="mt-6">
                <div className="flex flex-col sm:flex-row justify-center items-center gap-2">
                  <Badge
                    variant="outline"
                    className="px-3 py-1 text-sm w-full sm:w-auto text-center"
                  >
                    {`Rates updated: ${rates?.createdAt ? formatLastUpdated(new Date(rates.createdAt)) : 'N/A'}`}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="px-3 py-1 text-sm w-full sm:w-auto text-center"
                  >
                    By:{' '}
                    {rates?.createdBy
                      ? `${rates.createdBy.firstName} ${rates.createdBy.lastName}`
                      : 'N/A'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="flex items-center gap-1 w-full sm:w-auto justify-center"
                    disabled={isFetching}
                  >
                    <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mt-6">
              <Collapsible
                open={isOpen}
                onOpenChange={setIsOpen}
                className="w-full border rounded-lg overflow-hidden shadow-sm"
              >
                <div className="flex justify-between items-center p-4 bg-muted/20">
                  <h3 className="text-lg font-medium text-muted-foreground">Admin Controls</h3>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span>Manage Rates</span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="p-4 bg-card border-t">
                  <ExchangeRatesForm
                    onRatesUpdated={handleRefresh}
                    initialValues={{
                      rubToVnd: rates.rubToVnd,
                      vndToRub: rates.vndToRub,
                      usdtToVnd: rates.usdtToVnd,
                      vndToUsdt: rates.vndToUsdt,
                      usdtToRub: rates.usdtToRub,
                      rubToUsdt: rates.rubToUsdt,
                    }}
                  />
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </div>
      </div>
    );
  } else {
    // Show only header and error/setup message when no rates
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="container mx-auto px-4 py-8 max-w-6xl">{mainContent}</div>
      </div>
    );
  }
};

export default CurrencyExchangePage;
