import { useState } from 'react';
import { trpc } from '@/lib/trpc';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { isPassportExpiringWithin6Months } from '@/utils/passportExpirationDate';

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
import CitizenshipSelect from '../../../Citizenship/CitizenshipSelect';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  lastName: z.string(),
  firstName: z.string(),
  citizenshipId: z.string(),
  passportExpirationDate: z.date().min(new Date(), {
    message: 'Passport expiration date must be not less than 6 months from now.',
  }),
});

const ClientData = ({ client }: { client: StoreClient }) => {
  const { setSaveStatus, clients, setClients } = useOrderStore();

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lastName: client?.lastName || '',
      firstName: client?.firstName || '',
      citizenshipId: client?.citizenship?.id || '',
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
      passportExpirationDate: client.passportExpirationDate?.toISOString() || null,
    });

    setClients(
      clients.map(c =>
        c.id === client.id
          ? {
              ...c,
              citizenshipId,
              citizenship: updatedClient.citizenship
                ? {
                    ...updatedClient.citizenship,
                  }
                : undefined,
            }
          : c
      )
    );

    form.setValue('citizenshipId', citizenshipId);

    setSaveStatus('saved');
  };

  const handlePassportDateUpdate = async (date: Date) => {
    setSaveStatus('saving');

    setClients(clients.map(c => (c.id === client.id ? { ...c, passportExpirationDate: date } : c)));

    form.setValue('passportExpirationDate', date);

    setIsCalendarOpen(false);

    try {
      await editClientMutation.mutateAsync({
        id: client.id,
        passportExpirationDate: date.toISOString(),
      });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  const passportExpires = client.passportExpirationDate
    ? isPassportExpiringWithin6Months(
        client.passportExpirationDate instanceof Date
          ? client.passportExpirationDate.toISOString()
          : client.passportExpirationDate
      )
    : false;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Form {...form}>
        <FormField
          control={form.control}
          name="citizenshipId"
          render={({ field }) => (
            <CitizenshipSelect
              value={field.value}
              onValueChange={handleCitizenshipUpdate}
              currentCitizenship={client.citizenship?.id || undefined}
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
                      {passportExpires && (
                        <Badge variant="destructive" className="max-h-[20px]">
                          Passport expires in less than 6 months
                        </Badge>
                      )}
                    </div>
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
                      disabled={date => {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        return date < yesterday;
                      }}
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
