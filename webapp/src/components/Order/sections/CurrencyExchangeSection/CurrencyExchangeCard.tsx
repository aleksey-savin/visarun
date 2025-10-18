import { Badge } from "@/components/ui/badge";
import {Card} from "@/components/ui/card";
import {Form} from "@/components/ui/form";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {trpc} from "@/lib/trpc.ts";
import {useEffect, useState} from "react";
import CurrenciesSelectionRow from "@/components/Order/sections/CurrencyExchangeSection/CurrenciesSelectionRow.tsx";
import PaymentDetails from "@/components/Order/sections/CurrencyExchangeSection/PaymentDetails.tsx";
import BankingDetailsCard from "@/components/Order/sections/CurrencyExchangeSection/BankingDetailsCard.tsx";
import useOrderStore, {StoreClient, StoreCurrencyExchange} from "@/stores/order/order-store.ts";

const formSchema = z.object({
    exchangeRate: z.number().positive().optional(),
    amount: z.number().positive().optional(),
    amountInSelectedCurrencyFrom: z.number().positive().optional(),
    amountInSelectedCurrencyTo: z.number().positive().optional(),
    deadline: z.date().optional(),
    minTransactionAmount: z.number().positive().optional(),
    orderItemId: z.string(),
    fromCurrencyId: z.string(),
    toCurrencyId: z.string(),
});

interface CurrencyExchange {
    position: number,
    exchangeRate?: number,
    amount?: number,
    amountInSelectedCurrencyFrom?: number,
    amountInSelectedCurrencyTo?: number,
    deadline?: Date,
    minTransactionAmount?: number,
    orderItemId?: string,
    fromCurrencyId?: string,
    toCurrencyId?: string,
}

type FieldName = "exchangeRate" | "amount" | "amountInSelectedCurrencyFrom" | "amountInSelectedCurrencyTo" | "deadline" | "minTransactionAmount" | "orderItemId" | "fromCurrencyId" | "toCurrencyId";

const CurrencyExchangeCard = ({ savedExchange, client }: { savedExchange: StoreCurrencyExchange, client: StoreClient }) => {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            exchangeRate: savedExchange?.exchangeRate,
            amount: savedExchange?.amount,
            amountInSelectedCurrencyFrom: savedExchange?.amountInSelectedCurrencyFrom,
            amountInSelectedCurrencyTo: savedExchange?.amountInSelectedCurrencyTo,
            deadline: savedExchange?.deadline
                ? new Date(savedExchange.deadline)
                : undefined,
            minTransactionAmount: savedExchange?.minTransactionAmount,
            orderItemId: savedExchange?.orderItemId,
            fromCurrencyId: savedExchange?.fromCurrencyId,
            toCurrencyId: savedExchange?.toCurrencyId,
        },
    });

    const {
        currencyExchanges,
        setCurrencyExchanges,
        setSaveStatus,
        clients,
        setClients
    } = useOrderStore();

    const editCurrencyExchangeMutation = trpc.currencyExchange.edit.useMutation();

    const createBankingDetailsMutation = trpc.bankingDetails.create.useMutation();
    const editBankingDetailsMutation = trpc.bankingDetails.edit.useMutation();

    const [currencyExchange, setCurrencyExchange] = useState<CurrencyExchange>({
        position: savedExchange?.position,
        exchangeRate: savedExchange?.exchangeRate,
        amount: savedExchange?.amount,
        amountInSelectedCurrencyFrom: savedExchange?.amountInSelectedCurrencyFrom,
        amountInSelectedCurrencyTo: savedExchange?.amountInSelectedCurrencyTo,
        deadline: savedExchange?.deadline
            ? new Date(savedExchange.deadline)
            : undefined,
        minTransactionAmount: savedExchange?.minTransactionAmount,
        orderItemId: savedExchange?.orderItemId,
        fromCurrencyId: savedExchange?.fromCurrencyId,
        toCurrencyId: savedExchange?.toCurrencyId,
    });

    const normalizeInput = (input: Record<string, any>) => {
        input.exchangeRate = Number.parseInt(input.exchangeRate) || undefined;
        input.amount = Number.parseInt(input.amount) || undefined;
        input.amountInSelectedCurrencyFrom = Number.parseInt(input.amountInSelectedCurrencyFrom) || undefined;
        input.amountInSelectedCurrencyTo = Number.parseInt(input.amountInSelectedCurrencyTo) || undefined;
        input.deadline = input.deadline || undefined;
        input.minTransactionAmount = Number.parseInt(input.minTransactionAmount) || undefined;
        input.orderItemId = input.orderItemId || undefined;
        input.fromCurrencyId = input.fromCurrencyId || undefined;
        input.toCurrencyId = input.toCurrencyId || undefined;
        input.status = input.status || "draft";
        input.cancelReason = input.cancelReason || undefined;
        input.canceledByClient = input.canceledByClient || undefined;

        return input;
    }

    const sendNormalizedInput = async (normalizedInput: any) => {
        await editCurrencyExchangeMutation.mutateAsync(normalizedInput);
    }

    const saveExchange = async () => {
        setSaveStatus('saving');

        if (!savedExchange?.id) {
            setSaveStatus('error');
            return;
        }

        const updatedCurrencyExchange = {
            ...savedExchange,
            ...currencyExchange,
        };

        setCurrencyExchanges(
            currencyExchanges.map(ex => (ex.orderItemId === currencyExchange.orderItemId ? updatedCurrencyExchange : ex))
        );

        try {
            await sendNormalizedInput(normalizeInput({
                id: updatedCurrencyExchange.id,
                exchangeRate: updatedCurrencyExchange.exchangeRate,
                amount: updatedCurrencyExchange.amount,
                amountInSelectedCurrencyFrom: updatedCurrencyExchange.amountInSelectedCurrencyFrom,
                amountInSelectedCurrencyTo: updatedCurrencyExchange.amountInSelectedCurrencyTo,
                status: updatedCurrencyExchange.status,
                cancelReason: updatedCurrencyExchange.cancelReason,
                canceledByClient: updatedCurrencyExchange.canceledByClient,
                deadline: updatedCurrencyExchange.deadline?.toISOString(),
                minTransactionAmount: updatedCurrencyExchange.minTransactionAmount,
                fromCurrencyId: updatedCurrencyExchange.fromCurrencyId,
                toCurrencyId: updatedCurrencyExchange.toCurrencyId,
            }));

            setSaveStatus('saved');
        } catch {
            setSaveStatus('error');
        }

        setSaveStatus('saved');
    };

    const handleChange = (field: any, value: string) => {
        field.onChange(value);
    };

    const handleBlur = (fieldName: FieldName, value: any = undefined) => {
        setCurrencyExchange({
            ...currencyExchange,
            [fieldName]: value ? value : form.getValues(fieldName),
        });
    };

    const [paymentType, setPaymentType] = useState("partial");

    const handleAmountInSelectedCurrencyToBlur = (value: number) => {
        if (paymentType == "full") {
            setCurrencyExchange({
                ...currencyExchange,
                amountInSelectedCurrencyTo: value || undefined,
                minTransactionAmount: value || undefined,
            });
        } else {
            handleBlur("amountInSelectedCurrencyTo", value);
        }
    };

    const saveBankingDetails = async (
        bankingDetailsType: "card" | "file",
        bankName: string,
        cardOrPhoneNumber: string,
        holderName: string,
        holderSurname: string,
        documentUrl: string
    ) => {
        const content = `${bankName}|${cardOrPhoneNumber}|${holderName}|${holderSurname}`;

        setSaveStatus('saving');

        if (!client?.id) {
            setSaveStatus('error');
            return;
        }

        try {
            if (!client.bankingDetails) {
                //add new
                const newBankingDetails = {
                    content: bankingDetailsType === "card" ? content : undefined,
                    documentUrl: bankingDetailsType === "file" ? documentUrl : undefined,
                    clientId: client.id,
                };

                const newBankingDetailsId: string = (await createBankingDetailsMutation.mutateAsync(newBankingDetails)).id;

                setClients(
                    clients.map(cl => (cl.id === client.id ? {
                        ...cl,
                        bankingDetails: {
                            id: newBankingDetailsId,
                            ...newBankingDetails
                        },
                    } : cl))
                );
            } else {
                //edit
                const newBankingDetails = {
                    content: bankingDetailsType === "card" ? content : undefined,
                    documentUrl: bankingDetailsType === "file" ? documentUrl : undefined,
                    clientId: client.id,
                    id: client.bankingDetails.id
                };

                await editBankingDetailsMutation.mutateAsync(newBankingDetails);

                setClients(
                    clients.map(cl => (cl.id === client.id ? {
                        ...cl,
                        bankingDetails: newBankingDetails,
                    } : cl))
                );
            }

            setSaveStatus('saved');
        } catch {
            setSaveStatus('error');
        }

        setSaveStatus('saved');
    };

    useEffect(() => {
        saveExchange();
    }, [currencyExchange]);

    return (
        <Card className="p-3 bg-secondary gap-5">
            <div className="flex justify-between">
                <div className="flex flex-wrap items-start gap-2">
                    #
                    <Badge variant={'accent'}>
                        {currencyExchange.position}
                    </Badge>
                </div>
            </div>
            <Form {...form}>
                <CurrenciesSelectionRow
                    form={form}
                    currencyExchange={currencyExchange}
                    handleBlur={handleBlur}
                    handleChange={handleChange}
                    handleAmountInSelectedCurrencyToBlur={handleAmountInSelectedCurrencyToBlur}
                />

                <PaymentDetails
                    form={form}
                    currencyExchange={currencyExchange}
                    setCurrencyExchange={setCurrencyExchange}
                    paymentType={paymentType}
                    setPaymentType={setPaymentType}
                    handleBlur={handleBlur}
                    handleChange={handleChange}
                />

                <BankingDetailsCard
                    saveBankingDetails={saveBankingDetails}
                    existingBankingDetails={client.bankingDetails}
                />
            </Form>
        </Card>
    )
};



export default CurrencyExchangeCard;