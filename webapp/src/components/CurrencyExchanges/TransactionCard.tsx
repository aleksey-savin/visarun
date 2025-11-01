import { Card } from '@/components/ui/card';
import IconLoader from '@/assets/tabler-icons/IconLoader';
import { formatCurrency } from '@/utils/currency';
import Summ from '@/components/ui/summ';
import { Badge } from '@/components/ui/badge';
import { Check, CircleCheck, Copy, Crown, Download, Trash2 } from 'lucide-react';
import ContactMethodIcon from '../ContactMethod/ContactMethodIcon';
import React, { useEffect, useState } from 'react';
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
import TransactionCheckUpload from '@/components/CurrencyExchanges/TransactionCheckUpload';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import useCurrencyExchangeStore, {
  StoreCurrencyExchange,
  StoreTransaction,
} from '@/stores/currencyExchange/currency-exchange-store';
import ExchangeTag from '@/components/CurrencyExchanges/ExchangeTag';

const TransactionCard = ({
  transaction,
  exchangeDetailsToShow,
  handleDeleteTransaction,
  handleEditTransaction,
  copiedText,
  handleCopyToClipboard,
  users,
  updateStatusTransaction,
}: {
  transaction: StoreTransaction;
  exchangeDetailsToShow: StoreCurrencyExchange | undefined;
  handleDeleteTransaction: (id: string) => void;
  handleEditTransaction: (transaction: StoreTransaction) => void;
  copiedText: string | undefined;
  handleCopyToClipboard: (event: React.MouseEvent, text: string) => void;
  users: any[];
  updateStatusTransaction: (id: string, newStatus: string) => void;
}) => {
  const { allCurrencyExchanges } = useCurrencyExchangeStore();

  const [currentAmount, setCurrentAmount] = useState<number | undefined>(
    transaction.amountInSelectedCurrency || 0
  );
  const [currentCheckUrl, setCurrentCheckUrl] = useState<string | undefined | null>(
    transaction.checkUrl
  );
  const [currentSenderId, setCurrentSenderId] = useState<string | undefined>(transaction.senderId);
  const [currentIsInCash, setCurrentIsInCash] = useState(transaction.isInCash || false);

  const [summaryIsOpened, setSummaryIsOpened] = useState<boolean>(false);
  const [isShowMore, setIsShowMore] = useState<boolean>(false);

  const parentExchange = allCurrencyExchanges.find(
    (ex: StoreCurrencyExchange) => ex.id === transaction.currencyExchangeId
  );
  const bankingDetailsContent = !exchangeDetailsToShow?.isBegottening ? exchangeDetailsToShow?.orderItem?.client?.bankingDetails?.content : null;
  const bankingDetailsUrl = !exchangeDetailsToShow?.isBegottening ? exchangeDetailsToShow?.orderItem?.client?.bankingDetails?.documentUrl : null;

  const handleDownloadBankingDetailsFile = (documentUrl: string) => {
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/upload/file/${documentUrl}`;

    // Element will not be visible
    const link = document.createElement('a');
    link.href = url;
    link.download = documentUrl.split('/')[1];
    link.click();
  };

  const handleSave = () => {
    handleEditTransaction({
      id: transaction.id,
      status: transaction.status,
      isCompanyTransaction: transaction.isCompanyTransaction,
      amountInSelectedCurrency: Number(currentAmount) || 0,
      checkUrl: currentCheckUrl,
      senderId: currentSenderId,
      isInCash: currentIsInCash,
    });
  };

  const handleChangeStatus = (newStatus: string) => {
    updateStatusTransaction(transaction.id, newStatus);
  };

  const summary = `COMPLETE ORDER SUMMARY
        OrderID: 953c8cf5-85fa-4d94-9dce-62a343a5cbc2
        Date: 17.10.2025

        ALL SERVICES:
        ==================================================
        1. Exchange
           Client: Хочу донги
           Amount: 1 000 000 000 đ  →  50 000 ₽

        ==================================================
        TOTAL ORDER AMOUNT: 1 000 000 000 đ

        Thank you for choosing our exchange services.
    `;

  useEffect(() => {
    handleSave();
  }, [currentSenderId, currentIsInCash, currentCheckUrl]);

  if (!exchangeDetailsToShow && !transaction.isCompanyTransaction) {
    return <div>Error: parent exchange was not found</div>;
  }

  return (
    <Card
      className={`${
        transaction.status === 'paid_uninformed' || transaction.status === 'paid_informed'
          ? 'border-gray-50 border-dashed'
          : transaction.status === 'completed'
            ? 'border-success'
            : transaction.isCompanyTransaction
              ? 'border-blue-400'
              : ''
      } bg-secondary text-sm p-4 flex flex-col gap-5`}
    >
      <div className="flex justify-between">
        {transaction.isCompanyTransaction ? (
          <div
            className={`${transaction.status === 'completed' ? 'text-success' : 'text-blue-400'} flex gap-1`}
          >
            <span>Company payment</span>
            {transaction.status === 'completed' && <CircleCheck className="w-4" />}
          </div>
        ) : (
          <div className="flex gap-2">
            <div
              className={`${transaction.status === 'completed' ? `text-success` : ''} flex gap-1`}
            >
              <span>Payment</span>
              {transaction.status === 'completed' && <CircleCheck className="w-4" />}
            </div>
            {transaction.amountInSelectedCurrency &&
              exchangeDetailsToShow?.toCurrency?.name &&
              transaction.status !== 'completed' && (
                <div>
                  <Summ className="bg-amber-600">
                    <IconLoader />
                    {formatCurrency(
                      transaction.amountInSelectedCurrency,
                      exchangeDetailsToShow.toCurrency.name
                    )}
                  </Summ>
                </div>
              )}
          </div>
        )}

        <div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this transaction? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDeleteTransaction(transaction.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {!transaction.isCompanyTransaction && (
          <>
            <div className="flex gap-2">
              <div>
                {exchangeDetailsToShow?.orderItem?.client && (
                  <Badge variant="primary" className="justify-start">
                    <Crown />
                    <span>
                      {exchangeDetailsToShow.orderItem.client.firstName || `Item: ${exchangeDetailsToShow.orderItemId}`}{' '}
                      {exchangeDetailsToShow.orderItem.client.lastName || ''}
                    </span>
                  </Badge>
                )}
              </div>
              {exchangeDetailsToShow && (
                <div>
                  <ExchangeTag currencyExchange={exchangeDetailsToShow} />
                </div>
              )}
            </div>
            <div>
              {exchangeDetailsToShow?.orderItem?.client?.user?.contactMethods
                ?.filter((contact: any) => contact.method)
                .map((contact: any) => (
                  <Badge
                    key={contact.id}
                    variant="secondary"
                    className={`cursor-pointer transition-all duration-300 ${
                      copiedText === contact.value && copiedText
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    onClick={e =>
                      contact.value && contact.id && handleCopyToClipboard(e, contact.value)
                    }
                  >
                    <ContactMethodIcon
                      method={
                        contact.method
                          ? { name: contact.method.name, icon: contact.method.icon }
                          : { name: 'unknown', icon: null }
                      }
                      className="w-3 h-3"
                    />
                    {` ${contact.value}`}
                    {copiedText === contact.value && copiedText ? (
                      <Check className="w-3 h-3 ml-1 animate-pulse" />
                    ) : (
                      <Copy className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
            </div>
          </>
        )}

        <div className="flex justify-between">
          <div className="flex justify-between">
            <div className="flex gap-1">
              {parentExchange?.toCurrency?.name && (
                <Select value={parentExchange.toCurrency.id} disabled={true}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Currencies</SelectLabel>
                      <SelectItem value={parentExchange.toCurrency.id}>
                        {parentExchange.toCurrency.name}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}

              <Input
                disabled={
                  [
                    'details_sent',
                    'check_uploaded',
                    'paid_uninformed',
                    'paid_informed',
                    'completed',
                  ].includes(transaction.status) || !transaction.isCompanyTransaction
                }
                className="max-w-2/3"
                placeholder="Amount..."
                value={currentAmount}
                onBlur={handleSave}
                onChange={e => {
                  if (!isNaN(Number(e.target.value))) {
                    setCurrentAmount(Number(e.target.value));
                  }
                }}
              />
            </div>

            <div className="flex gap-2 content-center flex-wrap">
              <div>Cash</div>
              <Switch
                disabled={[
                  'check_uploaded',
                  'paid_uninformed',
                  'paid_informed',
                  'completed',
                ].includes(transaction.status)}
                checked={currentIsInCash}
                onClick={() => setCurrentIsInCash(prevState => !prevState)}
              />
            </div>
          </div>

          {(bankingDetailsUrl || bankingDetailsContent) && (
            <div className="max-w-1/4">
              <Button
                className={`${
                  copiedText === bankingDetailsContent && bankingDetailsContent
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-muted hover:bg-muted/80'
                } w-full overflow-hidden hover:bg-gray-500`}
                onClick={e => {
                  if (bankingDetailsContent) handleCopyToClipboard(e, bankingDetailsContent);
                  else if (bankingDetailsUrl) handleDownloadBankingDetailsFile(bankingDetailsUrl);
                }}
                variant="secondary"
              >
                {bankingDetailsContent ? (
                  <>
                    {copiedText === bankingDetailsContent ? (
                      <Check className="w-3 h-3 ml-1 animate-pulse" />
                    ) : (
                      <Copy className="w-3 h-3 ml-1" />
                    )}
                    <span className="block truncate text-ellipsis">{bankingDetailsContent}</span>
                  </>
                ) : (
                  <div className="flex gap-1">
                    <Download />
                    <span className="block truncate text-ellipsis">
                      Download Banking Details File
                    </span>
                  </div>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
      {transaction?.isCompanyTransaction && (
        <div>
          <Select
            disabled={
              ([
                'details_sent',
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
                        {/*&& user.roleAssignments.every(ra => ra.role.name !== 'client')*/}
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
        </div>
      )}
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
          handleCheckDelete={() => setCurrentCheckUrl(null)}
          existingTransaction={transaction}
          disableDelete={transaction.status === 'completed'}
        />
      </div>
      <div
        className="flex gap-2"
        hidden={['paid_uninformed', 'paid_informed', 'completed'].includes(transaction.status)}
      >
        {!transaction.isCompanyTransaction && (
          <Button
            className="flex-1"
            variant="secondary"
            disabled={['check_uploaded'].includes(transaction.status)}
            onClick={() =>
              handleChangeStatus(
                ['check_uploaded', 'details_sent'].includes(transaction.status)
                  ? 'draft'
                  : 'details_sent'
              )
            }
          >
            {['check_uploaded', 'details_sent'].includes(transaction.status)
              ? 'Undo'
              : 'Details sent'}
          </Button>
        )}
        <Button
          className="flex-1"
          variant="accent-green"
          disabled={!currentCheckUrl || !currentAmount || !currentSenderId}
          onClick={() => handleChangeStatus('paid_uninformed')}
        >
          Confirm payment
        </Button>
      </div>

      <div
        className="flex flex-col gap-3"
        hidden={
          ['draft', 'details_sent', 'check_uploaded'].includes(transaction.status) ||
          (transaction.status === 'completed' && !isShowMore)
        }
      >
        <span
          hidden={['paid_uninformed', 'paid_informed', 'completed'].includes(transaction.status)}
        >
          Payment summary for{' '}
          {users?.find(us => us.Client[0]?.id === transaction.senderId)?.Client[0]?.firstName}{' '}
          {users?.find(us => us.Client[0]?.id === transaction.senderId)?.Client[0]?.lastName}
        </span>
        <Card
          className="flex flex-row gap-2 justify-between p-4 bg-secondary"
          hidden={['paid_uninformed', 'paid_informed', 'completed'].includes(transaction.status)}
        >
          <div
            className={`${!summaryIsOpened ? 'line-clamp-2' : ''} whitespace-pre-line text-gray-500 text-xs`}
          >
            {summary}
          </div>
          <div className="flex gap-1">
            <Button variant="secondary" onClick={() => setSummaryIsOpened(prevState => !prevState)}>
              {summaryIsOpened ? 'Close' : 'Open'}
            </Button>
            <Button
              variant="secondary"
              className={`${
                copiedText === summary && copiedText
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-muted hover:bg-muted/80'
              }`}
              onClick={e => handleCopyToClipboard(e, summary)}
            >
              Copy
            </Button>
          </div>
        </Card>

        <div className="flex justify-end gap-4" hidden={transaction.status === 'completed'}>
          <div className="flex items-center gap-2">
            <span>Both parties to the transaction are informed</span>
            <Switch
              checked={['paid_informed', 'completed'].includes(transaction.status)}
              onClick={() => handleChangeStatus('paid_informed')}
            />
          </div>
          <Button
            variant="accent-green"
            disabled={!['paid_informed'].includes(transaction.status)}
            onClick={() => handleChangeStatus('completed')}
          >
            Payment completed
          </Button>
        </div>
      </div>
      {/*<div>*/}
      {/*    {transaction.status}*/}
      {/*</div>*/}
    </Card>
  );
};

export default TransactionCard;
