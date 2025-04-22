import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

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
  rates: {
    rubToVnd: number;
    vndToRub: number;
    usdtToVnd: number;
    vndToUsdt: number;
    usdtToRub: number;
    rubToUsdt: number;
  };
}

export function CurrencyExchangeForm({ rates }: ExchangeCalcFormProps) {
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

  // Function to format numbers for display
  const formatNumber = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) return '0';
    return value.toLocaleString('ru-RU', { maximumFractionDigits: 4 });
  };

  // Reset all form fields
  const resetForm = () => {
    form.reset();
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
      form.setValue('ourDongs', formatNumber(numValue * rates.rubToVnd));
      form.setValue('ourUsdt', formatNumber(numValue * rates.rubToUsdt));
    } else if (field === 'clientDongs') {
      form.setValue('ourRubles', formatNumber(numValue * rates.vndToRub));
      form.setValue('ourUsdt', formatNumber(numValue * rates.vndToUsdt));
    } else if (field === 'clientUsdt') {
      form.setValue('ourRubles', formatNumber(numValue * rates.usdtToRub));
      form.setValue('ourDongs', formatNumber(numValue * rates.usdtToVnd));
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

    // Calculate what client transfers to us
    if (field === 'ourRubles') {
      form.setValue('clientDongs', formatNumber(numValue / rates.vndToRub));
      form.setValue('clientUsdt', formatNumber(numValue / rates.usdtToRub));
    } else if (field === 'ourDongs') {
      form.setValue('clientRubles', formatNumber(numValue / rates.rubToVnd));
      form.setValue('clientUsdt', formatNumber(numValue / rates.usdtToVnd));
    } else if (field === 'ourUsdt') {
      form.setValue('clientRubles', formatNumber(numValue / rates.rubToUsdt));
      form.setValue('clientDongs', formatNumber(numValue / rates.vndToUsdt));
    }
  };

  return (
    <Form {...form}>
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={resetForm}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Reset
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column - Client transfers to us */}
          <Card className={direction === 'clientToUs' ? 'ring-2 ring-primary/50' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                Client transfers to us:
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="clientRubles"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Input
                        placeholder="0"
                        value={field.value}
                        onChange={e => handleClientInputChange('clientRubles', e.target.value)}
                        className={
                          direction === 'clientToUs' && field.value ? 'border-primary' : ''
                        }
                      />
                    </FormControl>
                    <FormLabel className="min-w-[50px] text-right font-medium">RUB</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="clientDongs"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Input
                        placeholder="0"
                        value={field.value}
                        onChange={e => handleClientInputChange('clientDongs', e.target.value)}
                        className={
                          direction === 'clientToUs' && field.value ? 'border-primary' : ''
                        }
                      />
                    </FormControl>
                    <FormLabel className="min-w-[50px] text-right font-medium">VND</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="clientUsdt"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Input
                        placeholder="0"
                        value={field.value}
                        onChange={e => handleClientInputChange('clientUsdt', e.target.value)}
                        className={
                          direction === 'clientToUs' && field.value ? 'border-primary' : ''
                        }
                      />
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
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                We transfer to client:
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="ourRubles"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Input
                        placeholder="0"
                        value={field.value}
                        onChange={e => handleOurInputChange('ourRubles', e.target.value)}
                        className={
                          direction === 'usToClient' && field.value ? 'border-primary' : ''
                        }
                      />
                    </FormControl>
                    <FormLabel className="min-w-[50px] text-right font-medium">RUB</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="ourDongs"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Input
                        placeholder="0"
                        value={field.value}
                        onChange={e => handleOurInputChange('ourDongs', e.target.value)}
                        className={
                          direction === 'usToClient' && field.value ? 'border-primary' : ''
                        }
                      />
                    </FormControl>
                    <FormLabel className="min-w-[50px] text-right font-medium">VND</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="ourUsdt"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Input
                        placeholder="0"
                        value={field.value}
                        onChange={e => handleOurInputChange('ourUsdt', e.target.value)}
                        className={
                          direction === 'usToClient' && field.value ? 'border-primary' : ''
                        }
                      />
                    </FormControl>
                    <FormLabel className="min-w-[50px] text-right font-medium">USDT</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 bg-muted p-4 rounded-md">
          <h3 className="font-medium mb-2">Current Exchange Rates:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p>1 RUB = {formatNumber(rates.rubToVnd)} VND</p>
              <p>1 RUB = {formatNumber(rates.rubToUsdt)} USDT</p>
            </div>
            <div>
              <p>1 VND = {formatNumber(rates.vndToRub)} RUB</p>
              <p>1 VND = {formatNumber(rates.vndToUsdt)} USDT</p>
            </div>
            <div>
              <p>1 USDT = {formatNumber(rates.usdtToRub)} RUB</p>
              <p>1 USDT = {formatNumber(rates.usdtToVnd)} VND</p>
            </div>
          </div>
        </div>
      </div>
    </Form>
  );
}
