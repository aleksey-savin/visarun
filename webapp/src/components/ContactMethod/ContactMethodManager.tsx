import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '@/lib/trpcProvider';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, MessageCircle } from 'lucide-react';
import { ContactMethodIcon } from '@/components/ContactMethod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

// Contact method schema and types
const contactMethodSchema = z.object({
  contactMethodId: z.string().min(1, 'Contact method is required'),
  value: z.string().min(1, 'Value is required').max(500, 'Value too long'),
  url: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type ContactMethodFormData = z.infer<typeof contactMethodSchema>;

interface ContactMethodManagerProps {
  userId: string;
}

export const ContactMethodManager: React.FC<ContactMethodManagerProps> = ({ userId }) => {
  // Contact methods state
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);

  // Contact method queries
  const { data: userContactMethods, refetch: refetchUserContactMethods } =
    trpc.userContactMethod.getByUser.useQuery({ userId });
  const { data: availableContactMethods } = trpc.contactMethod.getAll.useQuery();

  // Contact method mutations
  const createContactMutation = trpc.userContactMethod.create.useMutation({
    onSuccess: () => {
      toast.success('Contact method added successfully');
      refetchUserContactMethods();
      setIsAddingContact(false);
      contactForm.reset();
    },
    onError: error => {
      toast.error('Failed to add contact method', {
        description: error.message,
      });
    },
  });

  const updateContactMutation = trpc.userContactMethod.edit.useMutation({
    onSuccess: () => {
      toast.success('Contact method updated successfully');
      refetchUserContactMethods();
      setEditingContactId(null);
      editContactForm.reset();
    },
    onError: error => {
      toast.error('Failed to update contact method', {
        description: error.message,
      });
    },
  });

  const deleteContactMutation = trpc.userContactMethod.delete.useMutation({
    onSuccess: () => {
      toast.success('Contact method deleted successfully');
      refetchUserContactMethods();
      setDeletingContactId(null);
    },
    onError: error => {
      toast.error('Failed to delete contact method', {
        description: error.message,
      });
      setDeletingContactId(null);
    },
  });

  // Contact method forms
  const contactForm = useForm<ContactMethodFormData>({
    resolver: zodResolver(contactMethodSchema),
    defaultValues: {
      contactMethodId: '',
      value: '',
      url: '',
    },
  });

  const editContactForm = useForm<ContactMethodFormData>({
    resolver: zodResolver(contactMethodSchema),
    defaultValues: {
      contactMethodId: '',
      value: '',
      url: '',
    },
  });

  // Contact methods handlers
  const handleAddContact = (data: ContactMethodFormData) => {
    createContactMutation.mutate({
      userId,
      contactMethodId: data.contactMethodId,
      value: data.value,
      url: data.url || undefined,
    });
  };

  const handleEditContact = (data: ContactMethodFormData) => {
    if (!editingContactId) return;
    updateContactMutation.mutate({
      id: editingContactId,
      contactValue: data.value,
      url: data.url || undefined,
    });
  };

  const startEditingContact = (contactMethod: {
    id: string;
    contactMethodId: string;
    value: string;
    url: string | null;
  }) => {
    setEditingContactId(contactMethod.id);
    editContactForm.reset({
      contactMethodId: contactMethod.contactMethodId,
      value: contactMethod.value,
      url: contactMethod.url || '',
    });
  };

  const getAvailableContactMethods = () => {
    if (!availableContactMethods?.contactMethods || !userContactMethods?.userContactMethods) {
      return availableContactMethods?.contactMethods || [];
    }

    const assignedMethodIds = userContactMethods.userContactMethods.map(ucm => ucm.contactMethodId);

    return availableContactMethods.contactMethods.filter(
      method => !assignedMethodIds.includes(method.id)
    );
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Contact Methods</h4>
      {/* Existing Contact Methods */}
      {userContactMethods?.userContactMethods?.map(contactMethod => (
        <Card key={contactMethod.id} className="bg-secondary rounded-md p-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-0.5">
                <ContactMethodIcon
                  method={
                    contactMethod.method
                      ? { name: contactMethod.method.name, icon: contactMethod.method.icon }
                      : { name: 'Unknown', icon: null }
                  }
                />
                <div className="text-xs capitalize"> {contactMethod.method?.name || 'Unknown'}</div>
                <Badge variant="outline" className="capitalize m-0"></Badge>
              </div>
              <div className="text-sm text-gray-500">{contactMethod.value}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  startEditingContact({
                    id: contactMethod.id,
                    contactMethodId: contactMethod.contactMethodId || '',
                    value: contactMethod.value || '',
                    url: contactMethod.url,
                  })
                }
                disabled={editingContactId === contactMethod.id}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog
                open={deletingContactId === contactMethod.id}
                onOpenChange={open => {
                  if (!open) setDeletingContactId(null);
                }}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingContactId(contactMethod.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Contact Method</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this contact method? This action cannot be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeletingContactId(null)}>
                      Cancel
                    </AlertDialogCancel>
                    <Button
                      variant="destructive"
                      disabled={deleteContactMutation.isPending}
                      onClick={() => deleteContactMutation.mutate({ id: contactMethod.id })}
                    >
                      {deleteContactMutation.isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Card>
      ))}

      {/* Edit Form */}
      {editingContactId && (
        <div className="p-3 border rounded-lg">
          <h4 className="text-md font-medium mb-3">Edit Contact Method</h4>
          <Form {...editContactForm}>
            <div className="flex flex-wrap items-center justify-between">
              <FormField
                control={editContactForm.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Enter contact value" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* <FormField
                control={editContactForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter URL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={updateContactMutation.isPending}
                  onClick={() => {
                    editContactForm.handleSubmit(handleEditContact)();
                  }}
                >
                  {updateContactMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingContactId(null);
                    editContactForm.reset();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Form>
        </div>
      )}

      {/* Empty state */}
      {(!userContactMethods?.userContactMethods ||
        userContactMethods.userContactMethods.length === 0) &&
        !isAddingContact && (
          <div className="flex gap-2 justify-center text-muted-foreground items-center p-3 border-2 border-dashed rounded-lg">
            <MessageCircle />
            <div className="text-sm">No contact methods added</div>
          </div>
        )}

      {/* Add New Contact Method */}
      {!isAddingContact && getAvailableContactMethods().length > 0 && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsAddingContact(true)}
            className="w-auto"
          >
            <Plus />
            Add Contact Method
          </Button>
        </div>
      )}

      {isAddingContact && (
        <div className="p-3 border rounded-lg">
          <h4 className="text-md font-medium mb-3">Add Contact Method</h4>
          <Form {...contactForm}>
            <div className="flex flex-wrap justify-between gap-2.5">
              <div className="flex gap-2.5">
                <FormField
                  control={contactForm.control}
                  name="contactMethodId"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select contact method type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getAvailableContactMethods().map(method => (
                            <SelectItem key={method.id} value={method.id}>
                              <div className="flex items-center gap-2">
                                <ContactMethodIcon method={method} />
                                <span className="capitalize">{method.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={contactForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Enter contact value" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* <FormField
                control={contactForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter URL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={createContactMutation.isPending}
                  onClick={() => {
                    contactForm.handleSubmit(handleAddContact)();
                  }}
                >
                  {createContactMutation.isPending ? 'Adding...' : 'Add'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsAddingContact(false);
                    contactForm.reset();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Form>
        </div>
      )}
    </div>
  );
};
