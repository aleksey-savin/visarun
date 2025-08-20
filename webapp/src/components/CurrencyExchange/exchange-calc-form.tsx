import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';

const formatCurrency = (amount: number, currency?: string) => {
  try {
    // Try to format with the provided currency
    if (currency) {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    }
  } catch {
    // If currency is invalid, fall back to number formatting with currency symbol
    console.warn(`Invalid currency code: ${currency}`);
  }

  // Fallback: format as number with currency name or default
  const currencySymbol = currency || 'VND';
  return (
    new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount) + ` ${currencySymbol}`
  );
};

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

const FormSchema = z.object({
  clientRubles: z.string().optional(),
  clientDongs: z.string().optional(),
  clientUsdt: z.string().optional(),
  ourRubles: z.string().optional(),
  ourDongs: z.string().optional(),
  ourUsdt: z.string().optional(),
});

// Define the form field names type for type safety
type FormField = keyof z.infer<typeof FormSchema>;

interface ExchangeCalcFormProps {
  isClient: boolean;
  rates: {
    rubToVnd: number;
    vndToRub: number;
    usdtToVnd: number;
    vndToUsdt: number;
    usdtToRub: number;
    rubToUsdt: number;
  };
}

export function CurrencyExchangeForm({ isClient, rates }: ExchangeCalcFormProps) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      clientRubles: '',
      clientDongs: '',
      clientUsdt: '',
      ourRubles: '',
      ourDongs: '',
      ourUsdt: '',
    },
  });

  const [direction, setDirection] = useState<'clientToUs' | 'usToClient'>('clientToUs');

  // Reset all form fields
  const resetForm = () => {
    form.reset();
  };

  const formatNumber = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) return '0';
    return value.toLocaleString('ru-RU', { maximumFractionDigits: 4 });
  };

  // Copy exchange offer to clipboard
  const copyExchangeOffer = async (
    fromCurrency: string,
    fromAmount: string,
    toCurrency: string,
    toAmount: string
  ) => {
    const offerText = `Обмен: за ваши ${formatCurrency(parseFloat(fromAmount.replace(/\s+/g, '').replace(/,/g, '.')), fromCurrency)} с нас будет ${formatCurrency(parseFloat(toAmount.replace(/\s+/g, '').replace(/,/g, '.')), toCurrency)}.`;
    try {
      await navigator.clipboard.writeText(offerText);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Handle client input changes
  const handleClientInputChange = (field: FormField, value: string) => {
    // Update the input field
    form.setValue(field, value);

    // Reset other client fields
    if (field !== 'clientRubles') form.setValue('clientRubles', '');
    if (field !== 'clientDongs') form.setValue('clientDongs', '');
    if (field !== 'clientUsdt') form.setValue('clientUsdt', '');

    // Reset all our fields
    form.setValue('ourRubles', '');
    form.setValue('ourDongs', '');
    form.setValue('ourUsdt', '');

    // If value is empty, don't calculate
    if (!value) return;

    setDirection('clientToUs');
    const numValue = parseFloat(value);

    // Calculate what we transfer to client
    if (field === 'clientRubles') {
      const bonusVnd = numValue >= 100000 ? 2 : 0;
      const bonusUsdt = numValue >= 100000 ? 0 : 0;

      form.setValue(
        'ourDongs',
        formatNumber(Math.floor((numValue * (rates.rubToVnd + bonusVnd)) / 10000) * 10000)
      );
      form.setValue(
        'ourUsdt',
        formatNumber(Math.floor(numValue / (rates.rubToUsdt + bonusUsdt) / 0.5) * 0.5)
      );
    } else if (field === 'clientDongs') {
      const bonusRub = numValue >= 25000000 ? 0.035 : 0;
      const bonusUsdt = numValue >= 25000000 ? 200 : 0;
      form.setValue(
        'ourRubles',
        formatNumber(Math.floor((numValue * (rates.vndToRub + bonusRub)) / 1000 / 50) * 50)
      );
      form.setValue(
        'ourUsdt',
        formatNumber(Math.floor(numValue / (rates.vndToUsdt - bonusUsdt) / 0.5) * 0.5)
      );
    } else if (field === 'clientUsdt') {
      const bonusRub = numValue >= 1000 ? 0.8 : 0;
      const bonusVnd = numValue >= 1000 ? 200 : 0;
      form.setValue(
        'ourRubles',
        formatNumber(Math.floor((numValue * (rates.usdtToRub + bonusRub)) / 50) * 50)
      );
      form.setValue(
        'ourDongs',
        formatNumber(Math.floor((numValue * (rates.usdtToVnd + bonusVnd)) / 10000) * 10000)
      );
    }
  };

  // Handle our input changes
  const handleOurInputChange = (field: FormField, value: string) => {
    // Update the input field
    form.setValue(field, value);

    // Reset other our fields
    if (field !== 'ourRubles') form.setValue('ourRubles', '');
    if (field !== 'ourDongs') form.setValue('ourDongs', '');
    if (field !== 'ourUsdt') form.setValue('ourUsdt', '');

    // Reset all client fields
    form.setValue('clientRubles', '');
    form.setValue('clientDongs', '');
    form.setValue('clientUsdt', '');

    // If value is empty, don't calculate
    if (!value) return;

    setDirection('usToClient');
    const numValue = parseFloat(value);

    const formatNumber = (value: number): string => {
      if (isNaN(value) || !isFinite(value)) return '0';
      return value.toLocaleString('ru-RU', { maximumFractionDigits: 4 });
    };

    // Calculate what client transfers to us
    if (field === 'ourRubles') {
      const bonusVnd = numValue >= 75850 ? 0.035 : 0;
      const bonusUsdt = numValue >= 83100 ? 0.825 : 0;

      form.setValue(
        'clientDongs',
        formatNumber(Math.ceil(((numValue / (rates.vndToRub + bonusVnd)) * 1000) / 10000) * 10000)
      );
      form.setValue(
        'clientUsdt',
        formatNumber(Math.ceil(numValue / (rates.usdtToRub + bonusUsdt) / 0.5) * 0.5)
      );
    } else if (field === 'ourDongs') {
      const bonusRub = numValue >= 30200000 ? 2 : 0;
      const bonusUsdt = numValue >= 25800000 ? 200 : 0;

      form.setValue(
        'clientRubles',
        formatNumber(Math.ceil(numValue / (rates.rubToVnd + bonusRub) / 50) * 50)
      );
      form.setValue(
        'clientUsdt',
        formatNumber(Math.ceil(numValue / (rates.usdtToVnd + bonusUsdt) / 0.5) * 0.5)
      );
    } else if (field === 'ourUsdt') {
      const bonusVndt = numValue >= 939.5 ? 198 : 0;
      form.setValue(
        'clientRubles',
        formatNumber(Math.ceil((numValue * (rates.rubToUsdt + 0)) / 50) * 50)
      );
      form.setValue(
        'clientDongs',
        formatNumber(Math.ceil((numValue * (rates.vndToUsdt - bonusVndt)) / 10000) * 10000)
      );
    }
  };

  return (
    <Form {...form}>
      <div className="w-full max-w-4xl md:space-y-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8 gap-3">
          {/* Left column - Client transfers to us */}
          <Card className={cn('', direction === 'clientToUs' ? 'ring-2 ring-primary/50' : '')}>
            <CardContent className="flex flex-col md:gap-6 gap-3">
              <CardTitle className="text-lg font-medium flex items-center">
                {isClient ? 'You transfer to us:' : 'Client transfers to us:'}
              </CardTitle>
              <FormField
                control={form.control}
                name="clientRubles"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="0"
                          value={field.value}
                          onChange={e => handleClientInputChange('clientRubles', e.target.value)}
                          className={cn(
                            direction === 'clientToUs' && field.value ? 'border-primary' : '',
                            direction === 'usToClient' ? 'pr-10' : ''
                          )}
                        />
                        {direction === 'usToClient' && field.value && (
                          <button
                            type="button"
                            onClick={async () => {
                              const ourDongsValue = form.getValues('ourDongs');
                              const ourUsdtValue = form.getValues('ourUsdt');
                              if (ourDongsValue)
                                await copyExchangeOffer(
                                  'RUB',
                                  field.value || '',
                                  'VND',
                                  ourDongsValue
                                );
                              else if (ourUsdtValue)
                                await copyExchangeOffer(
                                  'RUB',
                                  field.value || '',
                                  'USDT',
                                  ourUsdtValue
                                );
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded active:scale-110 transition-all duration-150"
                          >
                            <Copy size={14} className="text-gray-500" />
                          </button>
                        )}
                      </div>
                    </FormControl>
                    <FormLabel className="min-w-[50px] text-right font-medium">RUB</FormLabel>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientDongs"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="0"
                          value={field.value}
                          onChange={e => handleClientInputChange('clientDongs', e.target.value)}
                          className={cn(
                            direction === 'clientToUs' && field.value ? 'border-primary' : '',
                            direction === 'usToClient' ? 'pr-10' : ''
                          )}
                        />
                        {direction === 'usToClient' && field.value && (
                          <button
                            type="button"
                            onClick={async () => {
                              const ourRublesValue = form.getValues('ourRubles');
                              const ourUsdtValue = form.getValues('ourUsdt');
                              if (ourRublesValue)
                                await copyExchangeOffer(
                                  'VND',
                                  field.value || '',
                                  'RUB',
                                  ourRublesValue
                                );
                              else if (ourUsdtValue)
                                await copyExchangeOffer(
                                  'VND',
                                  field.value || '',
                                  'USDT',
                                  ourUsdtValue
                                );
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded  active:scale-110 transition-all duration-150"
                          >
                            <Copy size={14} className="text-gray-500" />
                          </button>
                        )}
                      </div>
                    </FormControl>
                    <FormLabel className="min-w-[50px] text-right font-medium">VND</FormLabel>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientUsdt"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="0"
                          value={field.value}
                          onChange={e => handleClientInputChange('clientUsdt', e.target.value)}
                          className={cn(
                            direction === 'clientToUs' && field.value ? 'border-primary' : '',
                            direction === 'usToClient' ? 'pr-10' : ''
                          )}
                        />
                        {direction === 'usToClient' && field.value && (
                          <button
                            type="button"
                            onClick={async () => {
                              const ourRublesValue = form.getValues('ourRubles');
                              const ourDongsValue = form.getValues('ourDongs');
                              if (ourRublesValue)
                                await copyExchangeOffer(
                                  'USDT',
                                  field.value || '',
                                  'RUB',
                                  ourRublesValue
                                );
                              else if (ourDongsValue)
                                await copyExchangeOffer(
                                  'USDT',
                                  field.value || '',
                                  'VND',
                                  ourDongsValue
                                );
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded  active:scale-110 transition-all duration-150"
                          >
                            <Copy size={14} className="text-gray-500" />
                          </button>
                        )}
                      </div>
                    </FormControl>
                    <FormLabel className="min-w-[50px] text-right font-medium">USDT</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Right column - We transfer to client */}
          <Card className={direction === 'usToClient' ? 'ring-2 ring-primary/50' : ''}>
            <CardContent className="flex flex-col md:gap-6 gap-3">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                {isClient ? 'We transfer to you:' : 'We transfer to user:'}
              </CardTitle>
              <FormField
                control={form.control}
                name="ourRubles"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="0"
                          value={field.value}
                          onChange={e => handleOurInputChange('ourRubles', e.target.value)}
                          className={cn(
                            direction === 'usToClient' && field.value ? 'border-primary' : '',
                            direction === 'clientToUs' ? 'pr-10' : ''
                          )}
                        />
                        {direction === 'clientToUs' && field.value && (
                          <button
                            type="button"
                            onClick={async () => {
                              const clientRublesValue = form.getValues('clientRubles');
                              const clientDongsValue = form.getValues('clientDongs');
                              const clientUsdtValue = form.getValues('clientUsdt');
                              if (clientRublesValue)
                                await copyExchangeOffer(
                                  'RUB',
                                  clientRublesValue,
                                  'RUB',
                                  field.value || ''
                                );
                              else if (clientDongsValue)
                                await copyExchangeOffer(
                                  'VND',
                                  clientDongsValue,
                                  'RUB',
                                  field.value || ''
                                );
                              else if (clientUsdtValue)
                                await copyExchangeOffer(
                                  'USDT',
                                  clientUsdtValue,
                                  'RUB',
                                  field.value || ''
                                );
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded  active:scale-110 transition-all duration-150"
                          >
                            <Copy size={14} className="text-gray-500" />
                          </button>
                        )}
                      </div>
                    </FormControl>
                    <FormLabel className="min-w-[50px] text-right font-medium">RUB</FormLabel>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ourDongs"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="0"
                          value={field.value}
                          onChange={e => handleOurInputChange('ourDongs', e.target.value)}
                          className={cn(
                            direction === 'usToClient' && field.value ? 'border-primary' : '',
                            direction === 'clientToUs' ? 'pr-10' : ''
                          )}
                        />
                        {direction === 'clientToUs' && field.value && (
                          <button
                            type="button"
                            onClick={async () => {
                              const clientRublesValue = form.getValues('clientRubles');
                              const clientDongsValue = form.getValues('clientDongs');
                              const clientUsdtValue = form.getValues('clientUsdt');
                              if (clientRublesValue)
                                await copyExchangeOffer(
                                  'RUB',
                                  clientRublesValue,
                                  'VND',
                                  field.value || ''
                                );
                              else if (clientDongsValue)
                                await copyExchangeOffer(
                                  'VND',
                                  clientDongsValue,
                                  'VND',
                                  field.value || ''
                                );
                              else if (clientUsdtValue)
                                await copyExchangeOffer(
                                  'USDT',
                                  clientUsdtValue,
                                  'VND',
                                  field.value || ''
                                );
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded  active:scale-110 transition-all duration-150"
                          >
                            <Copy size={14} className="text-gray-500" />
                          </button>
                        )}
                      </div>
                    </FormControl>
                    <FormLabel className="min-w-[50px] text-right font-medium">VND</FormLabel>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ourUsdt"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="0"
                          value={field.value}
                          onChange={e => handleOurInputChange('ourUsdt', e.target.value)}
                          className={cn(
                            direction === 'usToClient' && field.value ? 'border-primary' : '',
                            direction === 'clientToUs' ? 'pr-10' : ''
                          )}
                        />
                        {direction === 'clientToUs' && field.value && (
                          <button
                            type="button"
                            onClick={async () => {
                              const clientRublesValue = form.getValues('clientRubles');
                              const clientDongsValue = form.getValues('clientDongs');
                              const clientUsdtValue = form.getValues('clientUsdt');
                              if (clientRublesValue)
                                await copyExchangeOffer(
                                  'RUB',
                                  clientRublesValue,
                                  'USDT',
                                  field.value || ''
                                );
                              else if (clientDongsValue)
                                await copyExchangeOffer(
                                  'VND',
                                  clientDongsValue,
                                  'USDT',
                                  field.value || ''
                                );
                              else if (clientUsdtValue)
                                await copyExchangeOffer(
                                  'USDT',
                                  clientUsdtValue,
                                  'USDT',
                                  field.value || ''
                                );
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded  active:scale-110 transition-all duration-150"
                          >
                            <Copy size={14} className="text-gray-500" />
                          </button>
                        )}
                      </div>
                    </FormControl>
                    <FormLabel className="min-w-[50px] text-right font-medium">USDT</FormLabel>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>
        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={resetForm}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Reset
          </Button>
        </div>
      </div>
    </Form>
  );
}
