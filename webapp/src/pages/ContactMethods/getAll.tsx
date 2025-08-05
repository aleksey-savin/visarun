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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, MessageCircle, Search, Filter } from 'lucide-react';
import { ContactMethodIcon } from '@/components/ContactMethod';
import { toast } from 'sonner';

const contactMethodSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  icon: z.string().max(2000, 'Icon too large').optional(),
});

type ContactMethodFormData = z.infer<typeof contactMethodSchema>;

export default function ContactMethodsManagementPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingContactMethod, setEditingContactMethod] = useState<{
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
  } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [usageFilter, setUsageFilter] = useState('all');

  // Queries
  const {
    data: contactMethodsData,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.contactMethod.getAll.useQuery();
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
        const usersUsingMethod = getUsersUsingMethod(deleteId || '');

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
      icon: '',
    },
  });

  const editForm = useForm<ContactMethodFormData>({
    resolver: zodResolver(contactMethodSchema),
    defaultValues: {
      name: '',
      description: '',
      icon: '',
    },
  });

  // Helper functions
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

  // Filter contact methods
  const contactMethods = contactMethodsData?.contactMethods || [];
  const filteredContactMethods = contactMethods.filter(method => {
    const matchesSearch =
      searchTerm === '' ||
      method.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (method.description && method.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const usageCount = getContactMethodUsageCount(method.id);
    const matchesUsage =
      usageFilter === 'all' ||
      (usageFilter === 'used' && usageCount > 0) ||
      (usageFilter === 'unused' && usageCount === 0);

    return matchesSearch && matchesUsage;
  });

  // Handlers
  const handleCreate = (data: ContactMethodFormData) => {
    createMutation.mutate({
      name: data.name,
      description: data.description || undefined,
      icon: data.icon || undefined,
    });
  };

  const handleEdit = (data: ContactMethodFormData) => {
    if (!editingContactMethod) return;
    updateMutation.mutate({
      id: editingContactMethod.id,
      name: data.name,
      description: data.description || undefined,
      icon: data.icon || undefined,
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate({ id: deleteId });
  };

  const startEditing = (contactMethod: {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
  }) => {
    setEditingContactMethod(contactMethod);
    editForm.reset({
      name: contactMethod.name,
      description: contactMethod.description || '',
      icon: contactMethod.icon || '',
    });
  };

  return (
    <div className="grid gap-6 p-6 pb-0">
      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Usage</label>
              <Select value={usageFilter} onValueChange={setUsageFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All contact methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All contact methods</SelectItem>
                  <SelectItem value="used">Used by users</SelectItem>
                  <SelectItem value="unused">Not used</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Methods */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Contact Methods ({filteredContactMethods.length})
              {filteredContactMethods.length !== contactMethods.length && (
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  of {contactMethods.length} total
                </span>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {isError && (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <h3 className="font-medium text-lg mb-2">Error Loading Contact Methods</h3>
              <p>{error.message}</p>
            </div>
          )}

          {filteredContactMethods.length === 0 && !isLoading && !isError ? (
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-medium mb-2">
                {contactMethods.length === 0
                  ? 'No Contact Methods'
                  : 'No contact methods match your filters'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {contactMethods.length === 0
                  ? "You haven't created any contact method types yet. Add some to let users specify their contact information."
                  : 'Try adjusting your search or filter criteria.'}
              </p>
              {contactMethods.length === 0 && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Contact Method
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Table view (hidden on mobile) */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Icon</TableHead>
                        <TableHead className="w-[200px]">Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[120px]">Usage</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContactMethods.map(contactMethod => {
                        const usageCount = getContactMethodUsageCount(contactMethod.id);
                        return (
                          <TableRow key={contactMethod.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center justify-center">
                                <ContactMethodIcon method={contactMethod} className="w-6 h-6" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium capitalize">{contactMethod.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                {contactMethod.description || (
                                  <span className="text-muted-foreground italic">
                                    No description
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={usageCount > 0 ? 'default' : 'outline'}>
                                {usageCount > 0 ? `${usageCount} user(s)` : 'Not used'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditing(contactMethod)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteId(contactMethod.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Card view (visible only on mobile) */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredContactMethods.map(contactMethod => {
                  const usageCount = getContactMethodUsageCount(contactMethod.id);
                  return (
                    <Card
                      key={contactMethod.id}
                      className="hover:border-primary/50 transition-colors"
                    >
                      <CardContent className="px-4 py-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <ContactMethodIcon method={contactMethod} className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="font-medium capitalize">{contactMethod.name}</h3>
                              <div className="text-sm text-muted-foreground">
                                {contactMethod.description || 'No description'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(contactMethod)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(contactMethod.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-end pt-2">
                          <Badge variant={usageCount > 0 ? 'default' : 'outline'}>
                            {usageCount > 0 ? `${usageCount} user(s)` : 'Not used'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={open => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact Method</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                if (!deleteId) return '';
                const contactMethod = contactMethodsData?.contactMethods.find(
                  cm => cm.id === deleteId
                );
                const usageCount = getContactMethodUsageCount(deleteId);
                const usersUsing = getUsersUsingMethod(deleteId);

                if (usageCount > 0) {
                  return (
                    <div className="space-y-2">
                      <p>
                        Cannot delete "{contactMethod?.name}" because it's currently being used by{' '}
                        {usageCount} user(s):
                      </p>
                      <div className="bg-muted p-2 rounded text-sm max-h-20 overflow-y-auto">
                        {usersUsing.join(', ')}
                      </div>
                      <p className="text-sm">
                        Please remove this contact method from all users first, then try deleting
                        again.
                      </p>
                    </div>
                  );
                } else {
                  return `Are you sure you want to delete "${contactMethod?.name}"? This action cannot be undone.`;
                }
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={
                deleteMutation.isPending ||
                (deleteId ? getContactMethodUsageCount(deleteId) > 0 : false)
              }
              className={
                deleteId && getContactMethodUsageCount(deleteId) > 0
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              }
            >
              {deleteMutation.isPending
                ? 'Deleting...'
                : deleteId && getContactMethodUsageCount(deleteId) > 0
                  ? 'Cannot Delete'
                  : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Contact Method</DialogTitle>
            <DialogDescription>Add a new contact method type that users can use.</DialogDescription>
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
                      <Textarea placeholder="Brief description of this contact method" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="SVG icon code (e.g., <svg>...</svg>)"
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    {field.value && (
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <span className="text-sm text-muted-foreground">Preview:</span>
                        <div
                          className="w-6 h-6 flex items-center justify-center"
                          dangerouslySetInnerHTML={{ __html: field.value }}
                        />
                      </div>
                    )}
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
              <FormField
                control={editForm.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="SVG icon code (e.g., <svg>...</svg>)"
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    {field.value && (
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <span className="text-sm text-muted-foreground">Preview:</span>
                        <div
                          className="w-6 h-6 flex items-center justify-center"
                          dangerouslySetInnerHTML={{ __html: field.value }}
                        />
                      </div>
                    )}
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
    </div>
  );
}
