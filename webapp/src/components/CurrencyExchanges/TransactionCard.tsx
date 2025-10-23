import {Card} from "@/components/ui/card.tsx";
import IconLoader from "@/assets/tabler-icons/IconLoader.tsx";
import {formatCurrency} from "@/utils/currency.ts";
import Summ from "@/components/ui/summ.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {Check, CircleCheck, Copy, Crown, Trash2} from "lucide-react";
import ContactMethodIcon from "../ContactMethod/ContactMethodIcon.tsx";
import React, {useEffect, useState} from "react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Switch} from "@/components/ui/switch.tsx";
import {trpc} from "@/lib/trpc.ts";
import TransactionCheckUpload from "@/components/CurrencyExchanges/TransactionCheckUpload.tsx";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {StoreTransaction} from "@/stores/currencyExchange/currency-exchange-store.ts";

const TransactionCard = ({
    transaction,
    selectedCurrencyExchange,
    handleDeleteTransaction,
    handleEditTransaction,
    copiedText,
    handleCopyToClipboard,
} : {
    transaction: StoreTransaction;
    selectedCurrencyExchange: any | undefined;
    handleDeleteTransaction: (id: string) => void;
    handleEditTransaction: (transaction: StoreTransaction) => void;
    copiedText: string;
    handleCopyToClipboard: (event: React.MouseEvent, text: string) => void;
}) => {
    const { data: usersData } = trpc.user.getAll.useQuery({
        search: '',
    });

    const [currentAmount, setCurrentAmount] = useState<number | undefined>(transaction.amountInSelectedCurrency);
    const [currentCheckUrl, setCurrentCheckUrl] = useState<string | undefined>(transaction.checkUrl);
    const [currentSenderId, setCurrentSenderId] = useState<string | undefined>(transaction.senderId);
    const [currentIsInCash, setCurrentIsInCash] = useState(transaction.isInCash || false);
    const [currentDetailsSent, setCurrentDetailsSent] = useState(transaction.detailsSent || false);
    const [currentPaymentConfirmed, setPaymentConfirmed] = useState(transaction.paymentConfirmed || false);
    const [currentClientsInformed, setCurrentClientsInformed] = useState(transaction.clientsInformed || false);
    const [currentPaymentCompleted, setCurrentPaymentCompleted] = useState(transaction.paymentCompleted || false);

    const [summaryIsOpened, setSummaryIsOpened] = useState<boolean>(false);
    const [isShowMore, setIsShowMore] = useState<boolean>(false);

    const handleSave = () => {
        handleEditTransaction({
            id: transaction.id,
            status: transaction.status,
            isCompanyTransaction: transaction.isCompanyTransaction,
            amountInSelectedCurrency: Number(currentAmount) || undefined,
            checkUrl: currentCheckUrl,
            senderId: currentSenderId,
            isInCash: currentIsInCash,
            detailsSent: currentDetailsSent,
            paymentConfirmed: currentPaymentConfirmed,
            clientsInformed: currentClientsInformed,
            paymentCompleted: currentPaymentCompleted,
        });
    };

    const summary =
        `COMPLETE ORDER SUMMARY
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

    // console.log(transaction, usersData?.users?.find(us => us.Client[0]?.id === transaction.senderId))

    useEffect(() => {
        handleSave();
    }, [currentSenderId, currentIsInCash, currentCheckUrl, currentDetailsSent, currentPaymentConfirmed, currentClientsInformed, currentPaymentCompleted])

    return (
        <Card
            className={`${transaction.status === 'paid_uninformed' || transaction.status === 'paid_informed'
                ? 'border-gray-50 border-dashed'
                : transaction.status === 'completed'
                    ? 'border-success'
                    : transaction.isCompanyTransaction        
                        ? 'border-blue-400' 
                        : ''} bg-secondary text-sm p-4 flex flex-col gap-5`}
        >
            <div className="flex justify-between">
                {transaction.isCompanyTransaction ? (
                    <div className={`${transaction.status === 'completed' ? 'text-success' : 'text-blue-400'} flex gap-1`}>
                        <span>Company payment</span>
                        {
                            transaction.status === 'completed' && <CircleCheck className="w-4" />
                        }
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <div className={`${transaction.status === 'completed' ? `text-success` : ''} flex gap-1`}>
                            <span>Payment</span>
                            {
                                transaction.status === 'completed' && <CircleCheck />
                            }
                        </div>
                        {(transaction.amountInSelectedCurrency && selectedCurrencyExchange?.toCurrency?.name) && (
                            <Summ className="bg-amber-600">
                                <IconLoader />
                                {formatCurrency(transaction.amountInSelectedCurrency, selectedCurrencyExchange.toCurrency.name)}
                            </Summ>
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
                                    Are you sure you want to delete this transaction? This action cannot be
                                    undone.
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
                        <div>
                            {selectedCurrencyExchange?.orderItem?.client && (
                                <Badge variant="primary" className="justify-start">
                                    <Crown />
                                    <span>
                                {selectedCurrencyExchange.orderItem.client.firstName || '\u00A0'} {selectedCurrencyExchange.orderItem.client.lastName || ''}
                            </span>
                                </Badge>
                            )}
                        </div>
                        <div>
                            {selectedCurrencyExchange?.orderItem?.client?.user?.contactMethods
                                ?.filter(contact => contact.method)
                                .map(contact => (
                                    <Badge
                                        key={contact.id}
                                        variant="secondary"
                                        className={`cursor-pointer transition-all duration-300 ${
                                            copiedText === contact.value
                                                ? 'bg-green-500/20 text-green-300'
                                                : 'bg-muted hover:bg-muted/80'
                                        }`}
                                        onClick={e =>
                                            contact.value &&
                                            contact.id &&
                                            handleCopyToClipboard(e, contact.value)
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
                                        {copiedText === contact.value ? (
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
                    <div className="flex gap-1">
                        {selectedCurrencyExchange?.toCurrency?.name && (
                            <Select
                                value={selectedCurrencyExchange.toCurrency.id}
                                disabled={true}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Currencies</SelectLabel>
                                        <SelectItem
                                            value={selectedCurrencyExchange.toCurrency.id}
                                        >
                                            {selectedCurrencyExchange.toCurrency.name}
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        )}

                        <Input
                            disabled={['details_sent', 'check_uploaded', 'paid_uninformed', 'paid_informed', 'completed'].includes(transaction.status)}
                            className="max-w-2/3"
                            placeholder="Amount..."
                            value={currentAmount}
                            onBlur={handleSave}
                            onChange={e => {
                                if (!isNaN(Number(e.target.value))) {
                                    setCurrentAmount(Number(e.target.value))
                                }
                            }}
                        />
                    </div>

                    <div className="flex gap-2 content-center flex-wrap">
                        <div>Cash</div>
                        <Switch
                            disabled={['check_uploaded', 'paid_uninformed', 'paid_informed', 'completed'].includes(transaction.status)}
                            checked={currentIsInCash}
                            onClick={() => setCurrentIsInCash(prevState => !prevState)}
                        />
                    </div>
                </div>
            </div>
            {transaction?.isCompanyTransaction && (
                <div>
                    <Select
                        disabled={['details_sent', 'check_uploaded', 'paid_uninformed', 'paid_informed', 'completed'].includes(transaction.status)}
                        value={currentSenderId}
                        onValueChange={(senderId: string) => setCurrentSenderId(senderId)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Paid by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {usersData?.users?.map(user => {
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
                </div>
            )}
            <div
                hidden={transaction.status !== 'completed'}
            >
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
                    handleCheckUpload={(checkUrl: string) => setCurrentCheckUrl(checkUrl)}
                    existingTransaction={transaction}
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
                        onClick={() => setCurrentDetailsSent(prevState => !prevState)}
                    >
                        {currentDetailsSent
                            ? "Undo"
                            : "Details sent"
                        }
                    </Button>
                )}
                <Button
                    className="flex-1"
                    variant="accent-green"
                    disabled={!currentCheckUrl || !currentAmount || !currentSenderId}
                    onClick={() => setPaymentConfirmed(true)}
                >
                    Confirm payment
                </Button>
            </div>

            <div
                className="flex flex-col gap-3"
                hidden={['draft', 'details_sent', 'check_uploaded'].includes(transaction.status) || (transaction.status === 'completed' && !isShowMore)}
            >
                <span
                    hidden={currentPaymentConfirmed}
                >
                    Payment summary for {usersData?.users?.find(us => us.Client[0]?.id === transaction.senderId)?.Client[0]?.firstName} {usersData?.users?.find(us => us.Client[0]?.id === transaction.senderId)?.Client[0]?.lastName}
                </span>
                <Card
                    className="flex flex-row gap-2 justify-between p-4 bg-secondary"
                    hidden={currentPaymentConfirmed}
                >
                    <div className={`${!summaryIsOpened ? 'line-clamp-2' : ''} whitespace-pre-line text-gray-500 text-xs`}>
                        {summary}
                    </div>
                    <div className="flex gap-1">
                        <Button
                            variant="secondary"
                            onClick={() => setSummaryIsOpened(prevState => !prevState)}
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
                            onClick={(e) => handleCopyToClipboard(e, summary)}
                        >
                            Copy
                        </Button>
                    </div>
                </Card>

                <div
                    className="flex justify-end gap-4"
                    hidden={transaction.status === 'completed'}
                >
                    <div className="flex items-center gap-2">
                        <span>
                            Both parties to the transaction are informed
                        </span>
                        <Switch
                            checked={currentClientsInformed}
                            onClick={() => setCurrentClientsInformed(prevState => !prevState)}
                        />
                    </div>
                    <Button
                        variant="accent-green"
                        disabled={!currentClientsInformed || currentPaymentCompleted}
                        onClick={() => setCurrentPaymentCompleted(true)}
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