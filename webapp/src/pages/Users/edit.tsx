import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { trpc } from '@/lib/trpcProvider';
import { getAllUsersRoute, getViewUserRoute } from '@/lib/routes';

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { UserCheck, Shield, ArrowLeft, Save } from 'lucide-react';
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

type FormData = z.infer<typeof formSchema>;

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

  // Mutations
  const editMutation = trpc.user.edit.useMutation({
    onSuccess: () => {
      toast.success('User updated successfully', {
        description: 'The user information has been saved.',
      });
      navigate(getViewUserRoute({ id: id! }));
    },
    onError: error => {
      toast.error('Failed to update user', {
        description: error.message,
      });
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

  async function onSubmit(values: FormData) {
    try {
      setIsSubmitting(true);

      await editMutation.mutateAsync({
        id: id!,
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        middleName: values.middleName || undefined,
        roleIds: values.roleIds,
        password: values.password && values.password.trim() !== '' ? values.password : undefined,
      });
    } catch {
      // Error handling is done in the mutation's onError
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isUserLoading || isRolesLoading) {
    return (
      <>
        <div className="sticky top-0 z-10 bg-background border-b flex px-6 justify-between gap-2 items-center h-[45px]">
          <div className="flex gap-3 items-center text-sm min-h-[45px]">
            <UserCheck />
            <span className="text-muted-foreground">Loading user...</span>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-9">
              <Card className="bg-secondary mr-2.5 p-6 mb-2.5">
                <div className="space-y-4">
                  <div className="h-8 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                </div>
              </Card>
            </div>
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="h-6 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!userData?.user) {
    return (
      <>
        <div className="sticky top-0 z-10 bg-background border-b flex px-6 justify-between gap-2 items-center h-[45px]">
          <div className="flex gap-3 items-center text-sm min-h-[45px]">
            <UserCheck />
            <span className="text-destructive">User not found</span>
          </div>
        </div>
        <div className="p-6">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">User Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">The user with ID {id} could not be found.</p>
              <div className="mt-4">
                <Button variant="secondary" onClick={() => navigate(getAllUsersRoute())}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to All Users
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const user = userData.user;

  return (
    <>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <Card className="bg-secondary mr-2.5 p-6 mb-2.5">
              <CardContent className="px-0 pt-0">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="flex flex-wrap gap-4">
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
                    </div>
                    <div className="flex">
                      {/* Email */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input
                                className="w-auto"
                                placeholder="user@example.com"
                                type="email"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* New Password */}
                    <div className="flex">
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
                    </div>
                    <Separator />

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 ">
                      <Button type="submit" disabled={isSubmitting}>
                        <Save className="h-4 w-4 " />
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate(getViewUserRoute({ id: user.id }))}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Roles Sidebar */}
          <div className="grid space-y-2 sticky top-[45px] self-start lg:col-span-4 text-sm">
            <Card className="p-6">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 mb-6">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">User Roles</h3>
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
                                    field.onChange(
                                      field.value.filter((id: string) => id !== role.id)
                                    );
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

                <div className="mt-6 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Tip:</strong> Users can have multiple roles. Each role provides
                    different permissions and access levels.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
