import { Label } from '@/components/ui/label';
import { FormField, FormItem, FormControl, FormMessage, Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import useOrderStore from '@/stores/order/order-store.js';
import { StoreClient } from '@/stores/order/order-store';

const formSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
});

const ClientName = ({ client }: { client: StoreClient | undefined }) => {
  const { setSaveStatus, clients, setClients, user, setUser } = useOrderStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: client?.firstName || '',
      lastName: client?.lastName || '',
    },
  });

  const editClientMutation = trpc.client.edit.useMutation();
  const editUserMutation = trpc.user.edit.useMutation();

  const handleNameUpdate = async (fieldName: 'firstName' | 'lastName', value: string) => {
    if (!client) return;

    setSaveStatus('saving');

    // Update the local state immediately
    setClients(
      clients.map(c =>
        c.id === client.id
          ? {
              ...c,
              [fieldName]: value,
            }
          : c
      )
    );

    // If client is primary, also update user data
    if (client.isPrimary && user) {
      setUser({
        ...user,
        [fieldName]: value,
      });
    }

    try {
      await editClientMutation.mutateAsync({
        id: client.id,
        [fieldName]: value,
        passportExpirationDate: client.passportExpirationDate?.toISOString() || null,
      });
      setSaveStatus('saved');

      if (client.isPrimary) {
        await editUserMutation.mutateAsync({
          id: user.id,
          [fieldName]: value,
        });
      }

      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
      // Revert the local state on error
      setClients(
        clients.map(c =>
          c.id === client.id
            ? {
                ...c,
                [fieldName]: client[fieldName] || '',
              }
            : c
        )
      );

      // Also revert user data if client is primary
      if (client.isPrimary && user) {
        setUser({
          ...user,
          [fieldName]: client[fieldName] || '',
        });
      }
    }
  };

  const handleChange = (field: any, value: string) => {
    field.onChange(value);
  };

  const handleBlur = (fieldName: 'firstName' | 'lastName') => {
    if (!client) return;

    const value = form.getValues(fieldName);
    if (value !== client[fieldName]) {
      handleNameUpdate(fieldName, value);
    }
  };

  if (!client) {
    return null;
  }

  return (
    <div>
      <Label className="text-sm mb-2">Full name</Label>
      <div className="flex gap-4">
        <Form {...form}>
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="First Name"
                    value={field.value || ''}
                    onChange={e => handleChange(field, e.target.value)}
                    onBlur={() => handleBlur('firstName')}
                    name={field.name}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Last Name"
                    value={field.value || ''}
                    onChange={e => handleChange(field, e.target.value)}
                    onBlur={() => handleBlur('lastName')}
                    name={field.name}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>
      </div>
    </div>
  );
};

export default ClientName;
