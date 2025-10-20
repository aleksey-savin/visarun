import ClientCard from '@/components/VisaApplication/ClientCard';
import { Badge } from '@/components/ui/badge';
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

import { useState, useCallback } from 'react';

export const RefundStatusDialog = ({ application }: { application: any }) => {
  const status = {
    variant: 'destructive' as const,
    className: 'w-32',
    text: 'Refund',
    icon: null,
  };

  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  const handleRefundSubmit = () => {
    return;
  };

  const RefundContent = ({ className }: { className?: string }) => (
    <div className={className}>
      <ClientCard
        client={application.orderItem?.client}
        order={application.orderItem?.order}
        orderItem={application.orderItem}
        application={application}
        border="border-destructive"
      />
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={status.variant} className={status.className}>
          {status.icon} {status.text}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[100dvh] w-full max-w-full sm:max-w-[825px] bg-secondary gap-2 sm:gap-6 flex flex-col overflow-hidden p-2 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex gap-4 items-center">
            <span>Refund</span>
            <Badge variant="destructive">{application.cancelReason}</Badge>
          </DialogTitle>
          <DialogDescription>Process refund for this cancelled visa application</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto flex justify-center">
          <div className="w-full max-w-2xl">
            <RefundContent className="px-2 sm:px-4" />
          </div>
        </div>
        <div className="flex-shrink-0">
          <Separator />
          <div className="flex justify-center sm:justify-end p-2 sm:p-4">
            <Button onClick={handleRefundSubmit} variant="destructive" className="w-full sm:w-auto">
              Refunded
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
