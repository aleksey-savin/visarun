import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { trpc } from '@/lib/trpcProvider';
import { useAuth } from '@/lib/auth';
import { getDashboardRoute } from '@/lib/routes';

import { ExchangeRatesDisplay } from '@/components/CurrencyCalculator/exchange-rates-display';
import { CurrencyCalculatorForm } from '@/components/CurrencyCalculator/exchange-calc-form';

import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { AlertDescription } from '@/components/ui/alert';

import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import SignInForm from '../../components/SignIn/sign-in-form';

const HomePage = () => {
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAuthLoading } = useAuth();

  // Open login dialog automatically if we're on the sign-in route
  useEffect(() => {
    if (location.pathname === '/sign-in') {
      setShowLoginDialog(true);
    }
  }, [location.pathname]);

  // Redirect to dashboard page if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      navigate(getDashboardRoute(), { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  const {
    data: latestRates,
    isLoading,
    isError,
    refetch,
  } = trpc.exchangeRates.getLatestExchangeRate.useQuery(undefined, {
    refetchOnWindowFocus: false,
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

  // We will always render the header with login, but conditionally render content
  let mainContent;

  if (isError || !rates) {
    mainContent = (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Exchange rates are not available yet. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  } else {
    mainContent = (
      <main className="container flex flex-col items-center gap-4 py-6">
        {/* Page Heading */}
        <div>
          <h1 className="text-4xl font-bold text-center mb-2">Currency Calculator</h1>
          <p className="text-center text-muted-foreground">Convert between RUB, VND, USDT</p>
        </div>

        {/* Current Exchange Rates Section */}
        <div className="bg-card rounded-lg shadow-md p-6 border border-border/50 hover:border-border/90 transition-colors md:min-w-4xl">
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
              <Badge variant="outline" className="px-3 py-1 text-sm w-full sm:w-auto text-center">
                Rates updated:{' '}
                {rates.createdAt ? formatLastUpdated(new Date(rates.createdAt)) : 'N/A'}
              </Badge>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRefresh}
                className="flex items-center gap-1 w-full sm:w-auto justify-center"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Exchange Calculator Section */}
        <div className="bg-card rounded-lg shadow-md p-6 border border-border/50 hover:border-border/90 transition-colors md:min-w-4xl">
          <h2 className="text-2xl font-semibold mb-6 text-center">Currency Calculator</h2>
          <CurrencyCalculatorForm
            isClient={true}
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
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      <header className="w-full px-6 py-4 border-b flex justify-between items-center">
        <h1 className="text-2xl font-bold">Visarun Vietnam</h1>
        <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
          <DialogTrigger asChild>
            <Button variant="accent">Sign In</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogTitle className="text-xl font-semibold mb-4"></DialogTitle>
            <SignInForm onSuccess={() => setShowLoginDialog(false)} />
          </DialogContent>
        </Dialog>
      </header>
      {mainContent}
      <footer className="w-full mt-auto px-6 py-4 border-t text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Visarun Vietnam. All rights reserved.
      </footer>
    </div>
  );
};

export default HomePage;
