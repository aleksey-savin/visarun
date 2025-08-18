import { Label } from '@/components/ui/label';
import { FormField, FormItem, FormControl, FormMessage, Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import useOrderStore from '@/stores/order/order-store.js';

const formSchema = z.object({
  email: z.string(),
  phoneNumber: z.string(),
});

const UserContacts = () => {
  const { setSaveStatus, user, setUser } = useOrderStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
    },
  });

  const editUserMutation = trpc.user.edit.useMutation();

  const handleContactUpdate = async (fieldName: 'email' | 'phoneNumber', value: string) => {
    if (!user) return;

    setSaveStatus('saving');

    setUser({
      ...user,
      [fieldName]: value,
    });

    try {
      await editUserMutation.mutateAsync({
        id: user.id,
        [fieldName]: value,
      });

      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  const handleChange = (field: any, value: string) => {
    field.onChange(value);
  };

  const handleBlur = (fieldName: 'email' | 'phoneNumber') => {
    if (!user) return;

    const value = form.getValues(fieldName);
    if (value !== user[fieldName]) {
      handleContactUpdate(fieldName, value);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div>
      <Label className="text-sm mb-2">
        Contacts<span className="text-red-500">*</span>
      </Label>
      <div className="flex gap-4">
        <Form {...form}>
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Phone Number"
                    value={field.value || ''}
                    onChange={e => handleChange(field, e.target.value)}
                    onBlur={() => handleBlur('phoneNumber')}
                    name={field.name}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Email"
                    value={field.value || ''}
                    onChange={e => handleChange(field, e.target.value)}
                    onBlur={() => handleBlur('email')}
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

export default UserContacts;
