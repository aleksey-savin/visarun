import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Card, CardContent } from '@/components/ui/card';
import { Save, X } from 'lucide-react';
import { contactMethodSchema, ContactMethodFormData } from '@/lib/schemas/contactMethod';

interface ContactMethodFormProps {
  initialData?: Partial<ContactMethodFormData>;
  onSubmit: (data: ContactMethodFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
  title: string;
}

export function ContactMethodForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitButtonText = 'Save',
  title,
}: ContactMethodFormProps) {
  const form = useForm<ContactMethodFormData>({
    resolver: zodResolver(contactMethodSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      icon: initialData?.icon || '',
    },
  });

  const handleSubmit = (data: ContactMethodFormData) => {
    onSubmit(data);
  };

  return (
    <div className="container p-6 space-y-8">
      <div className="flex items-center gap-3">
        <h1 className="text-4xl font-bold">{title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-secondary">
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            className="max-w-52"
                            placeholder="Enter contact method name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter description (optional)"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon</FormLabel>
                        <FormControl>
                          <Input placeholder="SVG Code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4 pt-4 justify-end">
                    <Button type="button" variant="secondary" onClick={onCancel}>
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      <Save className="h-4 w-4" />
                      {isSubmitting ? 'Saving...' : submitButtonText}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
