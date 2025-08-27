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

    // Clear any existing errors for this field
    form.clearErrors(fieldName);

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
    } catch (error: any) {
      setSaveStatus('error');

      // Handle unique constraint errors - check for various patterns
      const errorMessage = error?.message || '';

      const isUniqueConstraintError =
        error?.code === 'P2002' ||
        errorMessage.includes('Unique constraint failed') ||
        errorMessage.includes('unique') ||
        errorMessage.includes('already in use');

      if (isUniqueConstraintError) {
        if (fieldName === 'email') {
          form.setError('email', {
            type: 'manual',
            message: 'This email is already in use',
          });
        } else if (fieldName === 'phoneNumber') {
          form.setError('phoneNumber', {
            type: 'manual',
            message: 'This phone number is already in use',
          });
        }
      } else {
        // Handle other types of errors with more specific messages
        let userFriendlyMessage = 'An unexpected error occurred';

        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          userFriendlyMessage = 'Network error - please check your connection and try again';
        } else if (errorMessage.includes('validation')) {
          userFriendlyMessage =
            fieldName === 'email'
              ? 'Please enter a valid email address'
              : 'Please enter a valid phone number';
        } else if (errorMessage.includes('unauthorized')) {
          userFriendlyMessage = 'You are not authorized to make this change';
        } else if (errorMessage.includes('server')) {
          userFriendlyMessage = 'Server error - please try again later';
        }

        form.setError(fieldName, {
          type: 'manual',
          message: userFriendlyMessage,
        });
      }
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
