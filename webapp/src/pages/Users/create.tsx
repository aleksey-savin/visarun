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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpcProvider';
import { getAllUsersRoute } from '@/lib/routes';
import { useState } from 'react';

// Define the exact schema from backend, enforcing non-optional role
const formSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  //middleName: z.string().min(1).max(100).optional(),
  roleId: z.string().uuid(), // Use roleId instead of role
  password: z.string().min(8).max(100),
});

// Use explicit interface for form data
interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  //middleName?: string;
  roleId: string;
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
      roleId: '',
      password: '',
    },
  });

  async function onSubmit(values: FormData) {
    try {
      setIsSubmitting(true);
      console.log('Submitting values:', values);

      await createUserMutation.mutateAsync({
        firstName: values.firstName,
        //middleName: values.middleName,
        lastName: values.lastName,
        email: values.email,
        roleId: values.roleId,
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
    <div className="space-y-6">
      <div className="text-5xl font-semibold capitalize">Create New User</div>

      <div className="max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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

            {/*<FormField
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
            /> */}

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

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="user@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl className="w-full">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rolesData?.roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                          {role.description && ` - ${role.description}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create User'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(getAllUsersRoute())}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CreateUserPage;
