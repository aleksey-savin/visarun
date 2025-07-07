import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '../../lib/trpcProvider';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';

import { toast } from 'sonner';
import { format } from 'date-fns';

const clientProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  citizenshipId: z.string().optional(),
  prevViolations: z.boolean().optional().default(false),
  prevViolationsDesc: z.string().optional(),
  isOutsideTheCountry: z.boolean().optional().default(false),
  isOutsideTheCountryAt: z.string().optional(),
});

type ClientProfileFormData = {
  firstName: string;
  lastName: string;
  citizenshipId?: string;
  prevViolations?: boolean;
  prevViolationsDesc?: string;
  isOutsideTheCountry?: boolean;
  isOutsideTheCountryAt?: string;
};

interface ClientProfileFormProps {
  userId: string;
  onSuccess?: (clientId: string) => void;
  onCancel?: () => void;
}

export const ClientProfileForm = ({ userId, onSuccess, onCancel }: ClientProfileFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClientProfileFormData>({
    resolver: zodResolver(clientProfileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      citizenshipId: undefined,
      prevViolations: false,
      prevViolationsDesc: undefined,
      isOutsideTheCountry: false,
      isOutsideTheCountryAt: '',
    },
  });

  // Get citizenships for dropdown
  const { data: citizenshipsData } = trpc.citizenship.getAll.useQuery({});

  // Create client mutation
  const createClientMutation = trpc.client.create.useMutation({
    onSuccess: data => {
      toast.success('Client profile created successfully');
      if (onSuccess) {
        onSuccess(data.client.id);
      }
    },
    onError: error => {
      toast.error('Failed to create client profile', {
        description: error.message,
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: ClientProfileFormData) => {
    setIsSubmitting(true);

    const isOutsideTheCountryAt = data.isOutsideTheCountryAt
      ? new Date(data.isOutsideTheCountryAt + 'T00:00:00')
      : undefined;

    createClientMutation.mutate({
      userId,
      firstName: data.firstName,
      lastName: data.lastName,
      citizenshipId: data.citizenshipId,
      prevViolations: data.prevViolations ?? false,
      prevViolationsDesc: data.prevViolationsDesc,
      isOutsideTheCountry: data.isOutsideTheCountry ?? false,
      isOutsideTheCountryAt,
    });
  };

  const watchPrevViolations = form.watch('prevViolations');
  const watchIsOutsideTheCountry = form.watch('isOutsideTheCountry');

  return (
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select citizenship" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
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
                  <Textarea placeholder="Describe the previous violations..." {...field} />
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
            {isSubmitting ? 'Creating...' : 'Create Client Profile'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};
