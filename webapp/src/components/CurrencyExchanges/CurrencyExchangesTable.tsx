import {Button} from "@/components/ui/button.tsx";
import {Progress} from "@/components/ui/progress.tsx";
import IconArrowShuffle from "@/assets/tabler-icons/IconArrowShuffle.tsx";
import {getEditCurrencyExchangeRoute} from "@/lib/routes.ts";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {AlertCircle, Crown, Eye} from "lucide-react";
import {formatCurrency, getCurrencySymbol} from "@/utils/currency.ts";
import Summ from "@/components/ui/summ.tsx";
import {Link} from "react-router-dom";
import TableSortField from "@/components/CurrencyExchanges/TableSortField.tsx";

// Change according to CurrencyExchanges/index.tsx
type SortItem = 'asc' | 'desc' | 'none';
type SortItemName = 'position' | 'inProgress' | 'remains' | 'minTransactionAmount' | 'deadline';
type SortStates = Record<SortItemName, SortItem>
type SetSortStates = (sortStates: SortStates | ((prevSortStates: SortStates) => SortStates)) => void;

const CurrencyExchangesTable = ({
    currencyExchanges,
    sortStates,
    setSortStates,
    handleSelectCurrencyExchange,
}: {
    currencyExchanges: any;
    sortStates: SortStates;
    setSortStates: SetSortStates;
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

    const handleSortChange = (sortName: SortItemName) => {
        setSortStates(prevSortStates => {
            const resetSortStates: SortStates =
                Object.keys(prevSortStates).reduce(
                    (acc, key) => ({ ...acc, [key]: 'none' }),
                    {} as SortStates
                );

            let newSortState: SortItem = 'none'
            if (prevSortStates[sortName] === 'none') {
                newSortState = 'asc'
            } else if (prevSortStates[sortName] === 'asc') {
                newSortState = 'desc'
            }

            return {
                ...resetSortStates,
                [sortName]: newSortState,
            }
        });
    };

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-muted hover:bg-gray-800/50">
                    <TableSortField
                        onChange={() => handleSortChange("position")}
                        sortState={sortStates.position}
                    >
                        #
                    </TableSortField>
                    <TableHead>Client</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableSortField
                        onChange={() => handleSortChange("inProgress")}
                        sortState={sortStates.inProgress}
                    >
                        In progress
                    </TableSortField>
                    <TableSortField
                        onChange={() => handleSortChange("remains")}
                        sortState={sortStates.remains}
                    >
                        Remains
                    </TableSortField>
                    <TableSortField
                        onChange={() => handleSortChange("minTransactionAmount")}
                        sortState={sortStates.minTransactionAmount}
                    >
                        Min
                    </TableSortField>
                    <TableSortField
                        onChange={() => handleSortChange("deadline")}
                        sortState={sortStates.deadline}
                    >
                        Deadline
                    </TableSortField>
                    <TableHead>Status</TableHead>
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
                                            {exchange.orderItem?.client?.firstName || '\u00A0'} {exchange.orderItem?.client?.lastName || ''}
                                        </span>
                                    </Badge>
                                ) : (
                                    <span className="text-muted-foreground">No user</span>
                                )}
                            </Link>
                        </TableCell>
                        <TableCell>
                            {(exchange.amountInSelectedCurrencyFrom && exchange.fromCurrency)
                                ? formatCurrency(exchange.amountInSelectedCurrencyFrom, exchange.fromCurrency.name)
                                : 'N/A'
                            }
                        </TableCell>
                        <TableCell>
                            {(
                                (exchange.inProgressTransactionsAmountInSelectedCurrency || exchange.inProgressTransactionsAmountInSelectedCurrency === 0)
                                && exchange.toCurrency
                            )
                                ? (
                                    <Summ className={`${exchange.status === 'finished' ? 'bg-muted text-gray-500' : 'bg-amber-600'}`}>
                                        {formatCurrency(exchange.inProgressTransactionsAmountInSelectedCurrency, exchange.toCurrency.name)}
                                    </Summ>
                                ) : 'N/A'
                            }
                        </TableCell>
                        <TableCell>
                            {(
                                (exchange.finishedTransactionsAmountInSelectedCurrency || exchange.finishedTransactionsAmountInSelectedCurrency === 0)
                                && (exchange.inProgressTransactionsAmountInSelectedCurrency || exchange.inProgressTransactionsAmountInSelectedCurrency === 0)
                                && exchange.amountInSelectedCurrencyTo
                                && exchange.toCurrency
                            )
                                ? (
                                    <Summ className={`${exchange.status === 'finished' ? 'bg-muted text-gray-500' : 'bg-emerald-900'}`}>
                                        {formatCurrency(exchange.amountInSelectedCurrencyTo - exchange.finishedTransactionsAmountInSelectedCurrency - exchange.inProgressTransactionsAmountInSelectedCurrency, exchange.toCurrency.name)}
                                    </Summ>
                                ) : 'N/A'
                            }
                        </TableCell>
                        <TableCell>
                            {exchange.minTransactionAmountInSelectedCurrency && exchange.amountInSelectedCurrencyTo
                                ? exchange.minTransactionAmountInSelectedCurrency === exchange.amountInSelectedCurrencyTo
                                    ? 'Full'
                                    : formatCurrency(exchange.minTransactionAmountInSelectedCurrency, exchange.toCurrency.name)
                                : 'Indefinitely'
                            }
                        </TableCell>
                        <TableCell>
                            {!exchange.deadline
                                ? 'Indefinitely'
                                : (Math.abs(new Date(exchange.deadline).getTime() - new Date().getTime()) < 60 * 60 * 1000 && exchange.status !== 'finished')
                                    ? (
                                        <Summ className="bg-yellow-300 text-gray-800">
                                            {formatDate(exchange.deadline)}
                                            <AlertCircle />
                                        </Summ>
                                    )
                                    : formatDate(exchange.deadline)
                            }
                        </TableCell>
                        <TableCell className="pr-5">
                            {(
                                exchange.amountInSelectedCurrencyTo
                                && exchange.toCurrency
                            )
                                ? (
                                    <div className="flex gap-3 w-full justify-between">
                                        <div className="w-full flex flex-col justify-center">
                                            <div className={`${
                                                exchange.status === 'finished'
                                                    ? 'text-success'
                                                    : 'text-white'
                                            } flex justify-between`}>
                                                <span>
                                                    {exchange.amountInSelectedCurrencyTo}
                                                </span>
                                                <span>
                                                    {getCurrencySymbol(exchange.toCurrency.name)}
                                                </span>
                                            </div>

                                            <Progress
                                                value={
                                                    (exchange.finishedTransactionsAmountInSelectedCurrency / exchange.amountInSelectedCurrencyTo * 100) || 0
                                                }
                                                className="w-full bg-green-950 [&>div]:bg-success h-[4px]"
                                            />
                                        </div>

                                        <Button
                                            className={`${
                                                exchange.status === 'finished'
                                                    ? 'bg-gray-50'
                                                    : 'bg-fuchsia-300'
                                            } cursor-pointer`}
                                            onClick={() => {handleSelectCurrencyExchange(exchange.id)}}
                                        >
                                            {exchange.status === 'finished'
                                                ? (<Eye />)
                                                : (<IconArrowShuffle />)
                                            }
                                        </Button>
                                    </div>
                                ) : 'N/A'
                            }
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export default CurrencyExchangesTable;