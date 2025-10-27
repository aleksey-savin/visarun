import useCurrencyExchangeStore, {
  StoreTransaction,
} from '@/stores/currencyExchange/currency-exchange-store.ts';
import BegottenTransactionsSelectionTable from '@/components/Order/sections/CurrencyExchangeSection/BegottenTransactionsSelectionTable.tsx';
import BegottenTransactionsSummary from '@/components/Order/sections/CurrencyExchangeSection/BegottenTransactionsSummary.tsx';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { trpc } from '@/lib/trpc.ts';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button.tsx';

const CurrencyExchangePuzzle = ({
  begotteningCurrencyExchangeId,
  clientId,
  onEditOrder,
  handleFinishPuzzling,
}: {
  begotteningCurrencyExchangeId: string;
  clientId: string;
  onEditOrder: () => void;
  handleFinishPuzzling: () => void;
}) => {
  const {
    currencyExchanges,
    setCurrencyExchanges,
    begotteningCurrencyExchange,
    setBegotteningCurrencyExchange,
  } = useCurrencyExchangeStore();

  const {
    data: begotteningCurrencyExchangeData,
    isLoading: isLoadingBegotteningCurrencyExchange,
    error: errorInBegotteningCurrencyExchange,
  } = trpc.currencyExchange.getOne.useQuery({
    id: begotteningCurrencyExchangeId,
  });

  const {
    data: currencyExchangesData,
    isLoading: isLoadingCurrencyExchanges,
    error: errorInCurrencyExchanges,
  } = trpc.currencyExchange.getAll.useQuery(
    {
      status: 'in_progress',
      toCurrencyId: begotteningCurrencyExchange?.fromCurrencyId,
    },
    {
      enabled: begotteningCurrencyExchange?.id === begotteningCurrencyExchangeId,
    }
  );

  useEffect(() => {
    if (!currencyExchangesData) return;

    setCurrencyExchanges(
      currencyExchangesData?.currencyExchanges?.map(exchange => ({
        ...exchange,
        amountInSelectedCurrencyFrom: exchange.amountInSelectedCurrencyFrom
          ? Number(exchange.amountInSelectedCurrencyFrom)
          : undefined,
        amountInSelectedCurrencyTo: exchange.amountInSelectedCurrencyTo
          ? Number(exchange.amountInSelectedCurrencyTo)
          : undefined,
        exchangeRate: exchange.exchangeRate ? Number(exchange.exchangeRate) : undefined,
        minTransactionAmountInSelectedCurrency: exchange.minTransactionAmountInSelectedCurrency
          ? Number(exchange.minTransactionAmountInSelectedCurrency)
          : undefined,
        fromCurrency: exchange.fromCurrency || { id: '', name: '', isBegottening: false },
        toCurrency: exchange.toCurrency || { id: '', name: '', isBegottening: false },
        deadline: exchange.deadline ? new Date(exchange.deadline) : undefined,
        createdAt: new Date(exchange.createdAt),
        updatedAt: new Date(exchange.updatedAt),
        transactions:
          exchange.transactions?.map(transaction => ({
            ...transaction,
            amountInSelectedCurrency: transaction.amountInSelectedCurrency
              ? Number(transaction.amountInSelectedCurrency)
              : null,
          })) || [],
        begottenTransactions:
          exchange.begottenTransactions?.map(transaction => ({
            ...transaction,
            amountInSelectedCurrency: transaction.amountInSelectedCurrency
              ? Number(transaction.amountInSelectedCurrency)
              : null,
          })) || [],

        canceledByClient: exchange.canceledByClient || false,
        orderItem: exchange.orderItem
          ? {
              ...exchange.orderItem,
              client: {
                ...exchange.orderItem.client,
                bankingDetails: exchange.orderItem.client.bankingDetails || {
                  id: '',
                  content: '',
                  documentUrl: '',
                },
                firstName: exchange.orderItem.client.firstName || '',
                lastName: exchange.orderItem.client.lastName || '',
              },
            }
          : undefined,
      })) || []
    );
  }, [currencyExchangesData]);

  useEffect(() => {
    if (!begotteningCurrencyExchangeData) return;

    const exchange = begotteningCurrencyExchangeData.exchange;
    setBegotteningCurrencyExchange({
      ...exchange,
      amountInSelectedCurrencyFrom: exchange.amountInSelectedCurrencyFrom
        ? Number(exchange.amountInSelectedCurrencyFrom)
        : undefined,
      amountInSelectedCurrencyTo: exchange.amountInSelectedCurrencyTo
        ? Number(exchange.amountInSelectedCurrencyTo)
        : undefined,
      exchangeRate: exchange.exchangeRate ? Number(exchange.exchangeRate) : undefined,
      minTransactionAmountInSelectedCurrency: exchange.minTransactionAmountInSelectedCurrency
        ? Number(exchange.minTransactionAmountInSelectedCurrency)
        : undefined,
      fromCurrency: exchange.fromCurrency || { id: '', name: '', isBegottening: false },
      toCurrency: exchange.toCurrency || { id: '', name: '', isBegottening: false },
      deadline: exchange.deadline ? new Date(exchange.deadline) : undefined,
      createdAt: new Date(exchange.createdAt),
      updatedAt: new Date(exchange.updatedAt),
      canceledByClient: exchange.canceledByClient || false,
      transactions:
        exchange.transactions?.map(transaction => ({
          ...transaction,
          amountInSelectedCurrency: transaction.amountInSelectedCurrency
            ? Number(transaction.amountInSelectedCurrency)
            : null,
        })) || [],
      begottenTransactions:
        exchange.begottenTransactions?.map(transaction => ({
          ...transaction,
          amountInSelectedCurrency: transaction.amountInSelectedCurrency
            ? Number(transaction.amountInSelectedCurrency)
            : null,
        })) || [],
      orderItem: exchange.orderItem
        ? {
            ...exchange.orderItem,
            client: {
              ...exchange.orderItem.client,
              firstName: exchange.orderItem.client.firstName || '',
              lastName: exchange.orderItem.client.lastName || '',
            },
          }
        : undefined,
    });
  }, [begotteningCurrencyExchangeData]);

  const createMaximumTransactionMutation = trpc.transaction.createMaximum.useMutation({
    onError: (error: any) => {
      toast.error('Failed', {
        description: error.message,
      });
    },
  });

  const deleteTransactionMutation = trpc.transaction.delete.useMutation({
    onError: (error: any) => {
      toast.error('Failed', {
        description: error.message,
      });
    },
  });

  const handleSelectBegottenTransaction = async (whereToAddExchangeId: string) => {
    if (!begotteningCurrencyExchange) return;

    const alreadyCreatedTransaction = begotteningCurrencyExchange.begottenTransactions.find(
      (tr: StoreTransaction) =>
        tr.currencyExchangeId === whereToAddExchangeId && !!tr.currencyExchangeId
    );
    if (!alreadyCreatedTransaction) {
      await createBegottenTransaction(whereToAddExchangeId);
    } else {
      await deleteBegottenTransaction(whereToAddExchangeId, alreadyCreatedTransaction.id);
    }
  };

  const createBegottenTransaction = async (whereToAddExchangeId: string) => {
    try {
      const whereToAddExchange = currencyExchanges.find(ex => ex.id === whereToAddExchangeId);

      if (
        !begotteningCurrencyExchange ||
        !whereToAddExchange ||
        !begotteningCurrencyExchange.amountInSelectedCurrencyFrom
      ) {
        throw Error('begotteningExchange and whereToAddExchange are required');
      }

      const maximumAmountInSelectedCurrency =
        begotteningCurrencyExchange.amountInSelectedCurrencyFrom -
        (begotteningCurrencyExchange.inProgressBegottenTransactionsAmountInSelectedCurrency || 0);

      const newTransactionData = (await createMaximumTransactionMutation.mutateAsync({
        currencyExchangeId: whereToAddExchangeId,
        isCompanyTransaction: false,
        begottenByCurrencyExchangeId: begotteningCurrencyExchange.id,
        senderId: clientId,
        maximumAmountInSelectedCurrency: maximumAmountInSelectedCurrency,
      })) as { newTransaction?: any };

      const newTransaction = {
        id: newTransactionData?.newTransaction?.id,
        amountInSelectedCurrency: newTransactionData?.newTransaction?.amountInSelectedCurrency,
        checkUrl: newTransactionData?.newTransaction?.checkUrl,
        status: newTransactionData?.newTransaction?.status,
        isCompanyTransaction: newTransactionData?.newTransaction?.isCompanyTransaction,
        isInCash: newTransactionData?.newTransaction?.isInCash,
        senderId: newTransactionData?.newTransaction?.senderId || '',
        begottenByCurrencyExchangeId:
          newTransactionData?.newTransaction?.begottenByCurrencyExchangeId,
        currencyExchangeId: newTransactionData?.newTransaction?.currencyExchangeId,
      };

      const newTransactions = [...(whereToAddExchange?.transactions || []), newTransaction];

      const inProgress = newTransactions
        .filter(t => !['completed', 'cancelled'].includes(t.status))
        .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

      const finished = newTransactions
        .filter(t => ['completed'].includes(t.status))
        .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

      const newBegottenTransactions = [
        ...begotteningCurrencyExchange.begottenTransactions,
        newTransaction,
      ];

      const inProgressBegotten = newBegottenTransactions
        .filter(t => !['completed', 'cancelled'].includes(t.status))
        .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

      const finishedBegotten = newBegottenTransactions
        .filter(t => ['completed'].includes(t.status))
        .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

      setCurrencyExchanges([
        ...currencyExchanges.filter(ex => ex.id !== whereToAddExchangeId),
        {
          ...whereToAddExchange,
          inProgressTransactionsAmountInSelectedCurrency: inProgress,
          finishedTransactionsAmountInSelectedCurrency: finished,
          transactions: newTransactions,
        },
      ]);

      setBegotteningCurrencyExchange({
        ...begotteningCurrencyExchange,
        inProgressBegottenTransactionsAmountInSelectedCurrency: inProgressBegotten,
        finishedBegottenTransactionsAmountInSelectedCurrency: finishedBegotten,
        begottenTransactions: newBegottenTransactions,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const deleteBegottenTransaction = async (
    whereToDeleteExchangeId: string,
    transactionId: string
  ) => {
    try {
      const whereToDeleteExchange = currencyExchanges.find(ex => ex.id === whereToDeleteExchangeId);

      if (!whereToDeleteExchange || !begotteningCurrencyExchange) {
        throw Error('whereToDeleteExchange is required');
      }

      await deleteTransactionMutation.mutateAsync({
        id: transactionId,
      });

      const newTransactions =
        whereToDeleteExchange.transactions?.filter(tr => tr.id !== transactionId) || [];

      const inProgress = newTransactions
        .filter(t => !['completed', 'cancelled'].includes(t.status))
        .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

      const finished = newTransactions
        .filter(t => ['completed'].includes(t.status))
        .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

      const newBegottenTransactions = begotteningCurrencyExchange.begottenTransactions.filter(
        tr => tr.id !== transactionId
      );

      const inProgressBegotten = newBegottenTransactions
        .filter(t => !['completed', 'cancelled'].includes(t.status))
        .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

      const finishedBegotten = newBegottenTransactions
        .filter(t => ['completed'].includes(t.status))
        .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

      setCurrencyExchanges([
        ...currencyExchanges.filter(ex => ex.id !== whereToDeleteExchangeId),
        {
          ...whereToDeleteExchange,
          transactions: newTransactions,
          inProgressTransactionsAmountInSelectedCurrency: inProgress,
          finishedTransactionsAmountInSelectedCurrency: finished,
        },
      ]);

      setBegotteningCurrencyExchange({
        ...begotteningCurrencyExchange,
        inProgressBegottenTransactionsAmountInSelectedCurrency: inProgressBegotten,
        finishedBegottenTransactionsAmountInSelectedCurrency: finishedBegotten,
        begottenTransactions: newBegottenTransactions,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col p-5 gap-5 justify-between">
      <div className="flex flex-col gap-5">
        {!isLoadingBegotteningCurrencyExchange &&
          !errorInBegotteningCurrencyExchange &&
          begotteningCurrencyExchange && (
            <BegottenTransactionsSummary
              currencyExchange={begotteningCurrencyExchange}
              onEditOrder={onEditOrder}
            />
          )}

        {isLoadingCurrencyExchanges || isLoadingBegotteningCurrencyExchange ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : errorInCurrencyExchanges || errorInBegotteningCurrencyExchange ? (
          <div className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>
                Error loading exchanges: {errorInCurrencyExchanges?.message}{' '}
                {errorInBegotteningCurrencyExchange?.message}
              </span>
            </div>
          </div>
        ) : currencyExchanges.length !== 0 && begotteningCurrencyExchange ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block text-gray-400">
              <div className="overflow-x-auto rounded-md border border-muted">
                <BegottenTransactionsSelectionTable
                  allCurrencyExchanges={currencyExchanges}
                  currencyExchange={begotteningCurrencyExchange}
                  handleSelectBegottenTransaction={handleSelectBegottenTransaction}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No currency exchanges found matching your criteria.
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <div className="w-3/4 ">
          {/*bg-blue-950*/}
          {/*Company banking details*/}
        </div>

        <Button
          disabled={
            !Number(
              begotteningCurrencyExchange?.inProgressBegottenTransactionsAmountInSelectedCurrency
            ) ||
            Number(
              begotteningCurrencyExchange?.inProgressBegottenTransactionsAmountInSelectedCurrency
            ) !== Number(begotteningCurrencyExchange?.amountInSelectedCurrencyFrom)
          }
          onClick={handleFinishPuzzling}
        >
          <span>Confirm & go to currency exchanges table</span>
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
};

export default CurrencyExchangePuzzle;
