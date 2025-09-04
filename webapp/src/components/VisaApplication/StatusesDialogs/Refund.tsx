import ClientCard from '@/components/VisaApplication/ClientCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMobile } from '@/hooks/use-mobile';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import {
  Drawer,
  DrawerClose,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

import { MobileDrawerContent } from '@/components/ui/mobile-drawer-content';

import { Separator } from '@/components/ui/separator';

import { useState, useCallback } from 'react';

export const RefundStatusDialog = ({ application }: { application: any }) => {
  const isMobile = useMobile();

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
        application={application}
        order={application.orderItem?.order}
        border="border-destructive"
      />
    </div>
  );

  if (!isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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
          </DialogHeader>
          <RefundContent />
          <Separator />
          <div className="flex justify-end">
            <Button onClick={handleRefundSubmit} variant="destructive">
              Refunded
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        <Button variant={status.variant} className={status.className}>
          {status.icon} {status.text}
        </Button>
      </DrawerTrigger>
      <MobileDrawerContent>
        <DrawerHeader className="text-left shrink-0">
          <DrawerTitle className="flex gap-2 items-center flex-wrap">
            <span>Refund</span>
            <Badge variant="destructive">{application.cancelReason}</Badge>
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto">
          <RefundContent className="px-4" />
        </div>
        <DrawerFooter className="pt-4 shrink-0">
          <Button onClick={handleRefundSubmit} variant="destructive">
            Refunded
          </Button>
          <DrawerClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </MobileDrawerContent>
    </Drawer>
  );
};
