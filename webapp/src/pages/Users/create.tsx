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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { UserPlus, Shield } from 'lucide-react';
import { trpc } from '@/lib/trpcProvider';
import { getAllUsersRoute } from '@/lib/routes';
import { useState } from 'react';

// Define the exact schema from backend, enforcing non-optional roles
const formSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  //middleName: z.string().min(1).max(100).optional(),
  roleIds: z.array(z.string().uuid()).min(1, 'At least one role must be selected'),
  password: z.string().min(8).max(100),
});

// Use explicit interface for form data
interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  //middleName?: string;
  roleIds: string[];
  password: string;
}

const CreateUserPage = () => {
  const navigate = useNavigate();

  const { data: rolesData } = trpc.role.getAll.useQuery();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const createUserMutation = trpc.user.create.useMutation();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      //middleName: '',
      lastName: '',
      email: '',
      roleIds: [],
      password: '',
    },
  });

  async function onSubmit(values: FormData) {
    try {
      setIsSubmitting(true);

      await createUserMutation.mutateAsync({
        firstName: values.firstName,
        //middleName: values.middleName,
        lastName: values.lastName,
        email: values.email,
        roleIds: values.roleIds,
        password: values.password,
      });
      navigate(getAllUsersRoute());
    } catch (error) {
      console.error('Error creating user:', error);
      if (error instanceof Error) {
        alert(`Failed to create user: ${error.message}`);
      } else {
        alert('Failed to create user due to an unknown error');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center gap-3">
        <UserPlus className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-bold">Create New User</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter password" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={isSubmitting} className="min-w-32">
                    {isSubmitting ? 'Creating...' : 'Create User'}
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
              <h2 className="text-xl font-semibold">Assign Roles</h2>
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
                💡 <strong>Tip:</strong> Select at least one role for this user. Multiple roles can
                be assigned to provide different permissions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateUserPage;
