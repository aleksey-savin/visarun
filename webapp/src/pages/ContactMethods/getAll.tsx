import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '@/lib/trpcProvider';
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Plus, Edit, Trash2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const contactMethodSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

type ContactMethodFormData = z.infer<typeof contactMethodSchema>;

export default function ContactMethodsManagementPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingContactMethod, setEditingContactMethod] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Queries
  const { data: contactMethodsData, isLoading, refetch } = trpc.contactMethod.getAll.useQuery();
  const { data: usersData } = trpc.user.getAll.useQuery();

  // Mutations
  const createMutation = trpc.contactMethod.create.useMutation({
    onSuccess: () => {
      toast.success('Contact method created successfully');
      refetch();
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: error => {
      toast.error('Failed to create contact method', {
        description: error.message,
      });
    },
  });

  const updateMutation = trpc.contactMethod.edit.useMutation({
    onSuccess: () => {
      toast.success('Contact method updated successfully');
      refetch();
      setEditingContactMethod(null);
      editForm.reset();
    },
    onError: error => {
      toast.error('Failed to update contact method', {
        description: error.message,
      });
    },
  });

  const deleteMutation = trpc.contactMethod.delete.useMutation({
    onSuccess: () => {
      toast.success('Contact method deleted successfully');
      refetch();
      setDeleteId(null);
    },
    onError: error => {
      if (error.message.includes('currently assigned to users')) {
        const contactMethod = contactMethodsData?.contactMethods.find(cm => cm.id === deleteId);
        const usersUsingMethod =
          usersData?.users.filter(user =>
            user.contactMethods?.some(cm => cm.contactMethodId === deleteId)
          ) || [];

        toast.error('Cannot delete contact method', {
          description: `"${contactMethod?.name}" is being used by ${usersUsingMethod.length} user(s). Remove it from all users first.`,
          duration: 5000,
        });
      } else {
        toast.error('Failed to delete contact method', {
          description: error.message,
        });
      }
      setDeleteId(null);
    },
  });

  // Forms
  const createForm = useForm<ContactMethodFormData>({
    resolver: zodResolver(contactMethodSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const editForm = useForm<ContactMethodFormData>({
    resolver: zodResolver(contactMethodSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Handlers
  const handleCreate = (data: ContactMethodFormData) => {
    createMutation.mutate({
      name: data.name,
      description: data.description || undefined,
    });
  };

  const handleEdit = (data: ContactMethodFormData) => {
    if (!editingContactMethod) return;
    updateMutation.mutate({
      id: editingContactMethod.id,
      name: data.name,
      description: data.description || undefined,
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate({ id: deleteId });
  };

  const startEditing = (contactMethod: any) => {
    setEditingContactMethod(contactMethod);
    editForm.reset({
      name: contactMethod.name,
      description: contactMethod.description || '',
    });
  };

  const getContactMethodUsageCount = (contactMethodId: string) => {
    if (!usersData?.users) return 0;
    return usersData.users.filter(user =>
      user.contactMethods?.some(cm => cm.contactMethodId === contactMethodId)
    ).length;
  };

  const getUsersUsingMethod = (contactMethodId: string) => {
    if (!usersData?.users) return [];
    return usersData.users
      .filter(user => user.contactMethods?.some(cm => cm.contactMethodId === contactMethodId))
      .map(user => `${user.firstName} ${user.lastName}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Contact Methods</h1>
            <p className="text-muted-foreground">Manage available contact method types for users</p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Contact Method
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Contact Method</DialogTitle>
              <DialogDescription>
                Add a new contact method type that users can use.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., telegram, whatsapp, phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of this contact method"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contact Methods List */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {contactMethodsData?.contactMethods && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contactMethodsData.contactMethods.map(contactMethod => (
            <Card key={contactMethod.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg capitalize">{contactMethod.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEditing(contactMethod)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog
                      open={deleteId === contactMethod.id}
                      onOpenChange={open => {
                        if (!open) setDeleteId(null);
                      }}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(contactMethod.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Contact Method</AlertDialogTitle>
                          <AlertDialogDescription>
                            {(() => {
                              const usageCount = getContactMethodUsageCount(contactMethod.id);
                              const usersUsing = getUsersUsingMethod(contactMethod.id);

                              if (usageCount > 0) {
                                return (
                                  <div className="space-y-2">
                                    <p>
                                      Cannot delete "{contactMethod.name}" because it's currently
                                      being used by {usageCount} user(s):
                                    </p>
                                    <div className="bg-muted p-2 rounded text-sm">
                                      {usersUsing.join(', ')}
                                    </div>
                                    <p className="text-sm">
                                      Please remove this contact method from all users first, then
                                      try deleting again.
                                    </p>
                                  </div>
                                );
                              } else {
                                return `Are you sure you want to delete "${contactMethod.name}"? This action cannot be undone.`;
                              }
                            })()}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDeleteId(null)}>
                            Cancel
                          </AlertDialogCancel>
                          <Button
                            variant="destructive"
                            onClick={() => handleDelete()}
                            disabled={
                              deleteMutation.isPending ||
                              getContactMethodUsageCount(contactMethod.id) > 0
                            }
                          >
                            {deleteMutation.isPending
                              ? 'Deleting...'
                              : getContactMethodUsageCount(contactMethod.id) > 0
                                ? 'Cannot Delete'
                                : 'Delete'}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {contactMethod.description && (
                  <CardDescription className="mb-3">{contactMethod.description}</CardDescription>
                )}
                <div className="text-sm text-muted-foreground">
                  {(() => {
                    const usageCount = getContactMethodUsageCount(contactMethod.id);
                    return usageCount > 0
                      ? `Used by ${usageCount} user(s)`
                      : 'Not used by any users';
                  })()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingContactMethod} onOpenChange={() => setEditingContactMethod(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact Method</DialogTitle>
            <DialogDescription>Update the contact method information.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., telegram, whatsapp, phone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief description of this contact method" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingContactMethod(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {contactMethodsData?.contactMethods?.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <CardTitle className="mb-2">No Contact Methods</CardTitle>
            <CardDescription className="mb-4">
              You haven't created any contact method types yet. Add some to let users specify their
              contact information.
            </CardDescription>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Contact Method
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
