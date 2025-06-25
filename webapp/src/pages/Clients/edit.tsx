import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type EditClientRouteParams } from '../../lib/routes';
import { trpc } from '../../lib/trpcProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { format } from 'date-fns';

const editClientSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  citizenshipId: z.string().optional().nullable(),
  prevViolations: z.boolean().optional().default(false),
  prevViolationsDesc: z.string().optional().nullable(),
  isOutsideTheCountry: z.boolean().optional().default(false),
  isOutsideTheCountryAt: z.string().optional().nullable(),
});

type EditClientFormData = {
  firstName: string;
  lastName: string;
  citizenshipId?: string | null;
  prevViolations?: boolean;
  prevViolationsDesc?: string | null;
  isOutsideTheCountry?: boolean;
  isOutsideTheCountryAt?: string | null;
};

const EditClientPage = () => {
  const { id } = useParams() as EditClientRouteParams;
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditClientFormData>({
    resolver: zodResolver(editClientSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      citizenshipId: null,
      prevViolations: false,
      prevViolationsDesc: null,
      isOutsideTheCountry: false,
      isOutsideTheCountryAt: null,
    },
  });

  // Query to get client details
  const { data, error, isLoading, isError } = trpc.client.getOne.useQuery({ id });

  // Get citizenships for dropdown
  const { data: citizenshipsData } = trpc.citizenship.getAll.useQuery();

  // Edit client mutation
  const editClientMutation = trpc.client.edit.useMutation({
    onSuccess: () => {
      toast.success('Client profile updated successfully');
      navigate(`/clients/view/${id}`);
    },
    onError: (error: any) => {
      toast.error('Failed to update client profile', {
        description: error.message,
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Set form values when client data is loaded
  React.useEffect(() => {
    if (data?.client) {
      const client = data.client;
      form.setValue('firstName', client.firstName);
      form.setValue('lastName', client.lastName);
      form.setValue('citizenshipId', client.citizenshipId);
      form.setValue('prevViolations', client.prevViolations);
      form.setValue('prevViolationsDesc', client.prevViolationsDesc);
      form.setValue('isOutsideTheCountry', client.isOutsideTheCountry);
      if (client.isOutsideTheCountryAt) {
        form.setValue(
          'isOutsideTheCountryAt',
          format(new Date(client.isOutsideTheCountryAt), 'yyyy-MM-dd')
        );
      }
    }
  }, [data, form]);

  const onSubmit = (data: EditClientFormData) => {
    setIsSubmitting(true);

    const isOutsideTheCountryAt = data.isOutsideTheCountryAt
      ? new Date(data.isOutsideTheCountryAt + 'T00:00:00')
      : null;

    editClientMutation.mutate({
      id,
      firstName: data.firstName,
      lastName: data.lastName,
      citizenshipId: data.citizenshipId || undefined,
      prevViolations: data.prevViolations || false,
      prevViolationsDesc: data.prevViolationsDesc || undefined,
      isOutsideTheCountry: data.isOutsideTheCountry || false,
      isOutsideTheCountryAt,
    });
  };

  const watchPrevViolations = form.watch('prevViolations');
  const watchIsOutsideTheCountry = form.watch('isOutsideTheCountry');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Edit Client Profile</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <p>Loading client details...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Edit Client Profile</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading client: {error.message}</p>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Edit Client Profile</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Client not found</p>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Client Profile</h1>
          <p className="text-gray-600">
            {data.client.firstName} {data.client.lastName}
          </p>
        </div>
      </div>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                name="citizenshipId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Citizenship</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select citizenship" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No citizenship selected</SelectItem>
                        {citizenshipsData?.citizenships.map(citizenship => (
                          <SelectItem key={citizenship.id} value={citizenship.id}>
                            {citizenship.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prevViolations"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Previous violations</FormLabel>
                      <FormDescription>
                        Check if the client has had any previous visa violations
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {watchPrevViolations && (
                <FormField
                  control={form.control}
                  name="prevViolationsDesc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Previous violations description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the previous violations..."
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Please provide details about the previous violations
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="isOutsideTheCountry"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Currently outside the country</FormLabel>
                      <FormDescription>
                        Check if the client is currently outside the country
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {watchIsOutsideTheCountry && (
                <FormField
                  control={form.control}
                  name="isOutsideTheCountryAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date left the country</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value || ''}
                          onChange={e => {
                            field.onChange(e.target.value);
                          }}
                          max={format(new Date(), 'yyyy-MM-dd')}
                        />
                      </FormControl>
                      <FormDescription>When did the client leave the country?</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update Client Profile'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/clients/view/${id}`)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditClientPage;
