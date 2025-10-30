import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { getEditCurrencyExchangeRoute } from '@/lib/routes';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Crown } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import Summ from '@/components/ui/summ';
import { StoreCurrencyExchange } from '@/stores/currencyExchange/currency-exchange-store';
import { Checkbox } from '@/components/ui/checkbox';
import {useState} from "react";
import TableSortField from "@/components/CurrencyExchanges/TableSortField.tsx";

type SortField = 'position' | 'remains' | 'inProgress' | 'min' | 'deadline';

interface SortBy {
  field: SortField;
  order?: 'asc' | 'desc';
}

const BegottenTransactionsSelectionTable = ({
  allCurrencyExchanges,
  currencyExchange,
  handleSelectBegottenTransaction,
}: {
  allCurrencyExchanges: StoreCurrencyExchange[];
  currencyExchange: StoreCurrencyExchange;
  handleSelectBegottenTransaction: (whereToAddExchangeId: string) => void;
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

  const alreadyBegotten = allCurrencyExchanges.filter(ex =>
    ex.transactions.some(tr => tr.begottenByCurrencyExchangeId === currencyExchange.id)
  );

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
        <TableRow className="bg-purple-950 hover:bg-gray-800/50">
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
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {allCurrencyExchanges
          .filter(ex => ex.fromCurrency.id === currencyExchange.toCurrency.id)
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
                <Checkbox
                  checked={!!alreadyBegotten.find(ex => ex.id === exchange.id)}
                  onClick={() => handleSelectBegottenTransaction(exchange.id)}
                />
              </TableCell>
            </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default BegottenTransactionsSelectionTable;
