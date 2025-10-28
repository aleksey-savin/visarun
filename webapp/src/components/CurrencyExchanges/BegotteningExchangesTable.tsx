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
import { Check, Crown, Eye, Loader } from 'lucide-react';
import { formatCurrency, getCurrencyAmount, getCurrencySymbol } from '@/utils/currency';
import Summ from '@/components/ui/summ';
import { Link } from 'react-router-dom';
import TableSortField from '@/components/CurrencyExchanges/TableSortField';
import { StoreCurrencyExchange } from '@/stores/currencyExchange/currency-exchange-store';
import ExchangeTag from '@/components/CurrencyExchanges/ExchangeTag';

// Change according to CurrencyExchanges/index
type SortItem = 'asc' | 'desc' | 'none';
type SortItemName = 'position' | 'inProgress' | 'remains' | 'minTransactionAmount' | 'deadline';
type SortStates = Record<SortItemName, SortItem>;
type SetSortStates = (
  sortStates: SortStates | ((prevSortStates: SortStates) => SortStates)
) => void;

const BegotteningExchangesTable = ({
  currencyExchanges,
  sortStates,
  setSortStates,
  handleSelectCurrencyExchange,
}: {
  currencyExchanges: StoreCurrencyExchange[];
  sortStates: SortStates;
  setSortStates: SetSortStates;
  handleSelectCurrencyExchange: (currencyExchangeId: string) => void;
}) => {
  const handleSortChange = (sortName: SortItemName) => {
    setSortStates(prevSortStates => {
      const resetSortStates: SortStates = Object.keys(prevSortStates).reduce(
        (acc, key) => ({ ...acc, [key]: 'none' }),
        {} as SortStates
      );

      let newSortState: SortItem = 'none';
      if (prevSortStates[sortName] === 'none') {
        newSortState = 'asc';
      } else if (prevSortStates[sortName] === 'asc') {
        newSortState = 'desc';
      }

      return {
        ...resetSortStates,
        [sortName]: newSortState,
      };
    });
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted hover:bg-gray-800/50">
          <TableSortField
            onChange={() => handleSortChange('position')}
            sortState={sortStates.position}
          >
            #
          </TableSortField>
          <TableHead>Client</TableHead>
          <TableSortField
            onChange={() => handleSortChange('position')}
            sortState={sortStates.position}
          >
            Exchange
          </TableSortField>
          <TableSortField
            onChange={() => handleSortChange('position')}
            sortState={sortStates.position}
          >
            Total
          </TableSortField>
          <TableSortField
            onChange={() => handleSortChange('remains')}
            sortState={sortStates.remains}
          >
            Paid
          </TableSortField>
          <TableSortField
            onChange={() => handleSortChange('inProgress')}
            sortState={sortStates.inProgress}
          >
            In progress
          </TableSortField>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {currencyExchanges.map((exchange: any) => (
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
                            ({ acc, tr }: { acc: number; tr: any }) =>
                              acc + Number(tr.amountInSelectedCurrency),
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
                        ({ acc, tr }: { acc: number; tr: any }) =>
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
                      ({ acc, tr }: { acc: number; tr: any }) =>
                        acc + Number(tr.amountInSelectedCurrency),
                      0
                    ),
                  exchange.fromCurrency.name
                )}
              </Summ>
            </TableCell>
            <TableCell className="pr-5">
              <Button
                className={`${
                  exchange.status === 'finished' ? 'bg-gray-50' : 'bg-fuchsia-300'
                } cursor-pointer`}
                onClick={() => {
                  handleSelectCurrencyExchange(exchange.id);
                }}
              >
                Exchange
                {exchange.status === 'finished' ? <Eye /> : <IconArrowShuffle />}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default BegotteningExchangesTable;
