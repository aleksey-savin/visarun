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
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { LoaderCircle } from 'lucide-react';
import React, { useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

export const InProcessStatusDialog = ({ application }: { application: any }) => {
  const isMobile = useMobile();

  const stampRequired =
    !application.stampIsRecieved &&
    application?.plannedCountryExitDate &&
    new Date(application?.plannedCountryExitDate || '') < new Date();

  const checkReadiness =
    !application.visaType?.processingValueFixed &&
    application.plannedCountryEntryDate &&
    new Date(application.plannedCountryEntryDate) <= new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

  const status = {
    variant: stampRequired ? ('default' as const) : ('default' as const),
    className: stampRequired
      ? 'w-32'
      : checkReadiness
        ? 'w-32 bg-success hover:bg-success/80'
        : 'bg-warning hover:bg-yellow-400 text-yellow-600 w-32',
    text: stampRequired ? 'Request a stamp' : checkReadiness ? 'Check readiness' : 'In process',
    icon: stampRequired || checkReadiness ? null : <LoaderCircle />,
    buttonText: stampRequired ? 'Stamp recieved' : 'Ready',
    buttonClassname: stampRequired ? '' : 'bg-success hover:bg-success/80',
  };

  const [isOpen, setIsOpen] = useState(false);
  const [clientCardBorder, setClientCardBorder] = useState('border-dashed border-[#FAFAFA]');
  const [denied, setDenied] = useState(false);
  const [reason, setReason] = useState('');

  const utils = trpc.useUtils();
  const updateVisaApplicationStatusMutation = trpc.visaApplication.updateStatus.useMutation({
    onSuccess: () => {
      utils.visaApplication.getAll.invalidate();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updateData: any = {
        id: application.id,
        status: 'awaiting_approval', // Default status
      };

      if (status.buttonText === 'Stamp recieved') {
        // When stamp is received, mark stamp as received
        updateData.stampIsRecieved = true;
      }

      if (status.buttonText === 'Ready') {
        // When ready, set status to approved
        updateData.status = 'approved';
      }

      await updateVisaApplicationStatusMutation.mutateAsync(updateData);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update application status:', error);
    }
  };

  const handleDenied = useCallback(() => {
    setDenied(true);
    setClientCardBorder('border-destructive');
  }, []);

  const handleSubmitDenial = async () => {
    try {
      const updateData: any = {
        id: application.id,
        status: 'denied',
        denialReason: reason,
      };

      await updateVisaApplicationStatusMutation.mutateAsync(updateData);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update application status:', error);
    }
  };

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setDenied(false);
      setClientCardBorder('border-dashed border-[#FAFAFA]');
      setReason('');
    }
  }, []);

  const reasonInputRef = React.useRef<HTMLInputElement>(null);

  const forceViewportUpdate = useCallback(() => {
    // Force viewport height recalculation on mobile
    if (window.visualViewport) {
      window.visualViewport.dispatchEvent(new Event('resize'));
    } else {
      window.dispatchEvent(new Event('resize'));
    }
  }, []);

  const handleReasonChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setReason(e.target.value);
  }, []);

  const InProcessContent = useCallback(
    ({ className }: { className?: string }) => (
      <div className={className}>
        <ClientCard
          application={application}
          order={application.orderItem?.order}
          border={clientCardBorder}
        />
        {denied && (
          <Input
            ref={reasonInputRef}
            placeholder="Reason for denial"
            onChange={handleReasonChange}
            autoComplete="off"
          />
        )}
      </div>
    ),
    [application, clientCardBorder, denied, handleReasonChange]
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
              <DialogTitle>Update Status</DialogTitle>
            </DialogHeader>
            <InProcessContent className="flex flex-col gap-4 px-4" />
            <Separator />
            <div className="flex justify-end">
              <div className="flex gap-4">
                {!denied && (
                  <>
                    <Button variant="destructive" onClick={handleDenied}>
                      Denied
                    </Button>
                    <Button type="submit" className={status.buttonClassname} onClick={handleSubmit}>
                      {status.buttonText}
                    </Button>
                  </>
                )}
                {denied && (
                  <Button disabled={!reason} variant="destructive" onClick={handleSubmitDenial}>
                    Visa denied
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </form>
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
          <DrawerTitle>Update Status</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto">
          <InProcessContent className="flex flex-col gap-4 px-4" />
        </div>
        <DrawerFooter className="pt-4 shrink-0">
          {!denied && (
            <>
              <Button
                className={status.buttonClassname}
                onClick={e => {
                  forceViewportUpdate();
                  handleSubmit(e);
                }}
              >
                {status.buttonText}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  forceViewportUpdate();
                  handleDenied();
                }}
              >
                Denied
              </Button>
              <DrawerClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DrawerClose>
            </>
          )}
          {denied && (
            <>
              <Button
                disabled={!reason}
                variant="destructive"
                onClick={() => {
                  forceViewportUpdate();
                  handleSubmitDenial();
                }}
              >
                Visa denied
              </Button>
              <DrawerClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DrawerClose>
            </>
          )}
        </DrawerFooter>
      </MobileDrawerContent>
    </Drawer>
  );
};
