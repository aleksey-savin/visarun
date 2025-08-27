import ClientCard from '@/components/VisaApplication/ClientCard';
import { Badge } from '@/components/ui/badge';
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

import { useState } from 'react';

export const RefundStatusDialog = ({ application }: { application: any }) => {
  const status = {
    variant: 'destructive' as const,
    className: 'w-32',
    text: 'Refund',
    icon: null,
  };

  const [isOpen, setIsOpen] = useState(false);

  const handleRefundSubmit = () => {
    return;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={status.variant} className={status.className}>
          {status.icon} {status.text}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[825px] bg-secondary gap-6">
        <DialogHeader>
          <DialogTitle className="flex gap-4 items-center">
            <span>Refund</span>
            <Badge variant="destructive">{application.cancelReason}</Badge>
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <ClientCard
          application={application}
          order={application.orderItem?.order}
          border="border-destructive"
        />
        <Separator />
        <DialogFooter>
          <Button onClick={handleRefundSubmit} variant="destructive">
            Refunded
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
