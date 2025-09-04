import ClientCard from '@/components/VisaApplication/ClientCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

import { MobileDrawerContent } from '@/components/ui/mobile-drawer-content';
import { Input } from '@/components/ui/input';

import { Separator } from '@/components/ui/separator';
import { Copy } from 'lucide-react';
import React, { useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

export const SubmitStatusDialog = ({ application }: { application: any }) => {
  const isMobile = useMobile();

  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [refund, setRefund] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [reason, setReason] = useState('');
  const [clientCardBorder, setClientCardBorder] = useState('border-success');

  const utils = trpc.useUtils();
  const updateVisaApplicationStatusMutation = trpc.visaApplication.updateStatus.useMutation({
    onSuccess: () => {
      utils.visaApplication.getAll.invalidate();
    },
  });

  // Generate visa summary text - you can customize this based on your application data
  const generateVisaSummary = useCallback(() => {
    const date = new Date(application.plannedCountryEntryDate);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const time =
      date.getHours().toString().padStart(2, '0') +
      ':' +
      date.getMinutes().toString().padStart(2, '0');

    const summaryText = `Khai báo và điền mẫu ${application.visaType?.name} gập. Nộp hồ sơ vào ngày ${day} tháng ${month}, lúc ${time}. Kết quả sẽ có vào chiều mai. ${application?.orderItem?.client?.user?.email}`;
    return summaryText;
  }, [
    application.plannedCountryEntryDate,
    application.visaType?.name,
    application?.orderItem?.client?.user?.email,
  ]);

  const handleCopyToClipboard = useCallback(async () => {
    try {
      const summaryText = generateVisaSummary();
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      // Reset copy state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, [generateVisaSummary]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateVisaApplicationStatusMutation.mutateAsync({
        id: application.id,
        status: 'awaiting_approval',
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update application status:', error);
    }
  };

  const handleCancel = useCallback(() => {
    setCancel(true);
    setClientCardBorder('border-destructive');
  }, []);

  const handleSubmitCancel = async () => {
    try {
      const updateData: any = {
        id: application.id,
        status: refund ? 'pending_refund' : 'cancelled',
        cancelReason: reason,
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
      setCancel(false);
      setRefund(false);
      setReason('');
      setClientCardBorder('border-success');
    }
  }, []);

  const reasonInputRef = React.useRef<HTMLInputElement>(null);

  const handleReasonChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setReason(e.target.value);
  }, []);

  const SubmitContent = useCallback(
    ({ className }: { className?: string }) => (
      <div className={className}>
        <ClientCard
          application={application}
          order={application.orderItem?.order}
          border={clientCardBorder}
        />
        {!cancel && (
          <div className="flex flex-col gap-2">
            <Label>Visa summary</Label>
            <Card className="bg-secondary p-3">
              <div className="flex items-center gap-2">
                <div className="text-sm text-[#A1A1AA] flex-1">{generateVisaSummary()}</div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCopyToClipboard}
                  className={`transition-all duration-200 shrink-0 ${
                    copied
                      ? 'bg-green-500/20 text-green-300 hover:bg-green-500/20'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                >
                  Copy <Copy className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
        )}
        {cancel && (
          <Input
            ref={reasonInputRef}
            placeholder="Reason for cancellation"
            onChange={handleReasonChange}
            autoComplete="off"
          />
        )}
      </div>
    ),
    [
      application,
      clientCardBorder,
      cancel,
      generateVisaSummary,
      copied,
      handleCopyToClipboard,
      handleReasonChange,
    ]
  );

  if (!isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <form onSubmit={handleSubmit}>
          <DialogTrigger asChild>
            <Button variant="default" className="bg-fuchsia-300 w-32 hover:bg-fuchsia-400">
              Submit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[825px] bg-secondary gap-6">
            <DialogHeader>
              <DialogTitle>Update Status</DialogTitle>
              <DialogDescription></DialogDescription>
            </DialogHeader>
            <SubmitContent className="flex flex-col gap-4 px-4" />
            <Separator />
            <div className="flex justify-end">
              <div className="flex gap-4">
                {!cancel && (
                  <>
                    <Button variant="destructive" onClick={handleCancel}>
                      Cancel order
                    </Button>
                    <Button type="submit" onClick={handleSubmit}>
                      Visa submitted
                    </Button>
                  </>
                )}
                {cancel && (
                  <>
                    <div className="flex gap-2 items-center">
                      <Switch
                        checked={refund}
                        onCheckedChange={() => {
                          setRefund(!refund);
                        }}
                      />
                      <Label>Refund</Label>
                    </div>
                    <Button
                      variant="destructive"
                      disabled={reason.length === 0}
                      onClick={handleSubmitCancel}
                    >
                      {refund ? 'Confirm cancellation & refund' : 'Confirm cancellation'}
                    </Button>
                  </>
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
        <Button variant="default" className="bg-fuchsia-300 w-32 hover:bg-fuchsia-400">
          Submit
        </Button>
      </DrawerTrigger>
      <MobileDrawerContent>
        <DrawerHeader className="text-left shrink-0">
          <DrawerTitle>Update Status</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto">
          <SubmitContent className="flex flex-col gap-4 px-4" />
        </div>
        <DrawerFooter className="pt-4 shrink-0">
          {!cancel && (
            <>
              <Button onClick={handleSubmit}>Visa submitted</Button>
              <Button variant="destructive" onClick={handleCancel}>
                Cancel order
              </Button>
              <DrawerClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DrawerClose>
            </>
          )}
          {cancel && (
            <>
              <div className="flex gap-2 items-center mb-2">
                <Switch
                  checked={refund}
                  onCheckedChange={() => {
                    setRefund(!refund);
                  }}
                />
                <Label>Refund</Label>
              </div>
              <Button
                variant="destructive"
                disabled={reason.length === 0}
                onClick={handleSubmitCancel}
              >
                {refund ? 'Confirm cancellation & refund' : 'Confirm cancellation'}
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
