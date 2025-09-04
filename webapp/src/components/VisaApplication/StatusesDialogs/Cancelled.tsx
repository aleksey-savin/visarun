import { useState } from 'react';
import { useMobile } from '@/hooks/use-mobile';

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

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

import { Separator } from '@/components/ui/separator';
import { CircleX } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export const CancelledStatusDialog = ({ application }: { application: any }) => {
  const isMobile = useMobile();

  const status = {
    variant: 'default' as const,
    className: 'bg-transparent text-[#FAFAFA] w-32  hover:bg-gray-800',
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

  const CancelledContent = ({ className }: { className?: string }) => (
    <div className={className}>
      <ClientCard
        application={application}
        order={application.orderItem?.order}
        border={'border-destructive'}
      />
      <div className="border border-destructive rounded-md p-4">{application.cancelReason}</div>
    </div>
  );

  if (!isMobile) {
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
            <CancelledContent />
            {!application.isArchived && (
              <>
                <Separator />
                <div className="flex justify-end">
                  <div className="flex gap-4">
                    <Button variant="destructive" onClick={handleRefund}>
                      Refund
                    </Button>
                    <Button type="submit" className={status.buttonClassname} onClick={handleSubmit}>
                      {status.buttonText}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </form>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <form onSubmit={handleSubmit}>
        <DrawerTrigger asChild>
          <Button variant={status.variant} className={status.className}>
            {status.icon} {status.text}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>
              {!application.isArchived ? 'Update Status' : 'Archived visa application overview'}
            </DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>
          <CancelledContent className="px-4" />
          {!application.isArchived && (
            <>
              <DrawerFooter className="pt-4">
                <Button variant="destructive" onClick={handleRefund}>
                  Refund
                </Button>
                <Button type="submit" className={status.buttonClassname} onClick={handleSubmit}>
                  {status.buttonText}
                </Button>
                <DrawerClose asChild></DrawerClose>
              </DrawerFooter>
            </>
          )}
          {application.isArchived && (
            <DrawerFooter className="pt-2">
              <DrawerClose asChild>
                <Button variant="secondary">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          )}
        </DrawerContent>
      </form>
    </Drawer>
  );
};
