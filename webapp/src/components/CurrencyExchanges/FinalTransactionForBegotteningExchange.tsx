import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import React, { useEffect, useState } from 'react';
import useCurrencyExchangeStore, {
  StoreCurrencyExchange,
  StoreTransaction,
} from '@/stores/currencyExchange/currency-exchange-store';
import { Button } from '@/components/ui/button';
import TransactionCheckUpload from '@/components/CurrencyExchanges/TransactionCheckUpload';
import { getCurrencySymbol } from '@/utils/currency';
import {CircleCheck} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import BankingDetailsButton from "@/components/CurrencyExchanges/BankingDetailsButton";

const FinalTransactionForBegotteningExchange = ({
  selectedCurrencyExchange,
  transaction,
  users,
  handleEditTransaction,
  copiedText,
  bankingDetailsContent,
  bankingDetailsUrl,
  handleCopyToClipboard,
  handleDownloadBankingDetailsFile,
  summary,
  summaryIsOpened,
  setSummaryIsOpened,
  updateStatusTransaction,
}: {
  selectedCurrencyExchange: StoreCurrencyExchange | undefined;
  transaction: StoreTransaction;
  users: any[];
  handleEditTransaction: (transaction: StoreTransaction) => void;
  copiedText: string | undefined;
  bankingDetailsContent: string | undefined;
  bankingDetailsUrl: string | undefined;
  handleCopyToClipboard: (event: React.MouseEvent, text: string) => void;
  handleDownloadBankingDetailsFile: (documentUrl: string) => void;
  summary: string;
  summaryIsOpened: boolean;
  setSummaryIsOpened: (open: boolean | ((prevState: boolean) => boolean)) => void;
  updateStatusTransaction: (id: string, newStatus: string) => void;
}) => {
  const { allCurrencyExchanges, setAllCurrencyExchanges } = useCurrencyExchangeStore();

  const [currentSenderId, setCurrentSenderId] = useState<string | undefined>(transaction.senderId);
  const [currentIsInCash, setCurrentIsInCash] = useState(transaction.isInCash || false);
  const [currentCheckUrl, setCurrentCheckUrl] = useState<string | undefined | null>(transaction.checkUrl);

  const [clientInformed, setClientInformed] = useState<boolean>(false);

  const [isShowMore, setIsShowMore] = useState<boolean>(false);

  const handleSave = () => {
    handleEditTransaction({
      id: transaction.id,
      status: transaction.status,
      isCompanyTransaction: transaction.isCompanyTransaction,
      amountInSelectedCurrency: transaction.amountInSelectedCurrency,
      checkUrl: currentCheckUrl,
      senderId: currentSenderId,
      isInCash: currentIsInCash,
    });
  };

  useEffect(() => {
    handleSave();
  }, [currentSenderId, currentIsInCash, currentCheckUrl]);

  useEffect(() => {
    if (selectedCurrencyExchange?.status === 'finished') {
      return;
    }

    if (['paid_uninformed'].includes(transaction.status) && clientInformed) {
      handleChangeStatus('paid_informed')
    } else if (['paid_informed'].includes(transaction.status) && !clientInformed) {
      handleChangeStatus('paid_uninformed')
    }
  }, [clientInformed]);

  const updateStatusCurrencyExchangeMutation = trpc.currencyExchange.updateStatus.useMutation({
    onError: (error: any) => {
      toast.error('Failed', {
        description: error.message,
      });
    },
  });

  const handleCompleteExchange = async () => {
    try {
      if (selectedCurrencyExchange?.id) {
        await updateStatusCurrencyExchangeMutation.mutateAsync({
          id: selectedCurrencyExchange?.id,
          status: 'finished',
        });

        setAllCurrencyExchanges([
          ...allCurrencyExchanges.filter(ex => ex.id !== selectedCurrencyExchange?.id),
          {
            ...selectedCurrencyExchange,
            status: 'finished',
          },
        ]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleChangeStatus = (newStatus: string) => {
    updateStatusTransaction(transaction.id, newStatus);
  };

  if (!selectedCurrencyExchange || !transaction) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <h3 className="font-medium text-lg mb-2">
          Error during loading currency exchange and final transaction!
        </h3>
      </div>
    );
  }

  return (
    <div className="text-sm flex flex-col gap-2">
      <div className="flex justify-between">
        <div className="flex gap-1">
          {selectedCurrencyExchange.toCurrency?.name && (
            <Select value={selectedCurrencyExchange.toCurrency.id} disabled={true}>
              <SelectTrigger>
                <SelectValue placeholder="Select a currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Currencies</SelectLabel>
                  <SelectItem value={selectedCurrencyExchange.toCurrency.id}>
                    {selectedCurrencyExchange.toCurrency.name}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          )}

          <Input
            disabled={true}
            className="max-w-2/3"
            placeholder="Amount..."
            value={`${transaction.amountInSelectedCurrency} ${getCurrencySymbol(selectedCurrencyExchange.toCurrency.name)}`}
          />
        </div>

        <div className="flex gap-2 content-center flex-wrap">
          <div>Cash</div>
          <Switch
            disabled={['check_uploaded', 'paid_uninformed', 'paid_informed', 'completed'].includes(
              transaction.status
            )}
            checked={currentIsInCash}
            onClick={() => setCurrentIsInCash(prevState => !prevState)}
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Select
          disabled={
            ([
              'check_uploaded',
              'paid_uninformed',
              'paid_informed',
            ].includes(transaction.status) && !!transaction.senderId)
            || ['completed', 'cancelled'].includes(transaction.status)
          }
          value={currentSenderId}
          onValueChange={(senderId: string) => setCurrentSenderId(senderId)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Paid by" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {users?.map(user => {
                if (user.Client[0]) {
                  return (
                    <SelectItem key={user.Client[0].id} value={user.Client[0].id}>
                      {`${user.Client[0].firstName} ${user.Client[0].lastName}`
                        .replace(/\s+/g, ' ')
                        .trim()}
                    </SelectItem>
                  );
                }
              })}
            </SelectGroup>
          </SelectContent>
        </Select>

        <div className="max-w-1/4">
          <BankingDetailsButton
            copiedText={copiedText}
            bankingDetailsContent={bankingDetailsContent}
            bankingDetailsUrl={bankingDetailsUrl}
            handleCopyToClipboard={handleCopyToClipboard}
            handleDownloadBankingDetailsFile={handleDownloadBankingDetailsFile}
          />
        </div>
      </div>

      <div hidden={transaction.status !== 'completed'}>
        <Button
          className="text-xs"
          variant="ghost"
          onClick={() => setIsShowMore(prevState => !prevState)}
        >
          {isShowMore ? 'Show less' : 'Show more'}
        </Button>
      </div>
      <div
        className="flex flex-wrap justify-start items-center gap-6"
        hidden={transaction.status === 'completed' && !isShowMore}
      >
        {/*Check upload section*/}
        <TransactionCheckUpload
          handleCheckUpload={(checkUrl: string) => {
            setCurrentCheckUrl(checkUrl);
            handleChangeStatus('check_uploaded');
          }}
          handleCheckDelete={() => {
            if (transaction.status === 'check_uploaded') {
              handleChangeStatus('details_sent');
              console.log("deleted")
            }

            setCurrentCheckUrl(null)
          }}
          existingTransaction={transaction}
          disableDelete={transaction.status === 'completed'}
        />
      </div>

      <div>
        <Card className="flex flex-row gap-2 justify-between p-4 bg-secondary">
          <div
            className={`${!summaryIsOpened ? 'line-clamp-2' : ''} whitespace-pre-line text-gray-500 text-xs`}
          >
            {summary}
          </div>
          <div className="flex gap-1">
            <Button
              variant="secondary"
              onClick={() => setSummaryIsOpened((prevState: boolean) => !prevState)}
            >
              {summaryIsOpened ? 'Close' : 'Open'}
            </Button>
            <Button
              variant="secondary"
              className={`${
                copiedText === summary
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-muted hover:bg-muted/80'
              }`}
              onClick={e => handleCopyToClipboard(e, summary)}
            >
              Copy
            </Button>
          </div>
        </Card>
      </div>

      {!['paid_uninformed', 'paid_informed', 'completed'].includes(transaction.status) && (
        <div className="w-full">
          <Button
            className="w-full"
            variant="accent-green"
            disabled={!['check_uploaded'].includes(transaction.status)}
            onClick={() => handleChangeStatus('paid_uninformed')}
          >
            Confirm payment
          </Button>
        </div>
      )}

      {['paid_uninformed', 'paid_informed', 'completed'].includes(transaction.status) && (
        <div className="flex justify-end gap-2 items-center">
          <div className="flex gap-1 items-center">
            <span>Client informed</span>
            <Switch
              checked={clientInformed}
              onClick={() => setClientInformed(prevState => !prevState)}
              disabled={['completed'].includes(transaction.status) || selectedCurrencyExchange.status === 'finished'}
            />
          </div>
          {selectedCurrencyExchange.status === 'finished' ? (
            <div className="flex gap-2 items-center">
              <span>Exchange completed</span>
              <CircleCheck className="w-4 text-success" />
            </div>
          ) : (
            <Button
              variant="accent-green"
              disabled={!['paid_informed'].includes(transaction.status)}
              onClick={() => {
                handleChangeStatus('completed');
                handleCompleteExchange();
              }}
            >
              Exchange completed
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default FinalTransactionForBegotteningExchange;
