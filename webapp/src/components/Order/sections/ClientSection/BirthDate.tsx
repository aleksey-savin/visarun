import { useState } from 'react';
import { trpc } from '@/lib/trpc';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import useOrderStore from '@/stores/order/order-store.js';

import { StoreClient } from '@/stores/order/order-store';

const formSchema = z.object({
  birthDate: z.date(),
});

const BirthDate = ({ client }: { client: StoreClient }) => {
  const { setSaveStatus, clients, setClients, orderItems } = useOrderStore();

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      birthDate: client?.birthDate
        ? client.birthDate instanceof Date
          ? client.birthDate
          : new Date(client.birthDate)
        : undefined,
    },
  });

  const editClientMutation = trpc.clientData.edit.useMutation();

  const handleBirthDateUpdate = async (date: Date) => {
    setSaveStatus('saving');

    setClients(clients.map(c => (c.id === client.id ? { ...c, birthDate: date } : c)));

    form.setValue('birthDate', date);

    setIsCalendarOpen(false);

    try {
      await editClientMutation.mutateAsync({
        id: client.id,
        passportExpirationDate: client.passportExpirationDate
          ? client.passportExpirationDate instanceof Date
            ? client.passportExpirationDate.toISOString()
            : client.passportExpirationDate
          : null,
        birthDate: date.toISOString(),
      });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  const isRequired = orderItems.filter(item => item.serviceType === 'acceleration').length > 0;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Form {...form}>
        <FormField
          control={form.control}
          name="birthDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Birth date
                {isRequired ? <span className="text-red-500">*</span> : ''}
              </FormLabel>
              <FormControl>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="secondary"
                        className={cn(
                          'min-w-52 justify-between',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? format(field.value, 'PPP') : <span>Select date</span>}
                        <CalendarIcon />
                      </Button>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={date => {
                        if (date) {
                          handleBirthDateUpdate(date);
                        }
                      }}
                      captionLayout="dropdown"
                      endMonth={new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </div>
  );
};

export default BirthDate;
