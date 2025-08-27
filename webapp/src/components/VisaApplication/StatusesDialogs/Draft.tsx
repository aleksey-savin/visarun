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

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEditOrderRoute } from '@/lib/routes';

export const DraftStatusDialog = ({ application }: { application: any }) => {
  const navigate = useNavigate();

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
        <ClientCard application={application} order={application.orderItem?.order} />
        <Separator />
        <DialogFooter>
          <Button onClick={handleEditOrderClick}>Edit order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
