import { useState, useCallback } from 'react';

import ClientCard from '@/components/VisaApplication/ClientCard';
import { Button } from '@/components/ui/button';

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
    className: 'bg-transparent text-[#FAFAFA] w-32  hover:bg-gray-800',
    text: 'Cancelled',
    icon: <CircleX className="text-destructive" />,
    buttonText: 'Move to archive',
    buttonClassname: '',
  };

  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

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

  const CancelledContent = ({ className }: { className?: string }) => (
    <div className={className}>
      <ClientCard
        client={application.orderItem?.client}
        order={application.orderItem?.order}
        orderItem={application.orderItem}
        application={application}
        border={'border-destructive'}
      />
      <div className="border border-destructive rounded-md p-4">{application.cancelReason}</div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogTrigger asChild>
          <Button variant={status.variant} className={status.className}>
            {status.icon} {status.text}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[100dvh] w-full max-w-full sm:max-w-[825px] bg-secondary gap-2 sm:gap-6 flex flex-col overflow-hidden p-2 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {!application.isArchived ? 'Update Status' : 'Archived visa application overview'}
            </DialogTitle>
            <DialogDescription>
              {!application.isArchived
                ? 'Review and update the cancelled application status'
                : 'View details of this archived cancelled application'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto flex justify-center">
            <div className="w-full max-w-2xl">
              <CancelledContent className="flex flex-col gap-4 px-2 sm:px-4" />
            </div>
          </div>
          {!application.isArchived && (
            <div className="flex-shrink-0">
              <Separator />
              <div className="flex justify-center sm:justify-end p-2 sm:p-4">
                <div className="flex gap-4 flex-col sm:flex-row w-full sm:w-auto">
                  <Button variant="destructive" onClick={handleRefund} className="w-full sm:w-auto">
                    Refund
                  </Button>
                  <Button
                    type="submit"
                    className={`${status.buttonClassname} w-full sm:w-auto`}
                    onClick={handleSubmit}
                  >
                    {status.buttonText}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </form>
    </Dialog>
  );
};
