import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Shield, Plus } from 'lucide-react';
import { trpc } from '@/lib/trpcProvider';
import { getAllRolesRoute } from '@/lib/routes';
import { useState } from 'react';
import { toast } from 'sonner';

// Define the form schema
const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string(),
  permissions: z.array(z.string()),
});

type FormData = {
  name: string;
  description: string;
  permissions: string[];
};

const CreateRolePage = () => {
  const navigate = useNavigate();
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const { data: permissionsData } = trpc.permission.getAll.useQuery();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const createRoleMutation = trpc.role.create.useMutation();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
    } as FormData,
  });

  // Handle permission checkbox changes
  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    console.log('Permission change:', { permissionId, checked });
    if (checked) {
      setSelectedPermissions(prev => {
        const newPermissions = [...prev, permissionId];
        console.log('Adding permission, new list:', newPermissions);
        form.setValue('permissions', newPermissions, { shouldDirty: true, shouldTouch: true });
        return newPermissions;
      });
    } else {
      setSelectedPermissions(prev => {
        const newPermissions = prev.filter(id => id !== permissionId);
        console.log('Removing permission, new list:', newPermissions);
        form.setValue('permissions', newPermissions, { shouldDirty: true, shouldTouch: true });
        return newPermissions;
      });
    }
  };

  async function onSubmit(values: FormData) {
    try {
      setIsSubmitting(true);

      console.log('Submitting role creation:', {
        name: values.name,
        description: values.description || undefined,
        permissions: selectedPermissions,
      });

      await createRoleMutation.mutateAsync({
        name: values.name,
        description:
          values.description && values.description.trim() !== '' ? values.description : undefined,
        permissions: selectedPermissions,
      });

      toast.success('Role created successfully');
      navigate(getAllRolesRoute());
    } catch (error) {
      console.error('Error creating role:', error);
      console.error('Selected permissions were:', selectedPermissions);
      if (error instanceof Error) {
        toast.error('Failed to create role', {
          description: error.message,
        });
      } else {
        toast.error('Failed to create role due to an unknown error');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center gap-3">
        <Plus className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-bold">Create New Role</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Role Information</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter role name" {...field} />
                      </FormControl>
                      <FormDescription>
                        Choose a unique name for this role. System role names (admin, client) are
                        reserved.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter role description"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Describe what this role is for and what kind of users should have it.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={isSubmitting} className="min-w-32">
                    {isSubmitting ? 'Creating...' : 'Create Role'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(getAllRolesRoute())}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>

        {/* Permissions Section - Right Column */}
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Assign Permissions</h2>
            </div>

            {permissionsData?.groupedPermissions ? (
              <div className="space-y-6">
                {Object.entries(permissionsData.groupedPermissions).map(
                  ([category, permissions]) => (
                    <div key={category} className="space-y-3">
                      <h3 className="text-md font-semibold">{category}</h3>
                      <Separator />
                      <div className="space-y-2">
                        {permissions.map(permission => {
                          const isChecked = selectedPermissions.includes(permission.id);
                          return (
                            <div
                              key={permission.id}
                              className={`
                                flex items-start p-4 border-2 rounded-lg transition-all cursor-pointer hover:bg-accent/50
                                ${isChecked ? 'border-primary bg-primary/5' : 'border-border'}
                              `}
                              onClick={() => handlePermissionChange(permission.id, !isChecked)}
                            >
                              <Checkbox
                                id={permission.id}
                                checked={isChecked}
                                onCheckedChange={checked => {
                                  handlePermissionChange(permission.id, checked as boolean);
                                }}
                                className="mt-0.5"
                              />
                              <div className="ml-3 flex-1">
                                <label
                                  htmlFor={permission.id}
                                  className="text-sm font-medium leading-tight cursor-pointer"
                                >
                                  {permission.description || permission.code}
                                </label>
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
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded text-yellow-700 border border-yellow-200">
                <div className="font-medium mb-2">No permissions found</div>
                <p>Contact an administrator to set up permissions for this system.</p>
              </div>
            )}

            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Tip:</strong> Select the permissions that users with this role should
                have. You can modify these later if needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRolePage;
