import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '@/lib/trpc.ts';
import { useEffect, useState } from 'react';
import CurrenciesSelectionRow from '@/components/Order/sections/CurrencyExchangeSection/CurrenciesSelectionRow.tsx';
import PaymentDetails from '@/components/Order/sections/CurrencyExchangeSection/PaymentDetails.tsx';
import BankingDetailsCard from '@/components/Order/sections/CurrencyExchangeSection/BankingDetailsCard.tsx';
import useOrderStore, {
  StoreClient,
  StoreCurrencyExchange,
  StoreOrderItem,
} from '@/stores/order/order-store.ts';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog.tsx';

const formSchema = z.object({
  exchangeRate: z.number().positive().optional(),
  amountInSelectedCurrencyFrom: z.number().positive().optional(),
  amountInSelectedCurrencyTo: z.number().positive().optional(),
  deadline: z.date().optional(),
  minTransactionAmountInSelectedCurrency: z.number().positive().optional(),
  orderItemId: z.string(),
  fromCurrencyId: z.string(),
  toCurrencyId: z.string(),
});

interface CurrencyExchange {
  position: number;
  exchangeRate?: number;
  amountInSelectedCurrencyFrom?: number;
  amountInSelectedCurrencyTo?: number;
  deadline?: Date;
  minTransactionAmountInSelectedCurrency?: number;
  orderItemId?: string;
  fromCurrencyId?: string;
  toCurrencyId?: string;
}

type FieldName =
  | 'exchangeRate'
  | 'amountInSelectedCurrencyFrom'
  | 'amountInSelectedCurrencyTo'
  | 'deadline'
  | 'minTransactionAmountInSelectedCurrency'
  | 'orderItemId'
  | 'fromCurrencyId'
  | 'toCurrencyId';

const CurrencyExchangeCard = ({
  savedExchange,
  client,
  orderItem,
  handleDeleteCurrencyExchange,
}: {
  savedExchange: StoreCurrencyExchange;
  client: StoreClient;
  orderItem: StoreOrderItem;
  handleDeleteCurrencyExchange: (orderItemId: string) => void;
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      exchangeRate: savedExchange?.exchangeRate,
      amountInSelectedCurrencyFrom: savedExchange?.amountInSelectedCurrencyFrom,
      amountInSelectedCurrencyTo: savedExchange?.amountInSelectedCurrencyTo,
      deadline: savedExchange?.deadline ? new Date(savedExchange.deadline) : undefined,
      minTransactionAmountInSelectedCurrency: savedExchange?.minTransactionAmountInSelectedCurrency,
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
    setClients,
    orderItems,
    setOrderItems,
  } = useOrderStore();

  const editCurrencyExchangeMutation = trpc.currencyExchange.edit.useMutation();
  const editOrderItemMutation = trpc.orderItem.edit.useMutation();

  const createBankingDetailsMutation = trpc.bankingDetails.create.useMutation();
  const editBankingDetailsMutation = trpc.bankingDetails.edit.useMutation();

  const [currencyExchange, setCurrencyExchange] = useState<CurrencyExchange>({
    position: savedExchange?.position,
    exchangeRate: savedExchange?.exchangeRate,
    amountInSelectedCurrencyFrom: savedExchange?.amountInSelectedCurrencyFrom,
    amountInSelectedCurrencyTo: savedExchange?.amountInSelectedCurrencyTo,
    deadline: savedExchange?.deadline ? new Date(savedExchange.deadline) : undefined,
    minTransactionAmountInSelectedCurrency: savedExchange?.minTransactionAmountInSelectedCurrency,
    orderItemId: savedExchange?.orderItemId,
    fromCurrencyId: savedExchange?.fromCurrencyId,
    toCurrencyId: savedExchange?.toCurrencyId,
  });

  const normalizeInput = (input: Record<string, any>) => {
    input.exchangeRate = Number.parseInt(input.exchangeRate) || undefined;
    input.amountInSelectedCurrencyFrom =
      Number.parseInt(input.amountInSelectedCurrencyFrom) || undefined;
    input.amountInSelectedCurrencyTo =
      Number.parseInt(input.amountInSelectedCurrencyTo) || undefined;
    input.deadline = input.deadline || undefined;
    input.minTransactionAmountInSelectedCurrency =
      Number.parseInt(input.minTransactionAmountInSelectedCurrency) || undefined;
    input.orderItemId = input.orderItemId || undefined;
    input.fromCurrencyId = input.fromCurrencyId || undefined;
    input.toCurrencyId = input.toCurrencyId || undefined;
    input.status = input.status || 'draft';
    input.cancelReason = input.cancelReason || undefined;
    input.canceledByClient = input.canceledByClient || undefined;

    return input;
  };

  const sendNormalizedInput = async (normalizedInput: any) => {
    await editCurrencyExchangeMutation.mutateAsync(normalizedInput);
  };

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
      currencyExchanges.map(ex =>
        ex.orderItemId === currencyExchange.orderItemId ? updatedCurrencyExchange : ex
      )
    );

    try {
      await sendNormalizedInput(
        normalizeInput({
          id: updatedCurrencyExchange.id,
          exchangeRate: updatedCurrencyExchange.exchangeRate,
          amountInSelectedCurrencyFrom: updatedCurrencyExchange.amountInSelectedCurrencyFrom,
          amountInSelectedCurrencyTo: updatedCurrencyExchange.amountInSelectedCurrencyTo,
          status: updatedCurrencyExchange.status,
          cancelReason: updatedCurrencyExchange.cancelReason,
          canceledByClient: updatedCurrencyExchange.canceledByClient,
          deadline: updatedCurrencyExchange.deadline?.toISOString(),
          minTransactionAmountInSelectedCurrency:
            updatedCurrencyExchange.minTransactionAmountInSelectedCurrency,
          fromCurrencyId: updatedCurrencyExchange.fromCurrencyId,
          toCurrencyId: updatedCurrencyExchange.toCurrencyId,
        })
      );

      const itemPrice = updatedCurrencyExchange.amountInSelectedCurrencyFrom;

      // Only update if the price has actually changed
      if (orderItem.finalPrice !== itemPrice) {
        const updatedOrderItems = orderItems.map(i =>
          i.id === orderItem.id
            ? {
                ...orderItem,
                basePrice: itemPrice ?? 0,
                finalPrice: itemPrice ?? 0,
              }
            : i
        );

        setOrderItems(updatedOrderItems);

        await editOrderItemMutation.mutateAsync({
          id: orderItem.id || '',
          basePrice: itemPrice || 0,
          finalPrice: itemPrice || 0,
        });
      }

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

  const [paymentType, setPaymentType] = useState('partial');

  const handleAmountInSelectedCurrencyToBlur = (value: number) => {
    if (paymentType == 'full') {
      setCurrencyExchange({
        ...currencyExchange,
        amountInSelectedCurrencyTo: value || undefined,
        minTransactionAmountInSelectedCurrency: value || undefined,
      });
    } else {
      handleBlur('amountInSelectedCurrencyTo', value);
    }
  };

  const saveBankingDetails = async (
    bankingDetailsType: 'card' | 'file',
    bankName: string,
    cardOrPhoneNumber: string,
    holderName: string,
    holderSurname: string,
    documentUrl: string | null
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
          content: bankingDetailsType === 'card' ? content : undefined,
          documentUrl: bankingDetailsType === 'file' ? documentUrl : undefined,
          clientId: client.id,
        };

        console.log('new', newBankingDetails);

        const newBankingDetailsId: string = (
          await createBankingDetailsMutation.mutateAsync(newBankingDetails)
        ).id;

        setClients(
          clients.map(cl =>
            cl.id === client.id
              ? {
                  ...cl,
                  bankingDetails: {
                    id: newBankingDetailsId,
                    ...newBankingDetails,
                  },
                }
              : cl
          )
        );
      } else {
        //edit
        const newBankingDetails = {
          content: bankingDetailsType === 'card' ? content : null,
          documentUrl: bankingDetailsType === 'file' ? documentUrl : null,
          clientId: client.id,
          id: client.bankingDetails.id,
        };

        console.log('edit', newBankingDetails);

        await editBankingDetailsMutation.mutateAsync(newBankingDetails);

        setClients(
          clients.map(cl =>
            cl.id === client.id
              ? {
                  ...cl,
                  bankingDetails: newBankingDetails,
                }
              : cl
          )
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
          #<Badge variant={'accent'}>{currencyExchange.position}</Badge>
        </div>
        <div>
          {currencyExchange.orderItemId && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Currency Exchange</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this exchange? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteCurrencyExchange(currencyExchange.orderItemId || '')}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
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
  );
};

export default CurrencyExchangeCard;
