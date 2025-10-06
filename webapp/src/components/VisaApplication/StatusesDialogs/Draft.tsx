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

import { useState, useCallback } from 'react';
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
      <ClientCard
        client={application.orderItem?.client}
        order={application.orderItem?.order}
        orderItem={application.orderItem}
        application={application}
      />
      <Separator />
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
          <DialogTitle>Draft</DialogTitle>
          <DialogDescription>Review and edit this draft visa application</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto flex justify-center">
          <div className="w-full max-w-2xl">
            <DraftContent />
          </div>
        </div>
        <div className="flex justify-center sm:justify-end flex-shrink-0 p-2 sm:p-4">
          <Button onClick={handleEditOrderClick} className="w-full sm:w-auto">
            Edit order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
