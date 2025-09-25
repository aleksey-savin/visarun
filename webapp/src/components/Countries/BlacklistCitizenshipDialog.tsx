import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormField } from '@/components/ui/form';
import CitizenshipSelect from '@/components/Citizenship/CitizenshipSelect';
import { Plus } from 'lucide-react';

const blacklistCitizenshipSchema = z.object({
  citizenshipId: z.string().min(1, 'Please select a citizenship'),
});

type BlacklistCitizenshipFormData = z.infer<typeof blacklistCitizenshipSchema>;

interface BlacklistCitizenshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { citizenshipId: string }) => void;
  isSubmitting?: boolean;
}

const BlacklistCitizenshipDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: BlacklistCitizenshipDialogProps) => {
  const form = useForm<BlacklistCitizenshipFormData>({
    resolver: zodResolver(blacklistCitizenshipSchema),
    defaultValues: {
      citizenshipId: '',
    },
  });

  const handleSubmit = (data: BlacklistCitizenshipFormData) => {
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
          <DialogTitle>Add Blacklisted Citizenship</DialogTitle>
          <DialogDescription>Restrict access for a citizenship to this country.</DialogDescription>
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
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add to Blacklist'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BlacklistCitizenshipDialog;
