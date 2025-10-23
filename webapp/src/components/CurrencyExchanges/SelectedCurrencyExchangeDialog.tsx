import {Check, CircleCheck, Copy, Crown} from "lucide-react";

import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog.tsx";
import {formatCurrency, getCurrencySymbol} from "@/utils/currency.js";
import {Progress} from "@/components/ui/progress.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import Summ from "@/components/ui/summ.tsx";
import IconCoins from "@/assets/tabler-icons/IconCoins.tsx";
import IconLoader from "@/assets/tabler-icons/IconLoader.tsx";
import ContactMethodIcon from "@/components/ContactMethod/ContactMethodIcon.tsx";
import React, {useState} from "react";
import { Button } from "@/components/ui/button";
import {trpc} from "@/lib/trpc.ts";
import {toast} from "sonner";
import TransactionCard from "@/components/CurrencyExchanges/TransactionCard.tsx";
import useCurrencyExchangeStore, {StoreTransaction} from "@/stores/currencyExchange/currency-exchange-store.ts";
import {VisuallyHidden} from "@radix-ui/react-visually-hidden";
import {Card} from "@/components/ui/card.tsx";
import {Switch} from "@/components/ui/switch.tsx";

const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
};

const SelectedCurrencyExchangeDialog = ({
    selectedCurrencyExchangeId,
    setSelectedCurrencyExchangeId,
} : {
    selectedCurrencyExchangeId: string | undefined;
    setSelectedCurrencyExchangeId: (newId: string | undefined) => void;
}) => {
    const {
        currencyExchanges,
        setCurrencyExchanges,
    } = useCurrencyExchangeStore();

    const selectedCurrencyExchange = currencyExchanges.find(ex => ex.id === selectedCurrencyExchangeId);

    const [copiedText, setCopiedText] = useState<any | undefined>();
    const handleCopyToClipboard = (event: React.MouseEvent, text: string) => {
        event.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopiedText(text);
    };

    const updateStatusCurrencyExchangeMutation = trpc.currencyExchange.updateStatus.useMutation({
        onError: (error: any) => {
            toast.error('Failed', {
                description: error.message,
            });
        },
    });

    const createTransactionMutation = trpc.transaction.create.useMutation({
        onError: (error: any) => {
            toast.error('Failed', {
                description: error.message,
            });
        },
    });

    const editTransactionMutation = trpc.transaction.edit.useMutation({
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

    const handleAddTransaction = async () => {
        try {
            if (!selectedCurrencyExchangeId || !selectedCurrencyExchange) {
                throw Error("selectedCurrencyExchangeId and selectedCurrencyExchange is required");
            }

            const newTransactionData = await createTransactionMutation.mutateAsync({
                currencyExchangeId: selectedCurrencyExchangeId,
                isCompanyTransaction: true
            });

            const newTransactions = [
                ...selectedCurrencyExchange.transactions,
                {
                    id: newTransactionData?.transaction?.id,
                    amountInSelectedCurrency: newTransactionData?.transaction?.amountInSelectedCurrency,
                    checkUrl: newTransactionData?.transaction?.checkUrl,
                    status: newTransactionData?.transaction?.status,
                    isCompanyTransaction: newTransactionData?.transaction?.isCompanyTransaction,
                    isInCash: newTransactionData?.transaction?.isInCash,
                    senderId: newTransactionData?.transaction?.senderId,
                }
            ];

            const inProgress = newTransactions
                .filter((t) => !['completed', 'canceled'].includes(t.status))
                .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

            const finished = newTransactions
                .filter((t) => ['completed'].includes(t.status))
                .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);


            setCurrencyExchanges([
                ...currencyExchanges.filter(ex => ex.id !== selectedCurrencyExchangeId),
                {
                    ...selectedCurrencyExchange,
                    inProgressTransactionsAmountInSelectedCurrency: inProgress,
                    finishedTransactionsAmountInSelectedCurrency: finished,
                    transactions: [
                        ...newTransactions,
                    ]
                }
            ]);
        } catch (error) {
            console.error(error);
        }
    };

    const handleEditTransaction = async (transaction: StoreTransaction) => {
        try {
            if (!selectedCurrencyExchangeId || !selectedCurrencyExchange) {
                throw Error("selectedCurrencyExchangeId and selectedCurrencyExchange is required");
            }

            const editedTransactionData = await editTransactionMutation.mutateAsync({
                id: transaction.id,
                amountInSelectedCurrency: transaction.amountInSelectedCurrency || undefined,
                checkUrl: transaction.checkUrl || undefined,
                senderId: transaction.senderId || undefined,
                isInCash: transaction.isInCash,
                detailsSent: transaction.detailsSent,
                paymentConfirmed: transaction.paymentConfirmed,
                clientsInformed: transaction.clientsInformed,
                paymentCompleted: transaction.paymentCompleted,
            });

            const newTransactions = [
                ...selectedCurrencyExchange.transactions.filter(tr => tr.id !== transaction.id),
                {
                    id: editedTransactionData?.transaction?.id,
                    amountInSelectedCurrency: editedTransactionData?.transaction?.amountInSelectedCurrency,
                    checkUrl: editedTransactionData?.transaction?.checkUrl,
                    senderId: editedTransactionData?.transaction?.senderId,
                    status: editedTransactionData?.transaction?.status,
                    isCompanyTransaction: editedTransactionData?.transaction?.isCompanyTransaction,
                    isInCash: editedTransactionData?.transaction?.isInCash,
                    detailsSent: transaction.detailsSent,
                    paymentConfirmed: transaction.paymentConfirmed,
                    clientsInformed: transaction.clientsInformed,
                    paymentCompleted: transaction.paymentCompleted,
                }
            ];

            const inProgress = newTransactions
                .filter((t) => !['completed', 'canceled'].includes(t.status))
                .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

            const finished = newTransactions
                .filter((t) => ['completed'].includes(t.status))
                .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);


            setCurrencyExchanges([
                ...currencyExchanges.filter(ex => ex.id !== selectedCurrencyExchangeId),
                {
                    ...selectedCurrencyExchange,
                    inProgressTransactionsAmountInSelectedCurrency: inProgress,
                    finishedTransactionsAmountInSelectedCurrency: finished,
                    transactions: [
                        ...newTransactions,
                    ]
                }
            ]);
        } catch (error) {
            console.error(error);
        }
    }

    const handleDeleteTransaction = async (id: string) => {
        try {
            if (!selectedCurrencyExchangeId || !selectedCurrencyExchange) {
                throw Error("selectedCurrencyExchangeId and selectedCurrencyExchange is required");
            }

            await deleteTransactionMutation.mutateAsync({
                id: id
            });

            const newTransactions = selectedCurrencyExchange.transactions.filter(tr => tr.id !== id);

            const inProgress = newTransactions
                .filter((t) => !['completed', 'canceled'].includes(t.status))
                .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

            const finished = newTransactions
                .filter((t) => ['completed'].includes(t.status))
                .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

            setCurrencyExchanges([
                ...currencyExchanges.filter(ex => ex.id !== selectedCurrencyExchangeId),
                {
                    ...selectedCurrencyExchange,
                    inProgressTransactionsAmountInSelectedCurrency: inProgress,
                    finishedTransactionsAmountInSelectedCurrency: finished,
                    transactions: [
                        ...newTransactions,
                    ]
                }
            ]);
        } catch (error) {
            console.error(error);
        }
    }

    const bankingDetailsContent = selectedCurrencyExchange?.orderItem?.client?.bankingDetails?.content?.split('|').join(' · ');

    const [clientInformed, setClientInformed] = useState<boolean>(false);
    const [summaryIsOpened, setSummaryIsOpened] = useState<boolean>(false);
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

    const handleCompleteExchange = async () => {
        try {
            if (selectedCurrencyExchange?.id && selectedCurrencyExchange?.finishedTransactionsAmountInSelectedCurrency == selectedCurrencyExchange?.amountInSelectedCurrencyTo) {
                await updateStatusCurrencyExchangeMutation.mutateAsync({
                    id: selectedCurrencyExchangeId,
                    status: 'finished',
                })

                setCurrencyExchanges([
                    ...currencyExchanges.filter(ex => ex.id !== selectedCurrencyExchangeId),
                    {
                        ...selectedCurrencyExchange,
                        status: 'finished'
                    }
                ]);
            }
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <Dialog
            open={!!selectedCurrencyExchange}
            onOpenChange={isOpen => {
                if (!isOpen) {
                    setSelectedCurrencyExchangeId(undefined)
                }
            }}
        >
            <form>
                <DialogContent className="min-w-3/5 min-h-1/2 bg-secondary">
                    <VisuallyHidden>
                        <DialogHeader>
                            <DialogTitle>View Currency Exchange</DialogTitle>
                            <DialogDescription>
                                Test.
                            </DialogDescription>
                        </DialogHeader>
                    </VisuallyHidden>
                    <div className="grid gap-4">
                        <div className="flex flex-col gap-5">
                            <div className="flex gap-4">
                                <span>Exchange</span>
                                {(
                                    selectedCurrencyExchange?.amountInSelectedCurrencyTo
                                    && selectedCurrencyExchange?.toCurrency
                                    && (selectedCurrencyExchange?.finishedTransactionsAmountInSelectedCurrency || selectedCurrencyExchange?.finishedTransactionsAmountInSelectedCurrency === 0)
                                ) && (
                                    <div className="flex min-w-1/4 flex-col justify-center pt-1 gap-0.5">
                                        <div className={`${
                                            !selectedCurrencyExchange?.finishedTransactionsAmountInSelectedCurrency
                                            || !selectedCurrencyExchange?.amountInSelectedCurrencyTo
                                            || selectedCurrencyExchange.finishedTransactionsAmountInSelectedCurrency != selectedCurrencyExchange.amountInSelectedCurrencyTo
                                                ? 'text-white'
                                                : 'text-success'
                                        } flex gap-2 justify-between text-sm`}>
                                            <span>
                                                {selectedCurrencyExchange.amountInSelectedCurrencyTo}
                                            </span>
                                            <span>
                                                {getCurrencySymbol(selectedCurrencyExchange.toCurrency.name)}
                                            </span>
                                        </div>

                                        <Progress
                                            value={
                                                (selectedCurrencyExchange.finishedTransactionsAmountInSelectedCurrency / selectedCurrencyExchange.amountInSelectedCurrencyTo * 100) || 0
                                            }
                                            className="w-full bg-emerald-900 [&>div]:bg-success h-[4px]"
                                        />
                                    </div>
                                )}

                                {(
                                    (selectedCurrencyExchange?.finishedTransactionsAmountInSelectedCurrency || selectedCurrencyExchange?.finishedTransactionsAmountInSelectedCurrency === 0)
                                    && (selectedCurrencyExchange?.inProgressTransactionsAmountInSelectedCurrency || selectedCurrencyExchange?.inProgressTransactionsAmountInSelectedCurrency === 0)
                                    && selectedCurrencyExchange?.amountInSelectedCurrencyTo
                                    && selectedCurrencyExchange?.toCurrency
                                ) && (
                                    <div className="">
                                        <Summ className="bg-emerald-900 h-fit">
                                            <IconCoins />
                                            {formatCurrency(selectedCurrencyExchange.amountInSelectedCurrencyTo - selectedCurrencyExchange.finishedTransactionsAmountInSelectedCurrency - selectedCurrencyExchange.inProgressTransactionsAmountInSelectedCurrency, selectedCurrencyExchange.toCurrency.name)}
                                        </Summ>
                                    </div>
                                )}

                                {(
                                    (selectedCurrencyExchange?.inProgressTransactionsAmountInSelectedCurrency || selectedCurrencyExchange?.inProgressTransactionsAmountInSelectedCurrency === 0)
                                    && selectedCurrencyExchange?.toCurrency
                                    && selectedCurrencyExchange?.inProgressTransactionsAmountInSelectedCurrency > 0
                                ) && (
                                    <div className="">
                                        <Summ className="bg-amber-600">
                                            <IconLoader />
                                            {formatCurrency(selectedCurrencyExchange.inProgressTransactionsAmountInSelectedCurrency, selectedCurrencyExchange.toCurrency.name)}
                                        </Summ>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 text-sm text-muted-foreground">
                                <div>
                                    Dl: {selectedCurrencyExchange?.deadline ? formatDate(selectedCurrencyExchange.deadline) : 'Indefinitely'}
                                </div>
                                <div>
                                    Min Pymt: {selectedCurrencyExchange?.minTransactionAmountInSelectedCurrency || 'Indefinitely'}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between">
                                    <div className="flex gap-2">
                                        <div>
                                            {selectedCurrencyExchange?.orderItem?.client && (
                                                <Badge variant="primary" className="w-full justify-start">
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
                                    </div>
                                    <div className="max-w-1/4">
                                        <Button
                                            className={`${
                                                copiedText === bankingDetailsContent
                                                    ? 'bg-green-500/20 text-green-300'
                                                    : 'bg-muted hover:bg-muted/80'
                                            } w-full overflow-hidden`}
                                            onClick={(e) => {
                                                if (bankingDetailsContent) handleCopyToClipboard(e, bankingDetailsContent)
                                            }}
                                            variant="secondary"
                                        >
                                            {copiedText === bankingDetailsContent ? (
                                                <Check className="w-3 h-3 ml-1 animate-pulse" />
                                            ) : (
                                                <Copy className="w-3 h-3 ml-1" />
                                            )}
                                            <span className="block truncate text-ellipsis">
                                                {selectedCurrencyExchange?.orderItem?.client.bankingDetails.content
                                                    ? bankingDetailsContent
                                                    : selectedCurrencyExchange?.orderItem?.client.bankingDetails.documentUrl
                                                }
                                            </span>
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="flex flex-col gap-3"
                            >
                                <span className="text-xs">
                                    Payment summary for {selectedCurrencyExchange?.orderItem?.client?.firstName} {selectedCurrencyExchange?.orderItem?.client?.lastName}
                                </span>
                                <Card
                                    className="flex flex-row gap-2 justify-between p-4 bg-secondary"
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
                                    hidden={
                                        !selectedCurrencyExchange?.finishedTransactionsAmountInSelectedCurrency
                                        || !selectedCurrencyExchange?.amountInSelectedCurrencyTo
                                        || selectedCurrencyExchange.finishedTransactionsAmountInSelectedCurrency != selectedCurrencyExchange.amountInSelectedCurrencyTo
                                    }
                                >
                                    <div
                                        className="flex items-center gap-2"
                                        hidden={selectedCurrencyExchange?.status === 'finished'}
                                    >
                                        <span>
                                            Client informed
                                        </span>
                                        <Switch
                                            checked={clientInformed}
                                            disabled={selectedCurrencyExchange?.status === 'finished'}
                                            onClick={() => setClientInformed(prevState => !prevState)}
                                        />
                                    </div>
                                    {selectedCurrencyExchange?.status === 'finished'
                                        ? (
                                            <div className="flex gap-2">
                                                <span>Exchange completed</span>
                                                <CircleCheck className="w-4 text-success" />
                                            </div>
                                        )
                                        : (
                                            <Button
                                                variant="accent-green"
                                                disabled={!clientInformed}
                                                onClick={() => handleCompleteExchange()}
                                            >
                                                Exchange completed
                                            </Button>
                                        )
                                    }
                                </div>
                            </div>

                            <hr />

                            <div className="flex flex-col gap-5 max-h-120 overflow-y-auto">
                                {selectedCurrencyExchange?.transactions?.map((transaction, index) => (
                                    <TransactionCard
                                        key={index}
                                        transaction={transaction}
                                        selectedCurrencyExchange={selectedCurrencyExchange}
                                        handleDeleteTransaction={handleDeleteTransaction}
                                        handleEditTransaction={handleEditTransaction}
                                        copiedText={copiedText}
                                        handleCopyToClipboard={handleCopyToClipboard}
                                    />
                                ))}
                            </div>

                            <div className="flex w-full">
                                <Button
                                    className="w-full"
                                    variant="secondary"
                                    onClick={handleAddTransaction}
                                >
                                    + Add company transaction
                                </Button>
                            </div>
                        </div>
                    </div>
                    {/*<DialogFooter>*/}
                    {/*    <DialogClose asChild>*/}
                    {/*        <Button variant="outline">Cancel</Button>*/}
                    {/*    </DialogClose>*/}
                    {/*    <Button*/}
                    {/*        type="submit"*/}
                    {/*        onClick={() => setSelectedCurrencyExchange(undefined)}*/}
                    {/*    >Save changes</Button>*/}
                    {/*</DialogFooter>*/}
                </DialogContent>
            </form>
        </Dialog>
    );
};

export default SelectedCurrencyExchangeDialog;