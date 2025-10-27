import {Check, ChevronDown, ChevronUp, CircleCheck, Copy, Crown, Download} from "lucide-react";

import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog.tsx";
import {formatCurrency, getCurrencyAmount, getCurrencySymbol} from "@/utils/currency.js";
import {Progress} from "@/components/ui/progress.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import Summ from "@/components/ui/summ.tsx";
import IconCoins from "@/assets/tabler-icons/IconCoins.tsx";
import IconLoader from "@/assets/tabler-icons/IconLoader.tsx";
import ContactMethodIcon from "@/components/ContactMethod/ContactMethodIcon.tsx";
import React, {useEffect, useRef, useState} from "react";
import { Button } from "@/components/ui/button";
import {trpc} from "@/lib/trpc.ts";
import {toast} from "sonner";
import TransactionCard from "@/components/CurrencyExchanges/TransactionCard.tsx";
import useCurrencyExchangeStore, {StoreTransaction} from "@/stores/currencyExchange/currency-exchange-store.ts";
import {VisuallyHidden} from "@radix-ui/react-visually-hidden";
import {Card} from "@/components/ui/card.tsx";
import {Switch} from "@/components/ui/switch.tsx";
import ExchangeTag from "@/components/CurrencyExchanges/ExchangeTag.tsx";
import FinalTransactionForBegotteningExchange
    from "@/components/CurrencyExchanges/FinalTransactionForBegotteningExchange.tsx";

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
        allCurrencyExchanges,
        setAllCurrencyExchanges
    } = useCurrencyExchangeStore();

    const {
        data: usersData,
        isLoadingUsers,
        errorUsers,
    } = trpc.user.getAll.useQuery({
        search: '',
    });

    const users = usersData?.users;

    const selectedCurrencyExchange = allCurrencyExchanges.find(ex => ex.id === selectedCurrencyExchangeId);

    const [copiedText, setCopiedText] = useState<string | undefined>();
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

    const updateStatusTransactionMutation = trpc.transaction.updateStatus.useMutation({
        onError: (error: any) => {
            toast.error('Failed', {
                description: error.message,
            });
        },
    });

    // Final transaction
    const finalTransactionCreated = useRef(false);
    const finalTransactionForBegotteningExchange =
        selectedCurrencyExchange?.isBegottening
            ? selectedCurrencyExchange.transactions
                .find(tr => Number(tr.amountInSelectedCurrency) === Number(selectedCurrencyExchange.amountInSelectedCurrencyTo) && Number(tr.amountInSelectedCurrency))
            : null;

    const updateStatusTransaction = async (id: string, newStatus: string) => {
        try {
            const updatedTransactionData = await updateStatusTransactionMutation.mutateAsync({
                id: id,
                status: newStatus,
            });

            const newTransaction = {
                id: updatedTransactionData?.transaction?.id,
                begottenByCurrencyExchangeId: updatedTransactionData?.transaction?.begottenByCurrencyExchangeId,
                currencyExchangeId: updatedTransactionData?.transaction?.currencyExchangeId,
                amountInSelectedCurrency: updatedTransactionData?.transaction?.amountInSelectedCurrency,
                checkUrl: updatedTransactionData?.transaction?.checkUrl,
                senderId: updatedTransactionData?.transaction?.senderId,
                status: updatedTransactionData?.transaction?.status,
                isCompanyTransaction: updatedTransactionData?.transaction?.isCompanyTransaction,
                isInCash: updatedTransactionData?.transaction?.isInCash,
            };

            const exchangeWhereTransactionIs = allCurrencyExchanges.find(ex => ex.id === newTransaction.currencyExchangeId);
            if (!exchangeWhereTransactionIs) {
                throw Error("exchangeWhereTransactionIs not found");
            }

            const newTransactions = [
                ...exchangeWhereTransactionIs.transactions.filter(tr => tr.id !== newTransaction.id),
                newTransaction
            ];

            const inProgress = newTransactions
                .filter((t) => !['completed', 'canceled'].includes(t.status))
                .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

            const finished = newTransactions
                .filter((t) => ['completed'].includes(t.status))
                .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

            const updatedExchangeWhereTransactionIs = {
                ...exchangeWhereTransactionIs,
                inProgressTransactionsAmountInSelectedCurrency: inProgress,
                finishedTransactionsAmountInSelectedCurrency: finished,
                transactions: newTransactions
            };

            const begotteningExchange = allCurrencyExchanges.find(ex => ex.id === newTransaction.begottenByCurrencyExchangeId);
            if (begotteningExchange) {
                // if found -> transaction was begotten, and we must update begottening exchange too

                const newBegottenTransactions = [
                    ...begotteningExchange.begottenTransactions.filter(tr => tr.id !== newTransaction.id),
                    newTransaction
                ];

                const inProgressBegotten = newBegottenTransactions
                    .filter((t) => !['completed', 'canceled'].includes(t.status))
                    .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

                const finishedBegotten = newBegottenTransactions
                    .filter((t) => ['completed'].includes(t.status))
                    .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

                const updatedBegotteningExchange = {
                    ...begotteningExchange,
                    inProgressBegottenTransactionsAmountInSelectedCurrency: inProgressBegotten,
                    finishedBegottenTransactionsAmountInSelectedCurrency: finishedBegotten,
                    begottenTransactions: newBegottenTransactions,
                }

                setAllCurrencyExchanges([
                    ...allCurrencyExchanges.filter(ex =>
                        ex.id !== newTransaction.currencyExchangeId
                        && ex.id !== newTransaction.begottenByCurrencyExchangeId
                    ),
                    updatedExchangeWhereTransactionIs,
                    updatedBegotteningExchange
                ]);
            } else {
                setAllCurrencyExchanges([
                    ...allCurrencyExchanges.filter(ex =>
                        ex.id !== newTransaction.currencyExchangeId
                    ),
                    updatedExchangeWhereTransactionIs
                ]);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddTransaction = async () => {
        try {
            if (!selectedCurrencyExchangeId || !selectedCurrencyExchange) {
                throw Error("selectedCurrencyExchangeId and selectedCurrencyExchange is required");
            }

            const newTransactionData = await createTransactionMutation.mutateAsync({
                currencyExchangeId: selectedCurrencyExchangeId,
                isCompanyTransaction: true
            });

            const newTransaction = {
                id: newTransactionData?.transaction?.id,
                begottenByCurrencyExchangeId: newTransactionData?.transaction?.begottenByCurrencyExchangeId,
                currencyExchangeId: newTransactionData?.transaction?.currencyExchangeId,
                amountInSelectedCurrency: newTransactionData?.transaction?.amountInSelectedCurrency,
                checkUrl: newTransactionData?.transaction?.checkUrl,
                status: newTransactionData?.transaction?.status,
                isCompanyTransaction: newTransactionData?.transaction?.isCompanyTransaction,
                isInCash: newTransactionData?.transaction?.isInCash,
                senderId: newTransactionData?.transaction?.senderId,
            };

            const exchangeWhereTransactionIs = allCurrencyExchanges.find(ex => ex.id === newTransaction.currencyExchangeId);
            if (!exchangeWhereTransactionIs) throw Error("exchangeWhereTransactionIs not found");

            const newTransactions = [
                ...exchangeWhereTransactionIs.transactions.filter(tr => tr.id !== newTransaction.id),
                newTransaction
            ];

            const inProgress = newTransactions
                .filter((t) => !['completed', 'canceled'].includes(t.status))
                .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

            const finished = newTransactions
                .filter((t) => ['completed'].includes(t.status))
                .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

            const updatedExchangeWhereTransactionIs = {
                ...exchangeWhereTransactionIs,
                inProgressTransactionsAmountInSelectedCurrency: inProgress,
                finishedTransactionsAmountInSelectedCurrency: finished,
                transactions: newTransactions
            };

            setAllCurrencyExchanges([
                ...allCurrencyExchanges.filter(ex =>
                    ex.id !== newTransaction.currencyExchangeId
                ),
                updatedExchangeWhereTransactionIs
            ]);

            // const begotteningExchange = currencyExchanges.find(ex => ex.id === newTransaction.begottenByCurrencyExchangeId);
            // if (begotteningExchange) {
            //     // if found -> transaction was begotten, and we must update begottening exchange too
            //
            //     const newBegottenTransactions = [
            //         ...begotteningExchange.begottenTransactions.filter(tr => tr.id !== newTransaction.id),
            //         newTransaction
            //     ];
            //
            //     const inProgressBegotten = newBegottenTransactions
            //         .filter((t) => !['completed', 'canceled'].includes(t.status))
            //         .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);
            //
            //     const finishedBegotten = newBegottenTransactions
            //         .filter((t) => ['completed'].includes(t.status))
            //         .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);
            //
            //     const updatedBegotteningExchange = {
            //         ...begotteningExchange,
            //         inProgressBegottenTransactionsAmountInSelectedCurrency: inProgressBegotten,
            //         finishedBegottenTransactionsAmountInSelectedCurrency: finishedBegotten,
            //         begottenTransactions: newBegottenTransactions,
            //     }
            //
            //     setCurrencyExchanges([
            //         ...currencyExchanges.filter(ex =>
            //             ex.id !== newTransaction.currencyExchangeId
            //             && ex.id !== newTransaction.begottenByCurrencyExchangeId
            //         ),
            //         updatedExchangeWhereTransactionIs,
            //         updatedBegotteningExchange
            //     ]);
            // setAllCurrencyExchanges([
            //     ...allCurrencyExchanges.filter(ex =>
            //             ex.id !== newTransaction.currencyExchangeId
            //             && ex.id !== newTransaction.begottenByCurrencyExchangeId
            //     ),
            //     updatedExchangeWhereTransactionIs,
            //         updatedBegotteningExchange
            // ]);
            // } else {
            //     setCurrencyExchanges([
            //         ...currencyExchanges.filter(ex =>
            //             ex.id !== newTransaction.currencyExchangeId
            //         ),
            //         updatedExchangeWhereTransactionIs,
            //     ]);
            // setAllCurrencyExchanges([
            //     ...allCurrencyExchanges.filter(ex =>
            //         ex.id !== newTransaction.currencyExchangeId
            //     ),
            //     updatedExchangeWhereTransactionIs
            // ]);
            // }
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
                amountInSelectedCurrency: Number(transaction.amountInSelectedCurrency) || undefined,
                checkUrl: transaction.checkUrl,
                senderId: transaction.senderId || undefined,
                isInCash: transaction.isInCash,
            });

            const newTransaction = {
                id: editedTransactionData?.transaction?.id,
                begottenByCurrencyExchangeId: editedTransactionData?.transaction?.begottenByCurrencyExchangeId,
                currencyExchangeId: editedTransactionData?.transaction?.currencyExchangeId,
                amountInSelectedCurrency: editedTransactionData?.transaction?.amountInSelectedCurrency,
                checkUrl: editedTransactionData?.transaction?.checkUrl,
                senderId: editedTransactionData?.transaction?.senderId,
                status: editedTransactionData?.transaction?.status,
                isCompanyTransaction: editedTransactionData?.transaction?.isCompanyTransaction,
                isInCash: editedTransactionData?.transaction?.isInCash,
            };

            const exchangeWhereTransactionIs = allCurrencyExchanges.find(ex => ex.id === newTransaction.currencyExchangeId);
            if (!exchangeWhereTransactionIs) {
                throw Error("exchangeWhereTransactionIs not found");
            }

            const newTransactions = [
                ...exchangeWhereTransactionIs.transactions.filter(tr => tr.id !== newTransaction.id),
                newTransaction
            ];

            const inProgress = newTransactions
                .filter((t) => !['completed', 'canceled'].includes(t.status))
                .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

            const finished = newTransactions
                .filter((t) => ['completed'].includes(t.status))
                .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

            const updatedExchangeWhereTransactionIs = {
                ...exchangeWhereTransactionIs,
                inProgressTransactionsAmountInSelectedCurrency: inProgress,
                finishedTransactionsAmountInSelectedCurrency: finished,
                transactions: newTransactions
            };

            const begotteningExchange = allCurrencyExchanges.find(ex => ex.id === newTransaction.begottenByCurrencyExchangeId);
            if (begotteningExchange) {
                // if found -> transaction was begotten, and we must update begottening exchange too

                const newBegottenTransactions = [
                    ...begotteningExchange.begottenTransactions.filter(tr => tr.id !== newTransaction.id),
                    newTransaction
                ];

                const inProgressBegotten = newBegottenTransactions
                    .filter((t) => !['completed', 'canceled'].includes(t.status))
                    .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

                const finishedBegotten = newBegottenTransactions
                    .filter((t) => ['completed'].includes(t.status))
                    .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

                const updatedBegotteningExchange = {
                    ...begotteningExchange,
                    inProgressBegottenTransactionsAmountInSelectedCurrency: inProgressBegotten,
                    finishedBegottenTransactionsAmountInSelectedCurrency: finishedBegotten,
                    begottenTransactions: newBegottenTransactions,
                }

                setAllCurrencyExchanges([
                    ...allCurrencyExchanges.filter(ex =>
                        ex.id !== newTransaction.currencyExchangeId
                        && ex.id !== newTransaction.begottenByCurrencyExchangeId
                    ),
                    updatedExchangeWhereTransactionIs,
                    updatedBegotteningExchange
                ]);
            } else {
                setAllCurrencyExchanges([
                    ...allCurrencyExchanges.filter(ex =>
                        ex.id !== newTransaction.currencyExchangeId
                    ),
                    updatedExchangeWhereTransactionIs
                ]);
            }
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

            const exchangeWhereTransactionWas = allCurrencyExchanges
                .find(ex => ex.transactions.some(tr => tr.id === id));
            if (!exchangeWhereTransactionWas) {
                throw Error("exchangeWhereTransactionWas not found");
            }

            const newTransactions = exchangeWhereTransactionWas.transactions.filter(tr => tr.id !== id);

            const inProgress = newTransactions
                .filter((t) => !['completed', 'canceled'].includes(t.status))
                .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

            const finished = newTransactions
                .filter((t) => ['completed'].includes(t.status))
                .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

            const updatedExchangeWhereTransactionWas = {
                ...exchangeWhereTransactionWas,
                inProgressTransactionsAmountInSelectedCurrency: inProgress,
                finishedTransactionsAmountInSelectedCurrency: finished,
                transactions: [
                    ...newTransactions,
                ]
            };

            const begotteningExchange = allCurrencyExchanges
                .find(ex => ex.begottenTransactions.some(tr => tr.id === id));
            if (begotteningExchange) {
                // if found -> transaction was begotten, and we must update begottening exchange too

                const newBegottenTransactions = begotteningExchange.begottenTransactions.filter(tr => tr.id !== id);

                const inProgressBegotten = newBegottenTransactions
                    .filter((t) => !['completed', 'canceled'].includes(t.status))
                    .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

                const finishedBegotten = newBegottenTransactions
                    .filter((t) => ['completed'].includes(t.status))
                    .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

                const updatedBegotteningExchange = {
                    ...begotteningExchange,
                    inProgressBegottenTransactionsAmountInSelectedCurrency: inProgressBegotten,
                    finishedBegottenTransactionsAmountInSelectedCurrency: finishedBegotten,
                    begottenTransactions: newBegottenTransactions,
                }

                setAllCurrencyExchanges([
                    ...allCurrencyExchanges.filter(ex =>
                        ex.id !== exchangeWhereTransactionWas.id
                        && ex.id !== begotteningExchange.id
                    ),
                    updatedExchangeWhereTransactionWas,
                    updatedBegotteningExchange
                ]);
            } else {
                setAllCurrencyExchanges([
                    ...allCurrencyExchanges.filter(ex => ex.id !== exchangeWhereTransactionWas.id),
                    updatedExchangeWhereTransactionWas
                ]);
            }
        } catch (error) {
            console.error(error);
        }
    }

    console.log(selectedCurrencyExchange, allCurrencyExchanges)

    const handleAddFinalTransactionForBegotteningExchange = async () => {
        try {
            if (!selectedCurrencyExchangeId || !selectedCurrencyExchange) {
                throw Error("selectedCurrencyExchangeId and selectedCurrencyExchange is required");
            }

            const newTransactionData = await createTransactionMutation.mutateAsync({
                currencyExchangeId: selectedCurrencyExchangeId,
                amountInSelectedCurrency: Number(selectedCurrencyExchange.amountInSelectedCurrencyTo) || 0,
                isCompanyTransaction: true
            });

            const newTransaction = {
                id: newTransactionData?.transaction?.id,
                begottenByCurrencyExchangeId: newTransactionData?.transaction?.begottenByCurrencyExchangeId,
                currencyExchangeId: newTransactionData?.transaction?.currencyExchangeId,
                amountInSelectedCurrency: newTransactionData?.transaction?.amountInSelectedCurrency,
                checkUrl: newTransactionData?.transaction?.checkUrl,
                status: newTransactionData?.transaction?.status,
                isCompanyTransaction: newTransactionData?.transaction?.isCompanyTransaction,
                isInCash: newTransactionData?.transaction?.isInCash,
                senderId: newTransactionData?.transaction?.senderId,
            };

            const exchangeWhereTransactionIs = allCurrencyExchanges.find(ex => ex.id === newTransaction.currencyExchangeId);
            if (!exchangeWhereTransactionIs) throw Error("exchangeWhereTransactionIs not found");

            const newTransactions = [
                ...exchangeWhereTransactionIs.transactions.filter(tr => tr.id !== newTransaction.id),
                newTransaction
            ];

            const inProgress = newTransactions
                .filter((t) => !['completed', 'canceled'].includes(t.status))
                .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

            const finished = newTransactions
                .filter((t) => ['completed'].includes(t.status))
                .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

            const updatedExchangeWhereTransactionIs = {
                ...exchangeWhereTransactionIs,
                inProgressTransactionsAmountInSelectedCurrency: inProgress,
                finishedTransactionsAmountInSelectedCurrency: finished,
                transactions: newTransactions
            };

            setAllCurrencyExchanges([
                ...allCurrencyExchanges.filter(ex =>
                    ex.id !== newTransaction.currencyExchangeId
                ),
                updatedExchangeWhereTransactionIs
            ]);
        } catch (error) {
            finalTransactionCreated.current = false;
            console.error(error);
        }
    };

    useEffect(() => {
        if (!selectedCurrencyExchange?.isBegottening) return;

        console.log(finalTransactionCreated.current, finalTransactionForBegotteningExchange, selectedCurrencyExchange.finishedBegottenTransactionsAmountInSelectedCurrency, selectedCurrencyExchange.amountInSelectedCurrencyFrom)

        // Condition to create finalTransactionForBegotteningExchange
        if (
            !finalTransactionCreated.current
            && !finalTransactionForBegotteningExchange
            && Number(selectedCurrencyExchange?.finishedBegottenTransactionsAmountInSelectedCurrency) > 0
            && selectedCurrencyExchange.finishedBegottenTransactionsAmountInSelectedCurrency == selectedCurrencyExchange.amountInSelectedCurrencyFrom
        ) {
            finalTransactionCreated.current = true;
            handleAddFinalTransactionForBegotteningExchange();
        }
    }, [selectedCurrencyExchange?.finishedBegottenTransactionsAmountInSelectedCurrency]);

    const bankingDetailsContent = selectedCurrencyExchange?.orderItem?.client?.bankingDetails?.content?.split('|').join(' · ');
    const bankingDetailsUrl = selectedCurrencyExchange?.orderItem?.client.bankingDetails.documentUrl;

    const [clientInformed, setClientInformed] = useState<boolean>(false);
    const [summaryIsOpened, setSummaryIsOpened] = useState<boolean>(false);
    const [summaryIsHidden, setSummaryIsHidden] = useState<boolean>(true);
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
            }
        } catch (error) {
            console.error(error);
        }
    }

    const handleDownloadBankingDetailsFile = (documentUrl: string) => {
        const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/upload/file/${documentUrl}`;

        // Element will not be visible
        const link = document.createElement("a");
        link.href = url;
        link.download = documentUrl.split('/')[1];
        link.click();
    }

    if (isLoadingUsers) {
        return (
            <div className="p-6">
                <div className="text-center">Loading users...</div>
            </div>
        )
    }

    if (errorUsers) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <h3 className="font-medium text-lg mb-2">Error Loading Users</h3>
                <p>{errorUsers.message}</p>
            </div>
        )
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
                <DialogContent className="min-w-3/5 min-h-1/2 max-h-[90%] overflow-y-auto bg-secondary">
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

                                {selectedCurrencyExchange?.isBegottening ? (
                                    <div>
                                        {selectedCurrencyExchange?.amountInSelectedCurrencyFrom
                                            && selectedCurrencyExchange.fromCurrency
                                            && selectedCurrencyExchange.begottenTransactions?.length > 0 && (
                                            <div className="flex min-w-1/4 flex-col justify-center pt-1 gap-0.5">
                                                <div className={`text-white flex gap-25 justify-between text-sm`}>
                                                    <span>
                                                        {getCurrencyAmount(selectedCurrencyExchange.amountInSelectedCurrencyFrom, selectedCurrencyExchange.fromCurrency.name)}
                                                    </span>
                                                    <span>
                                                        {getCurrencySymbol(selectedCurrencyExchange.fromCurrency.name)}
                                                    </span>
                                                </div>

                                                <Progress
                                                    value={
                                                        (selectedCurrencyExchange.begottenTransactions.filter(tr => tr.status === 'completed').reduce((acc, tr) => acc + Number(tr.amountInSelectedCurrency), 0) / selectedCurrencyExchange.amountInSelectedCurrencyFrom * 100) || 0
                                                    }
                                                    className="w-full bg-emerald-900 [&>div]:bg-success h-[4px]"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
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
                                                } flex gap-2 justify-between text-sm gap-25`}>
                                                    <span>
                                                        {getCurrencyAmount(selectedCurrencyExchange.amountInSelectedCurrencyTo, selectedCurrencyExchange.toCurrency.name)}
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
                                    </div>
                                )}

                                {selectedCurrencyExchange?.isBegottening ? (
                                    <div>
                                        {selectedCurrencyExchange?.begottenTransactions?.length > 0 && selectedCurrencyExchange?.fromCurrency && (
                                            <div className="">
                                                <Summ className="bg-success text-gray-950 h-fit">
                                                    <Check />
                                                    {formatCurrency(selectedCurrencyExchange.begottenTransactions.filter(tr => tr.status === 'completed').reduce((acc, tr) => acc + Number(tr.amountInSelectedCurrency), 0), selectedCurrencyExchange.fromCurrency.name)}
                                                </Summ>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
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
                                    </div>
                                )}

                                {selectedCurrencyExchange?.isBegottening ? (
                                    <div>
                                        {selectedCurrencyExchange?.begottenTransactions?.length > 0 && selectedCurrencyExchange?.fromCurrency && (
                                            <div>
                                                <Summ className="bg-amber-600">
                                                    <IconLoader />
                                                    {formatCurrency(selectedCurrencyExchange.begottenTransactions.filter(tr => tr.status !== 'completed').reduce((acc, tr) => acc + Number(tr.amountInSelectedCurrency), 0), selectedCurrencyExchange.fromCurrency.name)}
                                                </Summ>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
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
                                )}
                            </div>

                            {!selectedCurrencyExchange?.isBegottening && (
                                <div className="flex gap-2 text-sm text-muted-foreground">
                                    <div>
                                        Dl: {selectedCurrencyExchange?.deadline ? formatDate(selectedCurrencyExchange.deadline) : 'Indefinitely'}
                                    </div>
                                    <div>
                                        Min Pymt: {selectedCurrencyExchange?.minTransactionAmountInSelectedCurrency || 'Indefinitely'}
                                    </div>
                                </div>
                            )}

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
                                            {selectedCurrencyExchange && (
                                                <ExchangeTag currencyExchange={selectedCurrencyExchange} />
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

                                    {!selectedCurrencyExchange?.isBegottening && (
                                        <div className="max-w-1/4">
                                            <Button
                                                className={`${
                                                    copiedText === bankingDetailsContent && bankingDetailsContent
                                                        ? 'bg-green-500/20 text-green-300'
                                                        : 'bg-muted hover:bg-muted/80'
                                                } w-full overflow-hidden hover:bg-gray-500`}
                                                onClick={(e) => {
                                                    if (bankingDetailsContent)
                                                        handleCopyToClipboard(e, bankingDetailsContent)
                                                    else if (selectedCurrencyExchange?.orderItem?.client.bankingDetails.documentUrl)
                                                        handleDownloadBankingDetailsFile(selectedCurrencyExchange?.orderItem?.client.bankingDetails.documentUrl)
                                                }}
                                                variant="secondary"
                                            >
                                                {selectedCurrencyExchange?.orderItem?.client.bankingDetails.content ? (
                                                    <>
                                                        {copiedText === bankingDetailsContent ? (
                                                            <Check className="w-3 h-3 ml-1 animate-pulse" />
                                                        ) : (
                                                            <Copy className="w-3 h-3 ml-1" />
                                                        )}
                                                        <span className="block truncate text-ellipsis">
                                                            {bankingDetailsContent}
                                                        </span>
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

                            <div
                                className="flex flex-col gap-3"
                            >
                                {selectedCurrencyExchange?.isBegottening && finalTransactionForBegotteningExchange ? (
                                    <div className="flex">
                                        <span className="text-xs">
                                            Payment for {selectedCurrencyExchange?.orderItem?.client?.firstName} {selectedCurrencyExchange?.orderItem?.client?.lastName}
                                        </span>
                                    </div>
                                ) : (
                                    <div
                                        className="flex"
                                        onClick={() => setSummaryIsHidden(prevState => !prevState)}
                                    >
                                        <span className="text-xs">
                                            Payment summary for {selectedCurrencyExchange?.orderItem?.client?.firstName} {selectedCurrencyExchange?.orderItem?.client?.lastName}
                                        </span>
                                        {summaryIsHidden ? (
                                            <ChevronDown className="h-4" />
                                        ) : (
                                            <ChevronUp className="h-4" />
                                        )}
                                    </div>
                                )}
                                <div>
                                    {selectedCurrencyExchange?.isBegottening && finalTransactionForBegotteningExchange && (
                                        <FinalTransactionForBegotteningExchange
                                            selectedCurrencyExchange={selectedCurrencyExchange}
                                            transaction={finalTransactionForBegotteningExchange}
                                            users={users}
                                            handleEditTransaction={handleEditTransaction}
                                            copiedText={copiedText}
                                            handleCopyToClipboard={handleCopyToClipboard}
                                            handleDownloadBankingDetailsFile={handleDownloadBankingDetailsFile}
                                            bankingDetailsContent={bankingDetailsContent}
                                            summary={summary}
                                            summaryIsOpened={summaryIsOpened}
                                            setSummaryIsOpened={setSummaryIsOpened}
                                            updateStatusTransaction={updateStatusTransaction}
                                        />
                                    )}
                                </div>
                                <Card
                                    className="flex flex-row gap-2 justify-between p-4 bg-secondary"
                                    hidden={summaryIsHidden || (selectedCurrencyExchange?.isBegottening && !!finalTransactionForBegotteningExchange)}
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

                                {!selectedCurrencyExchange?.isBegottening && (
                                    <div
                                        className="flex justify-end gap-4"
                                        hidden={!Number(selectedCurrencyExchange?.amountInSelectedCurrencyTo)
                                            || Number(selectedCurrencyExchange?.amountInSelectedCurrencyTo) !== Number(selectedCurrencyExchange?.finishedTransactionsAmountInSelectedCurrency)
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
                                )}
                            </div>

                            <hr />

                            <div className="flex flex-col gap-5 max-h-120 overflow-y-auto pb-1">
                                {selectedCurrencyExchange?.isBegottening
                                    ? selectedCurrencyExchange?.begottenTransactions?.map((transaction) => {
                                        return (<TransactionCard
                                            key={transaction.id}
                                            transaction={transaction}
                                            exchangeDetailsToShow={allCurrencyExchanges.find(ex => ex.id === transaction.currencyExchangeId)}
                                            handleDeleteTransaction={handleDeleteTransaction}
                                            handleEditTransaction={handleEditTransaction}
                                            copiedText={copiedText}
                                            handleCopyToClipboard={handleCopyToClipboard}
                                            users={users}
                                            updateStatusTransaction={updateStatusTransaction}
                                        />)
                                    })
                                    : selectedCurrencyExchange?.transactions?.map((transaction) => {
                                        return (<TransactionCard
                                            key={transaction.id}
                                            transaction={transaction}
                                            exchangeDetailsToShow={allCurrencyExchanges.find(ex => ex.id === transaction.begottenByCurrencyExchangeId)}
                                            handleDeleteTransaction={handleDeleteTransaction}
                                            handleEditTransaction={handleEditTransaction}
                                            copiedText={copiedText}
                                            handleCopyToClipboard={handleCopyToClipboard}
                                            users={users}
                                            updateStatusTransaction={updateStatusTransaction}
                                        />)
                                    })
                                }
                            </div>

                            <div className="flex w-full">
                                <Button
                                    className="w-full border-blue-400 text-blue-400"
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