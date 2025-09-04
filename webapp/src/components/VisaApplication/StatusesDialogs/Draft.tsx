import ClientCard from '@/components/VisaApplication/ClientCard';
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
import { useNavigate } from 'react-router-dom';
import { getEditOrderRoute } from '@/lib/routes';

export const DraftStatusDialog = ({ application }: { application: any }) => {
  const navigate = useNavigate();
  const isMobile = useMobile();

  const status = {
    variant: 'default' as const,
    className: 'w-32',
    text: 'Draft',
    icon: null,
  };

  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  const handleEditOrderClick = () => {
    const orderId = application.orderItem?.order?.id;
    if (orderId) {
      navigate(getEditOrderRoute({ id: orderId }));
    }
  };

  const DraftContent = ({ className }: { className?: string }) => (
    <div className={className}>
      <ClientCard application={application} order={application.orderItem?.order} />
      <Separator />
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
            <DialogTitle>Draft</DialogTitle>
          </DialogHeader>
          <DraftContent />
          <div className="flex justify-end">
            <Button onClick={handleEditOrderClick}>Edit order</Button>
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
          <DrawerTitle>Draft</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto">
          <DraftContent className="px-4" />
        </div>
        <DrawerFooter className="pt-4 shrink-0">
          <Button onClick={handleEditOrderClick}>Edit order</Button>
          <DrawerClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </MobileDrawerContent>
    </Drawer>
  );
};
