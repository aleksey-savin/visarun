// src/pages/users/EditUserPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { trpc } from '@/lib/trpcProvider';
import { getAllUsersRoute } from '@/lib/routes';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { UserCheck, Shield } from 'lucide-react';
import { Plus, Edit, Trash2, MessageCircle, ExternalLink } from 'lucide-react';
import { ContactMethodIcon } from '@/components/ContactMethod';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Schema for form validation
const formSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  middleName: z.string().optional(),
  roleIds: z.array(z.string().uuid()).min(1, 'At least one role must be selected'),
  password: z.string().optional(),
});

const contactMethodSchema = z.object({
  contactMethodId: z.string().min(1, 'Contact method is required'),
  value: z.string().min(1, 'Value is required').max(500, 'Value too long'),
  url: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;
type ContactMethodFormData = z.infer<typeof contactMethodSchema>;

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Queries
  const { data: userData, isLoading: isUserLoading } = trpc.user.getOne.useQuery(
    { id: id! },
    {
      retry: 1,
    }
  );
  const { data: rolesData, isLoading: isRolesLoading } = trpc.role.getAll.useQuery(undefined, {
    retry: 1,
  });
  const { data: userContactMethods, refetch: refetchUserContactMethods } =
    trpc.userContactMethod.getByUser.useQuery({ userId: id! });
  const { data: availableContactMethods } = trpc.contactMethod.getAll.useQuery();

  // Mutations
  const editMutation = trpc.user.edit.useMutation();
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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      middleName: '',
      roleIds: [],
      password: '',
    },
  });

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

  // Contact methods state
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);

  useEffect(() => {
    if (!userData) return;

    const roleIds = userData.user.roleAssignments?.map(assignment => assignment.role.id) || [];

    form.reset({
      email: userData.user.email || '',
      firstName: userData.user.firstName,
      lastName: userData.user.lastName,
      middleName: userData.user.middleName || '',
      roleIds: roleIds,
      password: '',
    });

    setTimeout(() => {
      form.setValue('roleIds', roleIds);
    }, 0);
  }, [userData, form]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contact methods handlers
  const handleAddContact = (data: ContactMethodFormData) => {
    createContactMutation.mutate({
      userId: id!,
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

  async function onSubmit(values: FormData) {
    try {
      setIsSubmitting(true);
      setError(null);

      await editMutation.mutateAsync({
        id: id!,
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        middleName: values.middleName || undefined,
        roleIds: values.roleIds,
        password: values.password && values.password.trim() !== '' ? values.password : undefined,
      });
      navigate(getAllUsersRoute());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to update user: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isUserLoading || isRolesLoading) return <div>Loading user data...</div>;

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center gap-3">
        <UserCheck className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-bold">Edit User</h1>
      </div>

      {error && (
        <div className="bg-destructive/15 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">User Information</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Last Name */}
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Middle Name (Optional) */}
                <FormField
                  control={form.control}
                  name="middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter middle name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="user@example.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* New Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Leave empty to keep current password"
                          type="password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={isSubmitting} className="min-w-32">
                    {isSubmitting ? 'Saving…' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(getAllUsersRoute())}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Contact Methods Section - Separate from main form */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Contact Methods</h2>

            {/* Existing Contact Methods */}
            {userContactMethods?.userContactMethods?.map(contactMethod => (
              <div
                key={contactMethod.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 mb-3"
              >
                <div className="flex items-center gap-3">
                  <ContactMethodIcon method={contactMethod.method} />
                  <div>
                    <Badge variant="outline" className="capitalize mb-1">
                      {contactMethod.method.name}
                    </Badge>
                    <div className="text-sm text-gray-600">
                      {contactMethod.url ? (
                        <a
                          href={contactMethod.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          {contactMethod.value}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        contactMethod.value
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditingContact(contactMethod)}
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
            ))}

            {/* Edit Form */}
            {editingContactId && (
              <div className="p-4 border rounded-lg bg-blue-50 mb-4">
                <h4 className="text-md font-medium mb-3">Edit Contact Method</h4>
                <Form {...editContactForm}>
                  <div className="space-y-4">
                    <FormField
                      control={editContactForm.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Value</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter contact value" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
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
                    />
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
                        variant="outline"
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

            {/* Add New Contact Method */}
            {!isAddingContact && getAvailableContactMethods().length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddingContact(true)}
                className="w-full mb-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contact Method
              </Button>
            )}

            {isAddingContact && (
              <div className="p-4 border rounded-lg bg-green-50 mb-4">
                <h4 className="text-md font-medium mb-3">Add Contact Method</h4>
                <Form {...contactForm}>
                  <div className="space-y-4">
                    <FormField
                      control={contactForm.control}
                      name="contactMethodId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Method Type</FormLabel>
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
                          <FormLabel>Value</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter contact value" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
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
                    />
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
                        variant="outline"
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

            {/* Empty state */}
            {(!userContactMethods?.userContactMethods ||
              userContactMethods.userContactMethods.length === 0) &&
              !isAddingContact && (
                <div className="text-center py-6 text-gray-500 border-2 border-dashed rounded-lg">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No contact methods added</p>
                </div>
              )}
          </div>
        </div>

        {/* Roles Section - Right Column */}
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">User Roles</h2>
            </div>

            <Form {...form}>
              <FormField
                control={form.control}
                name="roleIds"
                render={({ field }) => (
                  <FormItem>
                    <div className="space-y-4">
                      {rolesData?.roles.map(role => {
                        const isChecked = field.value.includes(role.id);
                        return (
                          <div
                            key={role.id}
                            className={`
                              flex items-start p-4 border-2 rounded-lg transition-all cursor-pointer hover:bg-accent/50
                              ${isChecked ? 'border-primary bg-primary/5' : 'border-border'}
                            `}
                            onClick={() => {
                              if (isChecked) {
                                field.onChange(field.value.filter((id: string) => id !== role.id));
                              } else {
                                field.onChange([...field.value, role.id]);
                              }
                            }}
                          >
                            <Checkbox
                              id={role.id}
                              checked={isChecked}
                              onCheckedChange={checked => {
                                if (checked) {
                                  field.onChange([...field.value, role.id]);
                                } else {
                                  field.onChange(
                                    field.value.filter((id: string) => id !== role.id)
                                  );
                                }
                              }}
                              className="mt-0.5"
                            />
                            <div className="ml-3 flex-1">
                              <label
                                htmlFor={role.id}
                                className="text-sm font-medium leading-tight cursor-pointer"
                              >
                                {role.name}
                              </label>
                              {role.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {role.description}
                                </p>
                              )}
                            </div>
                            {isChecked && (
                              <div className="ml-2">
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>

            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Tip:</strong> Users can have multiple roles. Each role provides different
                permissions and access levels.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
