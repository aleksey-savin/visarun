import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {Link} from "react-router-dom";
import {getEditCurrencyExchangeRoute} from "@/lib/routes.ts";
import {Badge} from "@/components/ui/badge.tsx";
import {AlertCircle, Crown} from "lucide-react";
import {formatCurrency} from "@/utils/currency.ts";
import Summ from "@/components/ui/summ.tsx";
import {StoreCurrencyExchange} from "@/stores/currencyExchange/currency-exchange-store.ts";
import {Checkbox} from "@/components/ui/checkbox.tsx";

const BegottenTransactionsSelectionTable = ({
    allCurrencyExchanges,
    currencyExchange,
    handleSelectBegottenTransaction
} : {
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
            ex.transactions.some(tr =>
                tr.begottenByCurrencyExchangeId === currencyExchange.id
            ));

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-purple-950 hover:bg-gray-800/50">
                    <TableHead>
                        #
                    </TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>
                        In progress
                    </TableHead>
                    <TableHead>
                        Remains
                    </TableHead>
                    <TableHead>
                        Min
                    </TableHead>
                    <TableHead>
                        Deadline
                    </TableHead>
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {allCurrencyExchanges.map((exchange: any) => (
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