import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import CitizenshipSelect from '@/components/Citizenship/CitizenshipSelect';
import { Plus } from 'lucide-react';

const visaFreeAccessSchema = z.object({
  citizenshipId: z.string().min(1, 'Please select a citizenship'),
  stampDuration: z
    .number()
    .min(1, 'Duration must be at least 1 day')
    .max(365, 'Duration cannot exceed 365 days'),
});

type VisaFreeAccessFormData = z.infer<typeof visaFreeAccessSchema>;

interface VisaFreeAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { citizenshipId: string; stampDuration: number }) => void;
  isSubmitting?: boolean;
}

const VisaFreeAccessDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: VisaFreeAccessDialogProps) => {
  const form = useForm<VisaFreeAccessFormData>({
    resolver: zodResolver(visaFreeAccessSchema),
    defaultValues: {
      citizenshipId: '',
      stampDuration: 30,
    },
  });

  const handleSubmit = (data: VisaFreeAccessFormData) => {
    onSubmit(data);
    form.reset();
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Visa-Free Access</DialogTitle>
          <DialogDescription>
            Grant visa-free access to a citizenship for this country.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="citizenshipId"
              render={({ field }) => (
                <CitizenshipSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  label="Citizenship"
                  placeholder="Select a citizenship"
                />
              )}
            />
            <FormField
              control={form.control}
              name="stampDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stamp Duration (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      {...field}
                      value={field.value || ''}
                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Access'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default VisaFreeAccessDialog;
