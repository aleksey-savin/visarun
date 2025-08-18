import { trpc } from '@/lib/trpc';
import { Switch } from '@/components/ui/switch';

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

const formSchema = z.object({
  lastName: z.string(),
  firstName: z.string(),
  citizenshipId: z.string(),
  preConfirmPassportIsValid: z.boolean(),
});

const ClientData = ({ client }: { client: StoreClient }) => {
  const { setSaveStatus, clients, setClients } = useOrderStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lastName: client?.lastName || '',
      firstName: client?.firstName || '',
      citizenshipId: client?.citizenship?.id || '',
      preConfirmPassportIsValid: client?.preConfirmPassportIsValid || false,
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

  const handlePassportValidUpdate = async (isValid: boolean) => {
    setSaveStatus('saving');

    setClients(
      clients.map(c => (c.id === client.id ? { ...c, preConfirmPassportIsValid: isValid } : c))
    );

    form.setValue('preConfirmPassportIsValid', isValid);

    try {
      await editClientMutation.mutateAsync({
        id: client.id,
        preConfirmPassportIsValid: isValid,
      });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  return (
    <div className="flex flex-col flex-wrap justify-start gap-6">
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
          name="preConfirmPassportIsValid"
          render={({ field }) => (
            <FormItem>
              <div className="flex gap-2">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={handlePassportValidUpdate} />
                </FormControl>
                <FormLabel>Passport is valid</FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </div>
  );
};

export default ClientData;
