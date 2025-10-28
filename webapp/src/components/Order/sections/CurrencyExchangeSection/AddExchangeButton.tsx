import { trpc } from '@/lib/trpc';
import useOrderStore, { StoreClient, StoreCurrencyExchange } from '@/stores/order/order-store';
import { Button } from '@/components/ui/button';
import useCurrencyCalculatorStore from "@/stores/currencyCalculator/currency-calculator-store";
import {useEffect, useRef} from "react";

const AddExchangeButton = ({
  client,
  disabled,
  setActiveService,
}: {
  client: StoreClient;
  disabled: boolean;
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

  const {
    currencyCalculatorResults,
    setCurrencyCalculatorResults,
  } = useCurrencyCalculatorStore();

  const clientOrderItems =
    orderItems?.filter(
      item => item.clientId === client.id && item.serviceType === 'currencyExchange'
    ) || [];

  const createOrderItemMutation = trpc.orderItem.create.useMutation();

  const {
    data: currenciesData,
    error: error,
    isLoading: loading,
  } = trpc.currency.getAll.useQuery({
    search: '',
  });

  const alreadyAddedCurrencyExchange = useRef<boolean>(false);

  const handleAddCurrencyExchange = async () => {
    setSaveStatus('saving');

    const newData = await createOrderItemMutation.mutateAsync({
      amountInSelectedCurrencyFrom: currencyCalculatorResults.amountInSelectedCurrencyFrom,
      amountInSelectedCurrencyTo: currencyCalculatorResults.amountInSelectedCurrencyTo,
      exchangeRate: currencyCalculatorResults.exchangeRate,
      fromCurrencyId: currenciesData?.currencies?.find((curr: any) => curr.name === currencyCalculatorResults.fromCurrencyName)?.id ?? undefined,
      toCurrencyId: currenciesData?.currencies?.find((curr: any) => curr.name === currencyCalculatorResults.toCurrencyName)?.id ?? undefined,
      orderId: order.id || '',
      clientId: client.id,
      serviceType: 'currencyExchange',
      basePrice: 0,
      finalPrice: 0,
    });

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

  const handleClickOrAutoAdd = async () => {
    setActiveService('currencyExchange');

    if (clientOrderItems.length !== 0) return;

    await handleAddCurrencyExchange();
  };

  useEffect(() => {
    if (
      currencyCalculatorResults.amountInSelectedCurrencyTo === 0
      || currencyCalculatorResults.amountInSelectedCurrencyFrom === 0
      || currencyCalculatorResults.exchangeRate === 0
      || currencyCalculatorResults.fromCurrencyName === ''
      || currencyCalculatorResults.toCurrencyName === ''
      || alreadyAddedCurrencyExchange.current
    ) return;

    alreadyAddedCurrencyExchange.current = true;

    handleClickOrAutoAdd();
  }, []);

  if (loading) {
    return (
      <div>
        Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div>
        Error: {error.message}
      </div>
    )
  }

  return (
    <Button
      disabled={disabled}
      onClick={() => handleClickOrAutoAdd()}
      variant="secondary"
      size="sm"
      className="border-none"
    >
      + Currency Exchange
    </Button>
  );
};

export default AddExchangeButton;
