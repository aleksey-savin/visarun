import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpcProvider';

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
    },
  });

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

  async function onSubmit(data: ExchangeRatesFormValues) {
    try {
      setFormStatus({ type: null, message: '' });

      // Convert string values to numbers and submit
      saveExchangeRate.mutate({
        rubToVnd: parseFloat(data.rubToVnd) / 10000,
        vndToRub: parseFloat(data.vndToRub) / 1000,
        usdtToVnd: parseFloat(data.usdtToVnd),
        vndToUsdt: parseFloat(data.vndToUsdt),
        usdtToRub: parseFloat(data.usdtToRub),
        rubToUsdt: parseFloat(data.rubToUsdt),
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
      <Card className="w-full max-w-2xl mx-auto border-none shadow-none">
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    Rates are automatically calculated as Exchange Rate × 0.97 (for USDT to RUB) and
                    Exchange Rate × 1.03 (for RUB to USDT) with 0.1 rounding in our favor.
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={saveExchangeRate.isPending}>
                {saveExchangeRate.isPending ? 'Saving...' : 'Save Exchange Rates'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
