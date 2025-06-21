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

// Schema for form validation
const formSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  middleName: z.string().optional(),
  roleIds: z.array(z.string().uuid()).min(1, 'At least one role must be selected'),
  password: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 2) Подгружаем пользователя (с roleModel!) и список ролей
  const { data: userData, isLoading: isUserLoading } = trpc.user.getOne.useQuery(
    { id: id! },
    {
      retry: 1,
    }
  );
  const { data: rolesData, isLoading: isRolesLoading } = trpc.role.getAll.useQuery(undefined, {
    retry: 1,
  });

  const editMutation = trpc.user.edit.useMutation();

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

  useEffect(() => {
    if (!userData) return;

    const roleIds = userData.user.roleAssignments?.map(assignment => assignment.role.id) || [];

    form.reset({
      email: userData.user.email,
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
            <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
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
