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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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

export function ExchangeRatesForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ExchangeRatesFormValues>({
    resolver: zodResolver(ExchangeRatesSchema),
    defaultValues: {
      rubToVnd: '',
      vndToRub: '',
      usdtToVnd: '',
      vndToUsdt: '',
      usdtToRub: '',
      rubToUsdt: '',
    },
  });

  async function onSubmit(data: ExchangeRatesFormValues) {
    try {
      setIsSubmitting(true);

      // Convert string values to numbers and create data object with timestamp
      const ratesData = {
        rubToVnd: parseFloat(data.rubToVnd),
        vndToRub: parseFloat(data.vndToRub),
        usdtToVnd: parseFloat(data.usdtToVnd),
        vndToUsdt: parseFloat(data.vndToUsdt),
        usdtToRub: parseFloat(data.usdtToRub),
        rubToUsdt: parseFloat(data.rubToUsdt),
        timestamp: new Date().toISOString(),
      };

      // In a real application, you would send this data to your backend
      // For now, we'll just simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Saving exchange rates:', ratesData);

      // Display success message
    } catch (error) {
      console.error('Error saving exchange rates:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Set Currency Exchange Rates</CardTitle>
        <CardDescription>Configure exchange rates between USDT, RUB, and VND</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h3 className="text-md font-medium mb-2">RUB ↔ VND</h3>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="rubToVnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>For 1 RUB we give X VND</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 290" {...field} />
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
                      <FormLabel>For 1000 VND we give X RUB</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-md font-medium mb-2">USDT ↔ VND</h3>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="usdtToVnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>For 1 USDT we give X VND</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 25100" {...field} />
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
                      <FormLabel>For X VND we give 1 USDT</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 26300" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-md font-medium mb-2">USDT ↔ RUB</h3>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="usdtToRub"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>For 1 USDT we give X RUB</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 90" {...field} />
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
                      <FormLabel>For X RUB we give 1 USDT</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 95" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Exchange Rates'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
