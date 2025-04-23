import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';

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
      rubToVnd: initialValues ? initialValues.rubToVnd.toString() : '',
      vndToRub: initialValues ? (initialValues.vndToRub * 1000).toString() : '',
      usdtToVnd: initialValues ? initialValues.usdtToVnd.toString() : '',
      vndToUsdt: initialValues ? (initialValues.vndToUsdt * 1000).toString() : '',
      usdtToRub: initialValues ? initialValues.usdtToRub.toString() : '',
      rubToUsdt: initialValues ? (initialValues.rubToUsdt * 1000).toString() : '',
    },
  });

  async function onSubmit(data: ExchangeRatesFormValues) {
    try {
      setFormStatus({ type: null, message: '' });

      // Convert string values to numbers and submit
      saveExchangeRate.mutate({
        rubToVnd: parseFloat(data.rubToVnd),
        vndToRub: parseFloat(data.vndToRub) / 1000,
        usdtToVnd: parseFloat(data.usdtToVnd),
        vndToUsdt: parseFloat(data.vndToUsdt) / 1000,
        usdtToRub: parseFloat(data.usdtToRub),
        rubToUsdt: parseFloat(data.rubToUsdt) / 1000,
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
                          <span className="font-semibold">1 RUB</span> ={' '}
                          <span className="text-muted-foreground">X VND</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="" {...field} />
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
                          <span className="font-semibold">1 000 VND</span> ={' '}
                          <span className="text-muted-foreground">X RUB</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="" {...field} />
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
                          <Input placeholder="" {...field} />
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
                          <span className="font-semibold">1 000 VND</span> ={' '}
                          <span className="text-muted-foreground">X USDT</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="" {...field} />
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
                          <Input placeholder="" {...field} />
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
                          <span className="font-semibold">1 000 RUB</span> ={' '}
                          <span className="text-muted-foreground">X USDT</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
