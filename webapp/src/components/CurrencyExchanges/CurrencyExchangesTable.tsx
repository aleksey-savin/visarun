import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import IconArrowShuffle from '@/assets/tabler-icons/IconArrowShuffle';
import { getEditCurrencyExchangeRoute } from '@/lib/routes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Crown, Eye } from 'lucide-react';
import { formatCurrency, getCurrencyAmount, getCurrencySymbol } from '@/utils/currency';
import Summ from '@/components/ui/summ';
import { Link } from 'react-router-dom';
import TableSortField from '@/components/CurrencyExchanges/TableSortField';
import {useState} from "react";

type SortField = 'position' | 'remains' | 'inProgress' | 'min' | 'deadline';

interface SortBy {
  field: SortField;
  order?: 'asc' | 'desc';
}

const CurrencyExchangesTable = ({
  currencyExchanges,
  handleSelectCurrencyExchange,
}: {
  currencyExchanges: any;
  handleSelectCurrencyExchange: (currencyExchangeId: string) => void;
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

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
    const orderMultiplier = sortBy.order === 'desc' ? -1 : 1;
    let sortingValue = 0;

    if (sortBy.field === 'position') {
      sortingValue = Number(exchangeA?.position) - Number(exchangeB?.position);
    } else if (sortBy.field === 'inProgress') {
      sortingValue = Number(exchangeA?.inProgressTransactionsAmountInSelectedCurrency) - Number(exchangeB?.inProgressTransactionsAmountInSelectedCurrency);
    } else if (sortBy.field === 'remains') {
      const remainsA = exchangeA?.amountInSelectedCurrencyTo
        - exchangeA?.finishedTransactionsAmountInSelectedCurrency
        - exchangeA?.inProgressTransactionsAmountInSelectedCurrency;

      const remainsB = exchangeB?.amountInSelectedCurrencyTo
        - exchangeB?.finishedTransactionsAmountInSelectedCurrency
        - exchangeB?.inProgressTransactionsAmountInSelectedCurrency;

      sortingValue = remainsA - remainsB;
    } else if (sortBy.field === 'min') {
      sortingValue = Number(exchangeA?.minTransactionAmountInSelectedCurrency ?? 0) - Number(exchangeB?.minTransactionAmountInSelectedCurrency ?? 0);
    } else if (sortBy.field === 'deadline') {
      sortingValue = new Date(exchangeA.deadline ?? 0).getTime() - new Date(exchangeB.deadline ?? 0).getTime()
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
          <TableHead>Paid</TableHead>
          <TableSortField
            onChange={() => handleSortChange('inProgress')}
            sortState={sortBy.field === 'inProgress' ? sortBy.order : undefined}
          >
            In progress
          </TableSortField>
          <TableSortField
            onChange={() => handleSortChange('remains')}
            sortState={sortBy.field === 'remains' ? sortBy.order : undefined}
          >
            Remains
          </TableSortField>
          <TableSortField
            onChange={() => handleSortChange('min')}
            sortState={sortBy.field === 'min' ? sortBy.order : undefined}
          >
            Min
          </TableSortField>
          <TableSortField
            onChange={() => handleSortChange('deadline')}
            sortState={sortBy.field === 'deadline' ? sortBy.order : undefined}
          >
            Deadline
          </TableSortField>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {currencyExchanges
          .sort(sortFunction)
          .map((exchange: any) => (
            <TableRow key={exchange.id} className="hover:bg-muted/50">
              <TableCell>{exchange.position}</TableCell>
              <TableCell>
                <Link
                  to={getEditCurrencyExchangeRoute({ id: exchange.id })}
                  className="hover:underline font-medium block"
                >
                  {exchange.orderItem?.client ? (
                    <Badge variant="primary" className="w-full justify-start">
                      <Crown />
                      <span>
                        {exchange.orderItem?.client?.firstName || '\u00A0'}{' '}
                        {exchange.orderItem?.client?.lastName || ''}
                      </span>
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">No user</span>
                  )}
                </Link>
              </TableCell>
              <TableCell>
                {exchange.amountInSelectedCurrencyFrom && exchange.fromCurrency
                  ? formatCurrency(exchange.amountInSelectedCurrencyFrom, exchange.fromCurrency.name)
                  : 'N/A'}
              </TableCell>
              <TableCell>
                {(exchange.inProgressTransactionsAmountInSelectedCurrency ||
                  exchange.inProgressTransactionsAmountInSelectedCurrency === 0) &&
                exchange.toCurrency ? (
                  <Summ
                    className={`${exchange.status === 'finished' ? 'bg-muted text-gray-500' : 'bg-amber-600'}`}
                  >
                    {formatCurrency(
                      exchange.inProgressTransactionsAmountInSelectedCurrency,
                      exchange.toCurrency.name
                    )}
                  </Summ>
                ) : (
                  'N/A'
                )}
              </TableCell>
              <TableCell>
                {(exchange.finishedTransactionsAmountInSelectedCurrency ||
                  exchange.finishedTransactionsAmountInSelectedCurrency === 0) &&
                (exchange.inProgressTransactionsAmountInSelectedCurrency ||
                  exchange.inProgressTransactionsAmountInSelectedCurrency === 0) &&
                exchange.amountInSelectedCurrencyTo &&
                exchange.toCurrency ? (
                  <Summ
                    className={`${exchange.status === 'finished' ? 'bg-muted text-gray-500' : 'bg-emerald-900'}`}
                  >
                    {formatCurrency(
                      exchange.amountInSelectedCurrencyTo -
                        exchange.finishedTransactionsAmountInSelectedCurrency -
                        exchange.inProgressTransactionsAmountInSelectedCurrency,
                      exchange.toCurrency.name
                    )}
                  </Summ>
                ) : (
                  'N/A'
                )}
              </TableCell>
              <TableCell>
                {exchange.minTransactionAmountInSelectedCurrency &&
                exchange.amountInSelectedCurrencyTo
                  ? exchange.minTransactionAmountInSelectedCurrency ===
                    exchange.amountInSelectedCurrencyTo
                    ? 'Full'
                    : formatCurrency(
                        exchange.minTransactionAmountInSelectedCurrency,
                        exchange.toCurrency.name
                      )
                  : 'Indefinitely'}
              </TableCell>
              <TableCell>
                {!exchange.deadline ? (
                  'Indefinitely'
                ) : Math.abs(new Date(exchange.deadline).getTime() - new Date().getTime()) <
                    60 * 60 * 1000 && exchange.status !== 'finished' ? (
                  <Summ className="bg-yellow-300 text-gray-800">
                    {formatDate(exchange.deadline)}
                    <AlertCircle />
                  </Summ>
                ) : (
                  formatDate(exchange.deadline)
                )}
              </TableCell>
              <TableCell className="pr-5">
                {exchange.amountInSelectedCurrencyTo && exchange.toCurrency ? (
                  <div className="flex gap-3 w-full justify-between">
                    <div className="w-full flex flex-col justify-center">
                      <div
                        className={`${
                          exchange.status === 'finished' ? 'text-success' : 'text-white'
                        } flex justify-between`}
                      >
                        <span>
                          {getCurrencyAmount(
                            exchange.amountInSelectedCurrencyTo,
                            exchange.toCurrency.name
                          )}
                        </span>
                        <span>{getCurrencySymbol(exchange.toCurrency.name)}</span>
                      </div>

                      <Progress
                        value={
                          (exchange.finishedTransactionsAmountInSelectedCurrency /
                            exchange.amountInSelectedCurrencyTo) *
                            100 || 0
                        }
                        className="w-full bg-green-950 [&>div]:bg-success h-[4px]"
                      />
                    </div>

                    <Button
                      className={`${
                        exchange.status === 'finished' ? 'bg-gray-50' : 'bg-fuchsia-300'
                      } cursor-pointer`}
                      onClick={() => {
                        handleSelectCurrencyExchange(exchange.id);
                      }}
                    >
                      {exchange.status === 'finished' ? <Eye /> : <IconArrowShuffle />}
                    </Button>
                  </div>
                ) : (
                  'N/A'
                )}
              </TableCell>
            </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CurrencyExchangesTable;
