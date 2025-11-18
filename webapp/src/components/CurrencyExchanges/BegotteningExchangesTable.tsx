import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import IconArrowShuffle from '@/assets/tabler-icons/IconArrowShuffle';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {Check, Crown, Edit, Eye, Loader} from 'lucide-react';
import { formatCurrency, getCurrencyAmount, getCurrencySymbol } from '@/utils/currency';
import Summ from '@/components/ui/summ';
import TableSortField from '@/components/CurrencyExchanges/TableSortField';
import { StoreCurrencyExchange } from '@/stores/currencyExchange/currency-exchange-store';
import ExchangeTag from '@/components/CurrencyExchanges/ExchangeTag';
import {useState} from "react";

type SortField = 'position' | 'total' | 'paid' | 'inProgress';

interface SortBy {
  field: SortField;
  order?: 'asc' | 'desc';
}

const BegotteningExchangesTable = ({
  currencyExchanges,
  handleSelectCurrencyExchange,
  handleOrderEdit,
}: {
  currencyExchanges: StoreCurrencyExchange[];
  handleSelectCurrencyExchange: (currencyExchangeId: string) => void;
  handleOrderEdit: (orderId: string) => void;
}) => {
  const [sortBy, setSortBy] = useState<SortBy>({
    field: 'position',
    order: 'asc',
  })

  const handleSortChange = (field: SortField) => {
    setSortBy(prevState => {
      const newOrder = prevState.field !== field
        ? 'asc' : prevState.order === 'asc'
          ? 'desc' : prevState.order === 'desc'
            ? undefined : 'asc'

      return {
        field: field,
        order: newOrder,
      }
    });
  };

  const sortFunction = (exchangeA: any, exchangeB: any) => {
    if (!sortBy.order) {
      return 0;
    }

    const orderMultiplier = sortBy.order === 'desc' ? -1 : 1;
    let sortingValue = 0;

    if (sortBy.field === 'position') {
      sortingValue = Number(exchangeA?.position) - Number(exchangeB?.position);
    } else if (sortBy.field === 'inProgress') {
      const inProgressA = exchangeA?.begottenTransactions?.filter((tr: any) => tr.status !== 'completed').reduce((acc: number, tr: any ) =>
        acc + Number(tr.amountInSelectedCurrency),
      0);

      const inProgressB = exchangeB?.begottenTransactions?.filter((tr: any) => tr.status !== 'completed').reduce((acc: number, tr: any ) =>
        acc + Number(tr.amountInSelectedCurrency),
      0);

      sortingValue = inProgressA - inProgressB;
    } else if (sortBy.field === 'paid') {
      const paidA = exchangeA?.begottenTransactions?.filter((tr: any) => tr.status === 'completed').reduce((acc: number, tr: any) =>
        acc + Number(tr.amountInSelectedCurrency),
      0) ?? 0;

      const paidB = exchangeB?.begottenTransactions?.filter((tr: any) => tr.status === 'completed').reduce((acc: number, tr: any) =>
        acc + Number(tr.amountInSelectedCurrency),
      0) ?? 0;

      sortingValue = paidA - paidB;
    } else if (sortBy.field === 'total') {
      sortingValue = Number(exchangeA?.amountInSelectedCurrencyFrom ?? 0) - Number(exchangeB?.amountInSelectedCurrencyFrom ?? 0);
    }

    return sortingValue * orderMultiplier;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted hover:bg-gray-800/50">
          <TableSortField
            onChange={() => handleSortChange('position')}
            sortState={sortBy.field === 'position' ? sortBy.order : undefined}
          >
            #
          </TableSortField>
          <TableHead>Client</TableHead>
          <TableHead>Exchange</TableHead>
          <TableSortField
            onChange={() => handleSortChange('total')}
            sortState={sortBy.field === 'total' ? sortBy.order : undefined}
          >
            Total
          </TableSortField>
          <TableSortField
            onChange={() => handleSortChange('paid')}
            sortState={sortBy.field === 'paid' ? sortBy.order : undefined}
          >
            Paid
          </TableSortField>
          <TableSortField
            onChange={() => handleSortChange('inProgress')}
            sortState={sortBy.field === 'inProgress' ? sortBy.order : undefined}
          >
            In progress
          </TableSortField>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {currencyExchanges
          .sort(sortFunction)
          .map((exchange: any) => (
            <TableRow key={exchange.id} className="hover:bg-muted/50">
              <TableCell>{exchange.position}</TableCell>
              <TableCell className="max-w-[200px]">
                {exchange.orderItem?.client ? (
                  <Badge variant="primary" className="w-full justify-start">
                    <Crown />
                    <span className="truncate">
                        {exchange.orderItem?.client?.firstName || `Item: ${exchange.orderItemId}`}{' '}
                      {exchange.orderItem?.client?.lastName || ''}
                      </span>
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">No user</span>
                )}
              </TableCell>
              <TableCell>
                <ExchangeTag currencyExchange={exchange} disabled={exchange.status === 'finished'} />
              </TableCell>
              <TableCell>
                {exchange.amountInSelectedCurrencyFrom &&
                exchange.fromCurrency &&
                exchange.begottenTransactions.length > 0 ? (
                  <div className="flex gap-3 w-full justify-between">
                    <div className="w-full flex flex-col justify-center">
                      <div
                        className={`${
                          exchange.status === 'finished' ? 'text-success' : 'text-white'
                        } flex justify-between`}
                      >
                        <span>{getCurrencyAmount(exchange.amountInSelectedCurrencyFrom)}</span>
                        <span>{getCurrencySymbol(exchange.fromCurrency.name)}</span>
                      </div>

                      <Progress
                        value={
                          (exchange.begottenTransactions
                            .filter((tr: any) => tr.status === 'completed')
                            .reduce(
                              (acc: number, tr: any) => acc + Number(tr.amountInSelectedCurrency),
                              0
                            ) /
                            exchange.amountInSelectedCurrencyFrom) *
                            100 || 0
                        }
                        className="w-full bg-amber-700 [&>div]:bg-success h-[4px]"
                      />
                    </div>
                  </div>
                ) : (
                  'N/A'
                )}
              </TableCell>
              <TableCell>
                {exchange.fromCurrency && exchange.begottenTransactions.length > 0 ? (
                  <Summ
                    className={`${exchange.status === 'finished' ? 'bg-muted text-gray-500' : 'bg-emerald-900'}`}
                  >
                    <Check />
                    {formatCurrency(
                      exchange.begottenTransactions
                        .filter((tr: any) => tr.status === 'completed')
                        .reduce(
                          (acc: number, tr: any) =>
                            acc + Number(tr.amountInSelectedCurrency),
                          0
                        ),
                      exchange.fromCurrency.name
                    )}
                  </Summ>
                ) : (
                  'N/A'
                )}
              </TableCell>
              <TableCell>
                <Summ
                  className={`${exchange.status === 'finished' ? 'bg-muted text-gray-500' : 'bg-amber-700'}`}
                >
                  <Loader />
                  {formatCurrency(
                    exchange.begottenTransactions
                      .filter((tr: any) => tr.status !== 'completed')
                      .reduce(
                        (acc: number, tr: any ) =>
                          acc + Number(tr.amountInSelectedCurrency),
                        0
                      ),
                    exchange.fromCurrency.name
                  )}
                </Summ>
              </TableCell>
              <TableCell className="pr-5 flex justify-end">
                <Button
                  className={`${
                    exchange.status === 'finished'
                      ? 'bg-gray-50'
                      : exchange.status === 'draft'
                        ? 'bg-gray-50'
                        : 'bg-fuchsia-300'
                  } cursor-pointer`}
                  onClick={() => {
                    if (exchange.status === 'draft') {
                      handleOrderEdit(exchange.orderId)
                    } else {
                      handleSelectCurrencyExchange(exchange.id);
                    }
                  }}
                >
                  Exchange
                  {
                    exchange.status === 'finished'
                      ? <Eye />
                      : exchange.status === 'draft'
                        ? <Edit />
                        : <IconArrowShuffle />
                  }
                </Button>
              </TableCell>
            </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default BegotteningExchangesTable;
