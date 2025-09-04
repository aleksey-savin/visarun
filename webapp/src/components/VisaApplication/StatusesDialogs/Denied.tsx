import { useState, useCallback } from 'react';
import { useMobile } from '@/hooks/use-mobile';

import ClientCard from '@/components/VisaApplication/ClientCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
import { CircleX } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export const DeniedStatusDialog = ({ application }: { application: any }) => {
  const isMobile = useMobile();

  const status = {
    variant: 'default' as const,
    className: 'bg-transparent text-[#FAFAFA]  w-32  hover:bg-gray-800',
    text: 'Denied',
    icon: <CircleX className="text-destructive" />,
    buttonText: 'Move to archive',
    buttonClassname: '',
  };

  const [isOpen, setIsOpen] = useState(false);
  const [clientInformed, setClientInformed] = useState(false);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setClientInformed(false);
    }
  }, []);

  const utils = trpc.useUtils();
  const archiveVisaApplicationMutation = trpc.visaApplication.archive.useMutation({
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

  const DeniedContent = ({ className }: { className?: string }) => (
    <div className={className}>
      <ClientCard
        application={application}
        order={application.orderItem?.order}
        border={'border-destructive'}
      />
      <div className="border border-destructive rounded-lg p-4">{application.denialReason}</div>
    </div>
  );

  if (!isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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
            </DialogHeader>
            <DeniedContent className="flex flex-col gap-4" />
            {!application.isArchived && (
              <>
                <Separator />
                <div className="flex justify-end">
                  <div className="flex gap-4">
                    <div className="flex gap-2 items-center">
                      <Switch
                        checked={clientInformed}
                        onCheckedChange={() => {
                          setClientInformed(!clientInformed);
                        }}
                      />
                      <Label>Client informed</Label>
                    </div>
                    <Button
                      type="submit"
                      disabled={!clientInformed}
                      className={status.buttonClassname}
                      onClick={handleSubmit}
                    >
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
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <form onSubmit={handleSubmit}>
        <DrawerTrigger asChild>
          <Button variant={status.variant} className={status.className}>
            {status.icon} {status.text}
          </Button>
        </DrawerTrigger>
        <MobileDrawerContent>
          <DrawerHeader className="text-left shrink-0">
            <DrawerTitle>
              {!application.isArchived ? 'Update Status' : 'Archived visa application overview'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto">
            <DeniedContent className="flex flex-col gap-4 px-4" />
          </div>
          {!application.isArchived && (
            <DrawerFooter className="pt-4 shrink-0">
              <div className="flex gap-2 items-center mb-2">
                <Switch
                  checked={clientInformed}
                  onCheckedChange={() => {
                    setClientInformed(!clientInformed);
                  }}
                />
                <Label>Client informed</Label>
              </div>
              <Button type="submit" className={status.buttonClassname} onClick={handleSubmit}>
                {status.buttonText}
              </Button>
              <DrawerClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          )}
          {application.isArchived && (
            <DrawerFooter className="pt-4 shrink-0">
              <DrawerClose asChild>
                <Button variant="secondary">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          )}
        </MobileDrawerContent>
      </form>
    </Drawer>
  );
};
