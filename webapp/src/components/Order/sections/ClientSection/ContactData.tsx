import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';
import { Mail, Phone } from 'lucide-react';
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

const formSchema = z
  .object({
    contactMethodId: z.string(),
    contactValue: z.string().min(1, {
      message: 'Contact value must be at least 1 character.',
    }),
  })
  .refine(
    data => {
      if (data.contactMethodId === 'email') {
        return z.string().email().safeParse(data.contactValue).success;
      }
      if (data.contactMethodId === 'phone') {
        return /^[+]?[(]?[\s\d\-()]{7,}$/.test(data.contactValue);
      }
      return true;
    },
    {
      message: 'Please enter a valid email address or phone number.',
      path: ['contactValue'],
    }
  );

const ContactData = () => {
  const {
    user,
    setSaveStatus,
    contactMethods: userContactMethods,
    setContactMethods: setUserContactMethods,
    setUser,
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
    if (defaultContact?.value && defaultContact?.method?.id) {
      form.setValue('contactValue', defaultContact?.value);
      form.setValue('contactMethodId', defaultContact?.method?.id);
    } else {
      // If no contact method is selected, prioritize email if available
      if (user.email) {
        form.setValue('contactMethodId', 'email');
        form.setValue('contactValue', user.email);
      } else if (user.phoneNumber) {
        form.setValue('contactMethodId', 'phone');
        form.setValue('contactValue', user.phoneNumber);
      }
    }
  }, [defaultContact?.value, defaultContact?.method?.id, user.email, user.phoneNumber, form]);

  const editContactMutation = trpc.userContactMethod.edit.useMutation();
  const createContactMutation = trpc.userContactMethod.create.useMutation();
  const editUserMutation = trpc.user.edit.useMutation();

  // Watch for contact method changes to update placeholder
  const watchedContactMethodId = useWatch({
    control: form.control,
    name: 'contactMethodId',
  });

  const handleContactValueUpdate = async (e: React.FocusEvent<HTMLInputElement>) => {
    setSaveStatus('saving');

    const selectedContactMethodId = form.getValues('contactMethodId');
    const contactValue = e.target.value;

    // Handle email and phone updates to user fields
    if (selectedContactMethodId === 'email' || selectedContactMethodId === 'phone') {
      const updateData: { id: string; email?: string; phoneNumber?: string } = { id: user.id };

      if (selectedContactMethodId === 'email') {
        updateData.email = contactValue;
      } else if (selectedContactMethodId === 'phone') {
        updateData.phoneNumber = contactValue;
      }

      try {
        const updatedUser = await editUserMutation.mutateAsync(updateData);

        // Update the user in the store
        if (updatedUser?.user) {
          const updatedUserData = {
            ...user,
            email: selectedContactMethodId === 'email' ? contactValue : user.email,
            phoneNumber: selectedContactMethodId === 'phone' ? contactValue : user.phoneNumber,
            updatedAt: new Date(),
          };

          setUser(updatedUserData);
        }

        setSaveStatus('saved');
      } catch (error) {
        console.error('Failed to update user contact:', error);
        setSaveStatus('error');
      }
      return;
    }

    // Handle regular contact methods
    if (!userContactMethods[0]?.id) {
      const newContactMethodData = await createContactMutation.mutateAsync({
        userId: user.id || '',
        value: contactValue,
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
      setUserContactMethods([{ ...userContactMethods[0], value: contactValue }]);
      await editContactMutation.mutateAsync({
        id: userContactMethods[0]?.id || '',
        contactValue: contactValue,
      });
    }

    setSaveStatus('saved');
  };

  const handleContactMethodUpdate = async (contactMethodId: string) => {
    setSaveStatus('saving');

    // Handle email and phone - just update form value and set existing user data
    if (contactMethodId === 'email' || contactMethodId === 'phone') {
      form.setValue('contactMethodId', contactMethodId);

      // Set the current user email/phone value in the form
      if (contactMethodId === 'email' && user.email) {
        form.setValue('contactValue', user.email);
      } else if (contactMethodId === 'phone' && user.phoneNumber) {
        form.setValue('contactValue', user.phoneNumber);
      } else {
        form.setValue('contactValue', '');
      }

      // Revalidate the form with new contact method
      form.trigger('contactValue');

      setSaveStatus('saved');
      return;
    }

    // Handle regular contact methods
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

    // Revalidate the form with new contact method
    form.trigger('contactValue');

    setSaveStatus('saved');
  };

  const {
    data: contactMethodsData,
    error: contactMethodsError,
    isLoading: contactMethodsLoading,
  } = trpc.contactMethod.getAll.useQuery();

  const dbContactMethods = contactMethodsData?.contactMethods || [];

  // Add email and phone to contact methods
  const contactMethods = [
    ...dbContactMethods,
    {
      id: 'email',
      name: 'Email',
      icon: null,
      description: 'Email address',
    },
    {
      id: 'phone',
      name: 'Phone',
      icon: null,
      description: 'Phone number',
    },
  ];

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
                              {method.id === 'email' ? (
                                <Mail className="w-4 h-4" />
                              ) : method.id === 'phone' ? (
                                <Phone className="w-4 h-4" />
                              ) : (
                                <ContactMethodIcon method={method} className="w-4 h-4" />
                              )}
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
                      placeholder={
                        watchedContactMethodId === 'email'
                          ? 'Enter email address'
                          : watchedContactMethodId === 'phone'
                            ? 'Enter phone number'
                            : 'phone / @username / e-mail'
                      }
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
