import ClientCard from '@/components/VisaApplication/ClientCard';
import { Button } from '@/components/ui/button';
import { useMobile } from '@/hooks/use-mobile';

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

import { useState } from 'react';
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
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant={status.variant} className={status.className}>
            {status.icon} {status.text}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[825px] bg-secondary gap-6">
          <DialogHeader>
            <DialogTitle>Draft</DialogTitle>
            <DialogDescription></DialogDescription>
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
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant={status.variant} className={status.className}>
          {status.icon} {status.text}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Draft</DrawerTitle>
          <DrawerDescription></DrawerDescription>
        </DrawerHeader>
        <DraftContent className="px-4" />
        <DrawerFooter className="pt-4">
          <Button onClick={handleEditOrderClick}>Edit order</Button>
          <DrawerClose asChild></DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
