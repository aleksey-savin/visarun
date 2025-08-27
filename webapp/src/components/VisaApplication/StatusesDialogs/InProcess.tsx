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
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Input } from '@/components/ui/input';

export const InProcessStatusDialog = ({ application }: { application: any }) => {
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

  const utils = trpc.useUtils();
  const updateVisaApplicationStatusMutation = trpc.visaApplication.updateStatus.useMutation({
    onSuccess: () => {
      // Invalidate and refetch visa applications query to update the table
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

  const [denied, setDenied] = useState(false);
  const [reason, setReason] = useState('');

  const handleDenied = () => {
    setDenied(true);
    setClientCardBorder('border-destructive');
  };

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

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        setIsOpen(open);
        if (!open) {
          // Reset all state when dialog closes
          setDenied(false);
          setClientCardBorder('border-dashed border-[#FAFAFA]');
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTrigger asChild>
          <Button variant={status.variant} className={status.className}>
            {status.icon} {status.text}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[825px] bg-secondary gap-6">
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <ClientCard
            application={application}
            order={application.orderItem?.order}
            border={clientCardBorder}
          />
          {denied && (
            <>
              <Input
                placeholder="Reason for denial"
                onChange={e => {
                  setReason(e.target.value);
                }}
              />
            </>
          )}
          <Separator />
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};
