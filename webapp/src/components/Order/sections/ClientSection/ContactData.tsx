import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

import { ContactMethodIcon } from '@/components/ContactMethod';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import useOrderStore from '@/stores/order/order-store.js';

const formSchema = z.object({
  contactMethodId: z.string(),
  contactValue: z.string().min(1, {
    message: 'Contact value must be at least 1 character.',
  }),
});

const ContactData = () => {
  const {
    user,
    setSaveStatus,
    contactMethods: userContactMethods,
    setContactMethods: setUserContactMethods,
  } = useOrderStore();

  const defaultContact = userContactMethods?.length > 0 ? userContactMethods[0] : null;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactMethodId: '',
      contactValue: '',
    },
  });

  useEffect(() => {
    if (defaultContact?.value) {
      form.setValue('contactValue', defaultContact?.value);
    }
    if (defaultContact?.method?.id) {
      form.setValue('contactMethodId', defaultContact?.method?.id);
    }
  }, [defaultContact?.value, defaultContact?.method?.id, form]);

  const editContactMutation = trpc.userContactMethod.edit.useMutation();
  const createContactMutation = trpc.userContactMethod.create.useMutation();

  const handleContactValueUpdate = async (e: React.FocusEvent<HTMLInputElement>) => {
    setSaveStatus('saving');
    if (!userContactMethods[0]?.id) {
      const newContactMethodData = await createContactMutation.mutateAsync({
        userId: user.id || '',
        value: e.target.value,
      });

      setUserContactMethods([
        {
          id: newContactMethodData?.userContactMethod?.id || '',
          userId: newContactMethodData?.userContactMethod?.userId || user.id || '',
          value: newContactMethodData?.userContactMethod?.value || '',
          createdAt: newContactMethodData?.userContactMethod?.createdAt
            ? new Date(newContactMethodData?.userContactMethod?.createdAt)
            : new Date(),
          updatedAt: newContactMethodData?.userContactMethod?.updatedAt
            ? new Date(newContactMethodData?.userContactMethod?.updatedAt)
            : new Date(),
          method: {
            id: newContactMethodData?.userContactMethod?.method?.id || '',
            name: newContactMethodData?.userContactMethod?.method?.name || '',
            icon: null,
            description: newContactMethodData?.userContactMethod?.method?.description || null,
          },
        },
      ]);
    }

    if (userContactMethods[0]?.id) {
      setUserContactMethods([{ ...userContactMethods[0], value: e.target.value }]);
      await editContactMutation.mutateAsync({
        id: userContactMethods[0]?.id || '',
        contactValue: e.target.value,
      });
    }

    setSaveStatus('saved');
  };

  const handleContactMethodUpdate = async (contactMethodId: string) => {
    setSaveStatus('saving');

    if (!userContactMethods[0]?.id) {
      const selectedContactMethod = contactMethods.find(m => m.id === contactMethodId);
      const newContactMethodData = await createContactMutation.mutateAsync({
        userId: user.id || '',
        contactMethodId: contactMethodId,
        value: '',
      });

      setUserContactMethods([
        {
          id: newContactMethodData?.userContactMethod?.id || '',
          userId: newContactMethodData?.userContactMethod?.userId || user.id || '',
          value: '',
          createdAt: newContactMethodData?.userContactMethod?.createdAt
            ? new Date(newContactMethodData?.userContactMethod?.createdAt)
            : new Date(),
          updatedAt: newContactMethodData?.userContactMethod?.updatedAt
            ? new Date(newContactMethodData?.userContactMethod?.updatedAt)
            : new Date(),
          method: {
            id: contactMethodId,
            name:
              selectedContactMethod?.name ||
              newContactMethodData?.userContactMethod?.method?.name ||
              '',
            icon: selectedContactMethod?.icon || null,
            description:
              selectedContactMethod?.description ||
              newContactMethodData?.userContactMethod?.method?.description ||
              null,
          },
        },
      ]);
    }

    if (userContactMethods[0]?.id) {
      const selectedContactMethod = contactMethods.find(m => m.id === contactMethodId);

      setUserContactMethods([
        {
          ...userContactMethods[0],
          updatedAt: new Date(),
          method: {
            id: contactMethodId,
            name: selectedContactMethod?.name || userContactMethods[0].method?.name || '',
            icon: selectedContactMethod?.icon || null,
            description:
              selectedContactMethod?.description ||
              userContactMethods[0].method?.description ||
              null,
          },
        },
      ]);

      await editContactMutation.mutateAsync({
        id: userContactMethods[0].id,
        contactMethodId: contactMethodId,
      });
    }

    form.setValue('contactMethodId', contactMethodId);

    setSaveStatus('saved');
  };

  const {
    data: contactMethodsData,
    error: contactMethodsError,
    isLoading: contactMethodsLoading,
  } = trpc.contactMethod.getAll.useQuery();

  const contactMethods = contactMethodsData?.contactMethods || [];

  return (
    <div>
      <Label className="text-sm mb-2">Contact</Label>
      <div className="flex gap-4">
        <Form {...form}>
          <FormField
            name="contactMethodId"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormControl className="min-w-52">
                  <Select
                    defaultValue={field.value}
                    key={`contact-method-${field.value}`}
                    value={field.value}
                    onValueChange={handleContactMethodUpdate}
                    name="contactMethodId"
                  >
                    <SelectTrigger className="min-w-52">
                      <SelectValue placeholder="Select contact method" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactMethodsLoading ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading...</div>
                      ) : contactMethodsError ? (
                        <div className="px-2 py-1.5 text-sm text-destructive">
                          Error loading contact methods
                        </div>
                      ) : contactMethods?.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No contact methods available
                        </div>
                      ) : (
                        contactMethods?.map(method => (
                          <SelectItem key={method.id} value={method.id}>
                            <div className="flex items-center gap-2">
                              <ContactMethodIcon method={method} className="w-4 h-4" />
                              {method.name}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="contactValue"
            control={form.control}
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="phone / @username / e-mail"
                      {...field}
                      onBlur={handleContactValueUpdate}
                    />

                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 pointer-events-none">
                      *
                    </span>
                  </div>
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

export default ContactData;
