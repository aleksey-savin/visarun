import { useState } from 'react';

import ClientCard from '@/components/VisaApplication/ClientCard';
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

import { Separator } from '@/components/ui/separator';
import { CircleX } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export const CancelledStatusDialog = ({ application }: { application: any }) => {
  const status = {
    variant: 'default' as const,
    className: 'bg-transparent text-[#FAFAFA] border-transparent w-32  hover:bg-gray-800',
    text: 'Cancelled',
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

  const updateVisaApplicationStatusMutation = trpc.visaApplication.updateStatus.useMutation({
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

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateVisaApplicationStatusMutation.mutateAsync({
        id: application.id,
        status: 'pending_refund',
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update application status:', error);
    }
  };

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
          <div className="border border-destructive rounded-md p-4">{application.cancelReason}</div>
          {!application.isArchived && (
            <>
              <Separator />
              <DialogFooter>
                <div className="flex gap-4">
                  <Button variant="destructive" onClick={handleRefund}>
                    Refund
                  </Button>
                  <Button type="submit" className={status.buttonClassname} onClick={handleSubmit}>
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
