import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const FormSchema = z.object({
  clientRubles: z.string().optional(),
  clientDongs: z.string().optional(),
  clientUsdt: z.string().optional(),
  ourRubles: z.string().optional(),
  ourDongs: z.string().optional(),
  ourUsdt: z.string().optional(),
});

export function CurrencyExchangeForm() {
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

  return (
    <Form {...form}>
      <div className="w-full max-w-4xl space-y-8">
        <div className="grid grid-cols-2 gap-12">
          {/* Left column - Client transfers to us */}
          <div>
            <h3 className="text-xl font-medium mb-6">Client transfers to us:</h3>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="clientRubles"
                render={({ field }) => (
                  <FormItem className="flex items-center">
                    <FormControl>
                      <Input placeholder="" {...field} />
                    </FormControl>
                    <FormLabel className="ml-2 font-normal">RUB</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientDongs"
                render={({ field }) => (
                  <FormItem className="flex items-center">
                    <FormControl>
                      <Input placeholder="" {...field} />
                    </FormControl>
                    <FormLabel className="ml-2 font-normal">VND</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientUsdt"
                render={({ field }) => (
                  <FormItem className="flex items-center">
                    <FormControl>
                      <Input placeholder="" {...field} />
                    </FormControl>
                    <FormLabel className="ml-2 font-normal">USDT</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Right column - We transfer to client */}
          <div>
            <h3 className="text-xl font-medium mb-6">We transfer to client:</h3>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="ourRubles"
                render={({ field }) => (
                  <FormItem className="flex items-center">
                    <FormControl>
                      <Input placeholder="" {...field} />
                    </FormControl>
                    <FormLabel className="ml-2 font-normal">RUB</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ourDongs"
                render={({ field }) => (
                  <FormItem className="flex items-center">
                    <FormControl>
                      <Input placeholder="" {...field} />
                    </FormControl>
                    <FormLabel className="ml-2 font-normal">VND</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ourUsdt"
                render={({ field }) => (
                  <FormItem className="flex items-center">
                    <FormControl>
                      <Input placeholder="" {...field} />
                    </FormControl>
                    <FormLabel className="ml-2 font-normal">USDT</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </Form>
  );
}
