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

import { Client } from '@/types/Client.js';
import CitizenshipSelect from '../../../Citizenship/CitizenshipSelect';

const formSchema = z.object({
  lastName: z.string(),
  firstName: z.string(),
  citizenshipId: z.string(),
  passportExpirationDate: z.date().min(new Date(), {
    message: 'Passport expiration date must be not less than 6 months from now.',
  }),
});

const ClientData = ({ client }: { client: Client }) => {
  const { setSaveStatus, clients, setClients } = useOrderStore();

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lastName: client?.lastName || '',
      firstName: client?.firstName || '',
      citizenshipId: client?.citizenshipId || '',
      passportExpirationDate: client?.passportExpirationDate
        ? new Date(client.passportExpirationDate)
        : undefined,
    },
  });

  const editClientMutation = trpc.client.edit.useMutation();

  const handleCitizenshipUpdate = async (citizenshipId: string) => {
    setSaveStatus('saving');

    const { client: updatedClient } = await editClientMutation.mutateAsync({
      id: client.id,
      citizenshipId,
    });

    setClients(
      clients.map(c =>
        c.id === client.id
          ? {
              ...c,
              citizenshipId,
              citizenship: updatedClient.citizenship,
            }
          : c
      )
    );

    form.setValue('citizenshipId', citizenshipId);

    setSaveStatus('saved');
  };

  const handlePassportDateUpdate = async (date: Date) => {
    setSaveStatus('saving');

    const dateString = date.toISOString();

    setClients(
      clients.map(c => (c.id === client.id ? { ...c, passportExpirationDate: dateString } : c))
    );

    form.setValue('passportExpirationDate', date);

    setIsCalendarOpen(false);

    try {
      await editClientMutation.mutateAsync({
        id: client.id,
        passportExpirationDate: dateString,
      });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  return (
    <div className="flex gap-4">
      <Form {...form}>
        <FormField
          control={form.control}
          name="citizenshipId"
          render={({ field }) => (
            <CitizenshipSelect
              value={field.value}
              onValueChange={handleCitizenshipUpdate}
              currentCitizenship={client.citizenshipId || undefined}
            />
          )}
        />
        <FormField
          control={form.control}
          name="passportExpirationDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Passport expiration date</FormLabel>
              <FormControl>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="secondary"
                      className={cn(
                        'min-w-52 w-full justify-start text-left font-normal bg-[#171717] border-[#3F3F46] hover:bg-[#171717] hover:border-ring focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={date => {
                        if (date) {
                          handlePassportDateUpdate(date);
                        }
                      }}
                      disabled={date => date < new Date() || date < new Date('1900-01-01')}
                      captionLayout="dropdown"
                      startMonth={new Date()}
                      endMonth={new Date(2100, 11)}
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

export default ClientData;
