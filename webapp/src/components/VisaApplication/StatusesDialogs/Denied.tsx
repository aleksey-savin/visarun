import { useState } from 'react';

import ClientCard from '@/components/VisaApplication/ClientCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Separator } from '@/components/ui/separator';
import { CircleX } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export const DeniedStatusDialog = ({ application }: { application: any }) => {
  const status = {
    variant: 'default' as const,
    className: 'bg-transparent text-[#FAFAFA] border-transparent w-32  hover:bg-gray-800',
    text: 'Denied',
    icon: <CircleX className="text-destructive" />,
    buttonText: 'Move to archive',
    buttonClassname: '',
  };

  const [isOpen, setIsOpen] = useState(false);

  const utils = trpc.useUtils();
  const archiveVisaApplicationMutation = trpc.visaApplication.archive.useMutation({
    onSuccess: () => {
      // Invalidate and refetch visa applications query to update the table
      utils.visaApplication.getAll.invalidate();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await archiveVisaApplicationMutation.mutateAsync({
        id: application.id,
        isArchived: true,
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to archive application:', error);
    }
  };

  const [clientInformed, setClientInformed] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <form onSubmit={handleSubmit}>
        <DialogTrigger asChild>
          <Button variant={status.variant} className={status.className}>
            {status.icon} {status.text}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[825px] bg-secondary gap-6">
          <DialogHeader>
            <DialogTitle>
              {!application.isArchived ? 'Update Status' : 'Archived visa application overview'}
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <ClientCard
            application={application}
            order={application.orderItem?.order}
            border={'border-destructive'}
          />
          <div className="border border-destructive rounded-md p-4">{application.denialReason}</div>
          {!application.isArchived && (
            <>
              <Separator />
              <DialogFooter>
                <div className="flex gap-4">
                  <div className="flex gap-2 items-center">
                    <Switch
                      checked={clientInformed}
                      onCheckedChange={() => {
                        setClientInformed(!clientInformed);
                      }}
                    />
                    <Label>Client informed</Label>
                  </div>
                  <Button
                    type="submit"
                    disabled={!clientInformed}
                    className={status.buttonClassname}
                    onClick={handleSubmit}
                  >
                    {status.buttonText}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </form>
    </Dialog>
  );
};
