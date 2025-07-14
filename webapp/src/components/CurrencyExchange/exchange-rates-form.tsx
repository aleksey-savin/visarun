import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useState, useEffect, useMemo } from 'react';

import { Button } from '@/components/ui/button';

import {
  Form,
  FormControl,
  FormField,
  // FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
// import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

import { CheckCircle, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpcProvider';
import { SimpleEditor } from '../tiptap-templates/simple/simple-editor';

const ExchangeRatesSchema = z.object({
  // RUB to VND
  rubToVnd: z.string().refine(val => !isNaN(parseFloat(val)), {
    message: 'Must be a valid number',
  }),
  // VND to RUB
  vndToRub: z.string().refine(val => !isNaN(parseFloat(val)), {
    message: 'Must be a valid number',
  }),
  // USDT to VND
  usdtToVnd: z.string().refine(val => !isNaN(parseFloat(val)), {
    message: 'Must be a valid number',
  }),
  // VND to USDT
  vndToUsdt: z.string().refine(val => !isNaN(parseFloat(val)), {
    message: 'Must be a valid number',
  }),
  // USDT to RUB
  usdtToRub: z.string().refine(val => !isNaN(parseFloat(val)), {
    message: 'Must be a valid number',
  }),
  // RUB to USDT
  rubToUsdt: z.string().refine(val => !isNaN(parseFloat(val)), {
    message: 'Must be a valid number',
  }),
  // Exchange Rate for RUB-USDT pair
  exchangeRate: z.string().optional(),
  broadcastTo: z.array(z.object({ channelId: z.string(), body: z.string() })).min(0),
});

type ExchangeRatesFormValues = z.infer<typeof ExchangeRatesSchema>;

interface ExchangeRatesFormProps {
  onRatesUpdated?: () => void;
  initialValues?: {
    rubToVnd: number;
    vndToRub: number;
    usdtToVnd: number;
    vndToUsdt: number;
    usdtToRub: number;
    rubToUsdt: number;
  };
}

type MessageType = {
  channelId: string;
  body: string;
};

// Helper function to round to nearest 0.1 in our favor
const roundInOurFavor = (value: number, isUsdtToRub: boolean): number => {
  const multiplier = 10; // For rounding to 0.1
  // Round down for USDT to RUB (buying USDT), round up for RUB to USDT (selling USDT)
  return isUsdtToRub
    ? Math.ceil(value * multiplier) / multiplier
    : Math.floor(value * multiplier) / multiplier;
};

export function ExchangeRatesForm({ onRatesUpdated, initialValues }: ExchangeRatesFormProps) {
  const [formStatus, setFormStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({
    type: null,
    message: '',
  });

  const saveExchangeRate = trpc.exchangeRates.saveExchangeRate.useMutation({
    onSuccess: () => {
      setFormStatus({
        type: 'success',
        message: 'Exchange rates updated successfully!',
      });
      setIsSubmitting(false);
      if (onRatesUpdated) {
        onRatesUpdated();
      }
    },
    onError: error => {
      setFormStatus({
        type: 'error',
        message: `Failed to update exchange rates: ${error.message}`,
      });
    },
  });

  const form = useForm<ExchangeRatesFormValues>({
    resolver: zodResolver(ExchangeRatesSchema),
    defaultValues: {
      rubToVnd: initialValues ? (initialValues.rubToVnd * 10000).toString() : '',
      vndToRub: initialValues ? (initialValues.vndToRub * 1000).toString() : '',
      usdtToVnd: initialValues ? initialValues.usdtToVnd.toString() : '',
      vndToUsdt: initialValues ? initialValues.vndToUsdt.toString() : '',
      usdtToRub: initialValues ? initialValues.usdtToRub.toString() : '',
      rubToUsdt: initialValues ? initialValues.rubToUsdt.toString() : '',
      exchangeRate: '',
      broadcastTo: [],
    },
  });

  const { data: telegramChannelsData } = trpc.telegramChannel.getAll.useQuery();

  // Watch the exchange rate field value
  const exchangeRate = useWatch({
    control: form.control,
    name: 'exchangeRate',
  });

  // Update USDT-RUB rates based on the exchange rate
  useEffect(() => {
    if (exchangeRate && !isNaN(parseFloat(exchangeRate))) {
      const rate = parseFloat(exchangeRate);
      // Calculate values based on the formula
      const usdtToRubValue = roundInOurFavor(rate * 0.97, true); // Exchange Rate * 0.97
      const rubToUsdtValue = roundInOurFavor(rate * 1.03, false); // Exchange Rate * 1.03

      // Update the form fields
      form.setValue('usdtToRub', usdtToRubValue.toString());
      form.setValue('rubToUsdt', rubToUsdtValue.toString());
    }
  }, [exchangeRate, form]);

  const initialMessages = useMemo(() => {
    return (
      telegramChannelsData?.channels
        ?.map(channel => ({
          channelId: channel.id,
          body: channel?.messageTemplate?.body || '',
        }))
        .filter((message): message is MessageType => message !== null) ?? []
    );
  }, [telegramChannelsData]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [messages, setMessages] = useState<MessageType[]>([]);

  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  function onEditMessage(body: string) {
    setMessages(prev =>
      prev.map(message =>
        message.channelId === selectedChannelId
          ? { channelId: selectedChannelId, body: body }
          : message
      )
    );
  }

  function onCancel() {
    setIsSubmitting(false);
    setMessages(initialMessages);
  }

  function onConfirm() {
    setIsSubmitting(true);
  }

  async function onSubmit(data: ExchangeRatesFormValues) {
    try {
      setFormStatus({ type: null, message: '' });

      data.broadcastTo.map(channel => {
        const updatedChannel = channel;

        updatedChannel.body =
          messages.find(message => message.channelId == channel.channelId)?.body || '';
      });
      
      // Convert string values to numbers and submit
      saveExchangeRate.mutate({
        rubToVnd: parseFloat(data.rubToVnd) / 10000,
        vndToRub: parseFloat(data.vndToRub) / 1000,
        usdtToVnd: parseFloat(data.usdtToVnd),
        vndToUsdt: parseFloat(data.vndToUsdt),
        usdtToRub: parseFloat(data.usdtToRub),
        rubToUsdt: parseFloat(data.rubToUsdt),
        broadcastTo: data.broadcastTo,
      });
    } catch (error) {
      console.error('Error saving exchange rates:', error);
      setFormStatus({
        type: 'error',
        message: 'Failed to update exchange rates. Please try again.',
      });
    }
  }

  return (
    <>
      <div className="w-full max-w-4xl space-y-6">
        <CardContent>
          {formStatus.type && (
            <Alert
              variant={formStatus.type === 'success' ? 'default' : 'destructive'}
              className="mb-10"
            >
              {formStatus.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{formStatus.message}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form
              id="exchangeRatesForm"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 flex flex-col"
            >
              {isSubmitting ? (
                <>
                  <h2 className="text-2xl font-semibold mb-6 text-center">
                    Check the messages that will be sent to telegram channels!
                  </h2>

                  <div className="flex flex-col gap-5">
                    <SimpleEditor
                      className=""
                      value={
                        messages.find(message => message.channelId === selectedChannelId)?.body ||
                        ''
                      }
                      onChange={onEditMessage}
                    />

                    <FormField
                      control={form.control}
                      name="broadcastTo"
                      render={({ field }) => (
                        <FormItem className="flex flex-col items-center justify-between rounded-lg border p-3 shadow-sm w-full">
                          {telegramChannelsData?.channels.map(
                            (channel: {
                              id: string;
                              chatUsername: string;
                              chatTitle: string;
                              messageTemplate: { id: string; body: string; title: string } | null;
                            }) => {
                              const isChecked =
                                field.value?.find(
                                  (targetChannel: { channelId: string }) =>
                                    targetChannel.channelId === channel.id
                                ) !== undefined;
                              return (
                                <div
                                  className={`${selectedChannelId == channel.id ? `ring-2 ring-primary/50` : ``} w-full rounded-md`}
                                  key={channel.id}
                                >
                                  <div
                                    className="w-full flex justify-between flex-row bg-muted/40 p-4 rounded-md transition-all cursor-pointer hover:bg-accent/50 ${isChecked ? 'border-primary bg-primary/5' : 'border-border'}"
                                    onClick={() => {
                                      setSelectedChannelId(channel.id);
                                    }}
                                  >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <Checkbox
                                        className="mt-0.5 cursor-pointer"
                                        id={channel.id}
                                        checked={isChecked}
                                        onCheckedChange={(checked: boolean) => {
                                          if (checked) {
                                            field.onChange([
                                              ...field.value,
                                              {
                                                channelId: channel.id,
                                                body:
                                                  messages.find(
                                                    message => message.channelId == channel.id
                                                  )?.body || '',
                                              },
                                            ]);
                                          } else {
                                            field.onChange(
                                              field.value.filter(
                                                (targetChannel: { channelId: string }) =>
                                                  targetChannel.channelId !== channel.id
                                              )
                                            );
                                          }
                                        }}
                                      />

                                      <h3 className="text-md font-medium flex items-center">
                                        {channel.chatTitle ? channel.chatTitle : 'Null'}
                                      </h3>
                                    </div>
                                    {selectedChannelId == channel.id && (
                                      <div className="ml-2">
                                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </FormItem>
                      )}
                    />

                    <Button variant="default" disabled={saveExchangeRate.isPending}>
                      {saveExchangeRate.isPending ? 'Saving...' : `Save Exchange Rates`}
                    </Button>

                    <Button
                      variant="destructive"
                      disabled={saveExchangeRate.isPending}
                      onClick={onCancel}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-muted/40 p-4 rounded-md">
                    <h3 className="text-md font-medium mb-3 flex items-center">
                      <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs mr-2">
                        RUB ↔ VND
                      </span>
                      Russian Ruble to Vietnamese Dong
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="rubToVnd"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <span className="font-semibold">10K RUB</span> ={' '}
                              <span className="text-muted-foreground">X VND</span>
                            </FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="vndToRub"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <span className="font-semibold">1M VND</span> ={' '}
                              <span className="text-muted-foreground">X RUB</span>
                            </FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="bg-muted/40 p-4 rounded-md">
                    <h3 className="text-md font-medium mb-3 flex items-center">
                      <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs mr-2">
                        USDT ↔ VND
                      </span>
                      Tether to Vietnamese Dong
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="usdtToVnd"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <span className="font-semibold">1 USDT</span> ={' '}
                              <span className="text-muted-foreground">X VND</span>
                            </FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="vndToUsdt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <span className="font-semibold">X VND</span> ={' '}
                              <span className="text-muted-foreground">1 USDT</span>
                            </FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="bg-muted/40 p-4 rounded-md">
                    <h3 className="text-md font-medium mb-3 flex items-center">
                      <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs mr-2">
                        USDT ↔ RUB
                      </span>
                      Tether to Russian Ruble
                    </h3>

                    {/* Exchange Rate field */}
                    <div className="mb-4">
                      <FormField
                        control={form.control}
                        name="exchangeRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1 font-medium text-primary">
                              <span className="font-semibold">Market Rate</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter market rate"
                                {...field}
                                className="border-primary/50"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="usdtToRub"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <span className="font-semibold">1 USDT</span> ={' '}
                              <span className="text-muted-foreground">X RUB</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder=""
                                {...field}
                                readOnly={!!exchangeRate}
                                className={exchangeRate ? 'bg-muted cursor-not-allowed' : ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="rubToUsdt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <span className="font-semibold">X RUB</span> ={' '}
                              <span className="text-muted-foreground">1 USDT</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder=""
                                {...field}
                                readOnly={!!exchangeRate}
                                className={exchangeRate ? 'bg-muted cursor-not-allowed' : ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {exchangeRate && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Rates are automatically calculated as Exchange Rate × 0.97 (for USDT to RUB)
                        and Exchange Rate × 1.03 (for RUB to USDT) with 0.1 rounding in our favor.
                      </p>
                    )}
                  </div>

                  <Button
                    variant="default"
                    disabled={saveExchangeRate.isPending}
                    onClick={onConfirm}
                  >
                    {saveExchangeRate.isPending ? 'Saving...' : `Save Exchange Rates`}
                  </Button>
                </>
              )}
            </form>
          </Form>
        </CardContent>
      </div>
    </>
  );
}
