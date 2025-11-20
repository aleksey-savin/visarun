import { trpc } from '@/lib/trpc';
import useOrderStore, { StoreClient, StoreCurrencyExchange } from '@/stores/order/order-store';
import { Button } from '@/components/ui/button';
import useCurrencyCalculatorStore from '@/stores/currencyCalculator/currency-calculator-store';
import { useEffect } from 'react';

const _inProgress = new Map<string, Promise<void>>();
const _done = new Set<string>();

const AddExchangeButton = ({
  client,
  disabled,
  activeService,
  setActiveService,
}: {
  client: StoreClient;
  disabled: boolean;
  activeService: string;
  setActiveService: (type: string) => void;
}) => {
  const {
    orderItems,
    setOrderItems,
    setSaveStatus,
    order,
    setCurrencyExchanges,
    currencyExchanges,
  } = useOrderStore();

  const { currencyCalculatorResults, setCurrencyCalculatorResults } = useCurrencyCalculatorStore();

  const clientOrderItems =
    orderItems?.filter(
      item => item.clientId === client.id && item.serviceType === 'currencyExchange'
    ) || [];

  const createOrderItemMutation = trpc.orderItem.create.useMutation();

  const createBankingDetailsMutation = trpc.bankingDetails.create.useMutation();

  const {
    data: currenciesData,
    error: error,
    isLoading: loading,
  } = trpc.currency.getAll.useQuery({
    search: '',
  });

  const handleAddCurrencyExchange = async () => {
    setSaveStatus('saving');

    const newData = await createOrderItemMutation.mutateAsync({
      amountInSelectedCurrencyFrom: currencyCalculatorResults.amountInSelectedCurrencyFrom,
      amountInSelectedCurrencyTo: currencyCalculatorResults.amountInSelectedCurrencyTo,
      exchangeRate: currencyCalculatorResults.exchangeRate,
      fromCurrencyId:
        currenciesData?.currencies?.find(
          (curr: any) => curr.name === currencyCalculatorResults.fromCurrencyName
        )?.id ?? undefined,
      toCurrencyId:
        currenciesData?.currencies?.find(
          (curr: any) => curr.name === currencyCalculatorResults.toCurrencyName
        )?.id ?? undefined,
      orderId: order.id || '',
      clientId: client.id,
      serviceType: 'currencyExchange',
      basePrice: 0,
      finalPrice: 0,
    });

    let newBankingDetails:
      | {
          content?: string | null;
          documentUrl?: string | null;
        }
      | undefined = undefined;
    let newExchangeBankingDetailsId: string | undefined = undefined;

    if (client.bankingDetails) {
      newBankingDetails = {
        content: client.bankingDetails.content,
        documentUrl: client.bankingDetails.documentUrl,
      };

      // add new in currencyExchange
      newExchangeBankingDetailsId = (
        await createBankingDetailsMutation.mutateAsync({
          ...newBankingDetails,
          currencyExchangeId: newData.currencyExchange?.id,
        })
      ).id;
    }

    if (!newData.orderItem) {
      console.error('Order item was not created');
      setSaveStatus('error');
      return;
    }

    setOrderItems([
      ...orderItems,
      {
        ...newData.orderItem,
        createdAt: new Date(newData.orderItem.createdAt),
        updatedAt: new Date(newData.orderItem.updatedAt),
      },
    ]);

    // Add proper null check
    if (!newData.currencyExchange) {
      console.error('Currency exchange was not created');
      setSaveStatus('error');
      return;
    }

    setCurrencyExchanges([
      ...currencyExchanges,
      {
        ...newData.currencyExchange,
        exchangeRate: Number(newData.currencyExchange.exchangeRate),
        amountInSelectedCurrencyFrom: Number(newData.currencyExchange.amountInSelectedCurrencyFrom),
        amountInSelectedCurrencyTo: Number(newData.currencyExchange.amountInSelectedCurrencyTo),
        bankingDetails:
          newBankingDetails && newExchangeBankingDetailsId
            ? {
                id: newExchangeBankingDetailsId,
                ...newBankingDetails,
              }
            : undefined,
        minTransactionAmountInSelectedCurrency: Number(
          newData.currencyExchange.minTransactionAmountInSelectedCurrency
        ),
        deadline: newData.currencyExchange.deadline
          ? new Date(newData.currencyExchange.deadline)
          : null,
        id: newData.currencyExchange.id,
        orderItemId: newData.currencyExchange.orderItemId,
        status: newData.currencyExchange.status,
        createdAt: newData.currencyExchange.createdAt
          ? new Date(newData.currencyExchange.createdAt)
          : null,
        updatedAt: newData.currencyExchange.updatedAt
          ? new Date(newData.currencyExchange.updatedAt)
          : null,
      } as StoreCurrencyExchange,
    ]);

    setCurrencyCalculatorResults({
      amountInSelectedCurrencyFrom: 0,
      amountInSelectedCurrencyTo: 0,
      fromCurrencyName: '',
      toCurrencyName: '',
      exchangeRate: 0,
    });

    setSaveStatus('saved');
  };

  const runOnceForItem = (orderId: string, fn: () => Promise<void>): Promise<void> => {
    // Helping function to run handleAddCurrencyExchange only once

    if (_done.has(orderId)) {
      // Already done handleAddCurrencyExchange
      return Promise.resolve();
    }
    const existing = _inProgress.get(orderId);
    if (existing) {
      // handleAddCurrencyExchange is running right now -> return existing promise
      return existing;
    }

    const promise = (async () => {
      try {
        await fn();
        _done.add(orderId);
      } finally {
        _inProgress.delete(orderId);
      }
    })();

    _inProgress.set(orderId, promise);
    return promise;
  };

  const handleClick = async () => {
    setActiveService('currencyExchange');

    if (clientOrderItems.length !== 0) return;

    await handleAddCurrencyExchange();
  };

  useEffect(() => {
    if (
      currencyCalculatorResults.amountInSelectedCurrencyTo === 0 ||
      currencyCalculatorResults.amountInSelectedCurrencyFrom === 0 ||
      currencyCalculatorResults.exchangeRate === 0 ||
      currencyCalculatorResults.fromCurrencyName === '' ||
      currencyCalculatorResults.toCurrencyName === ''
    )
      return;

    if (!currenciesData) return;

    if (clientOrderItems.length !== 0) return;

    runOnceForItem(order.id, handleAddCurrencyExchange);
  }, [currenciesData]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <Button
      disabled={disabled || !currenciesData}
      onClick={() => handleClick()}
      variant={activeService === 'currencyExchange' ? 'accent' : 'secondary'}
      size="sm"
      className="border-none"
    >
      + Currency Exchange
    </Button>
  );
};

export default AddExchangeButton;
