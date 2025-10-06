import ClientCard from '@/components/VisaApplication/ClientCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';

import { Separator } from '@/components/ui/separator';
import { Copy } from 'lucide-react';
import React, { useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

export const SubmitStatusDialog = ({ application }: { application: any }) => {
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

  const forceViewportUpdate = useCallback(() => {
    // Force viewport height recalculation on mobile
    if (window.visualViewport) {
      window.visualViewport.dispatchEvent(new Event('resize'));
    } else {
      window.dispatchEvent(new Event('resize'));
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
          client={application.orderItem?.client}
          order={application.orderItem?.order}
          orderItem={application.orderItem}
          application={application}
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

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogTrigger asChild>
          <Button variant="default" className="bg-fuchsia-300 w-32 hover:bg-fuchsia-400">
            Submit
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[100dvh] w-full max-w-full sm:max-w-[825px] bg-secondary gap-2 sm:gap-6 flex flex-col overflow-hidden p-2 sm:p-6">
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto flex justify-center">
            <div className="w-full max-w-2xl">
              <SubmitContent className="flex flex-col gap-4 px-2 sm:px-4" />
            </div>
          </div>
          <div className="flex-shrink-0">
            <Separator />
            <div className="flex justify-center sm:justify-end p-2 sm:p-4">
              <div className="flex gap-4 flex-col sm:flex-row w-full sm:w-auto">
                {!cancel && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={handleCancel}
                      className="w-full sm:w-auto"
                    >
                      Cancel order
                    </Button>
                    <Button type="submit" onClick={handleSubmit} className="w-full sm:w-auto">
                      Visa submitted
                    </Button>
                  </>
                )}
                {cancel && (
                  <>
                    <div className="flex gap-2 items-center justify-center sm:justify-start">
                      <Switch
                        checked={refund}
                        onCheckedChange={() => {
                          setRefund(!refund);
                          // Force viewport update after switch toggle
                          setTimeout(forceViewportUpdate, 100);
                        }}
                      />
                      <Label>Refund</Label>
                    </div>
                    <Button
                      variant="destructive"
                      disabled={reason.length === 0}
                      onClick={handleSubmitCancel}
                      className="w-full sm:w-auto"
                    >
                      {refund ? 'Confirm cancellation & refund' : 'Confirm cancellation'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </form>
    </Dialog>
  );
};
