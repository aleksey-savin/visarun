import { useState, useEffect, useMemo } from 'react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { AlertTriangle, CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import type { OrderItem } from '@visarun/backend/node_modules/@prisma/client';

import { Trash2, AlertCircle } from 'lucide-react';

import useOrderStore from '@/stores/order/order-store';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import VisaTypeSelector from '@/components/Order/sections/VisaSection/VisaTypeSelector';
import { formatCurrency } from '@/utils/currency';

const formSchema = z.object({
  entryDate: z.date(),
  entryTime: z.string().optional(),
});

const VisaCard = ({ item }: { item: OrderItem }) => {
  const {
    clients,
    orderItems,
    visaApplications,
    setOrderItems,
    setVisaApplications,
    setSaveStatus,
  } = useOrderStore();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const deleteOrderItemMutation = trpc.orderItem.delete.useMutation();

  const handleDeleteOrderItem = async () => {
    setSaveStatus('saving');
    setOrderItems(orderItems?.filter(i => i.id !== item.id));
    setShowDeleteModal(false);
    await deleteOrderItemMutation.mutateAsync({ id: item.id || '' });

    setSaveStatus('saved');
  };

  const visaApplication = visaApplications.find(va => va.orderItemId === item.id);
  const client = clients.find(c => c.id === item.clientId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entryDate: visaApplication?.plannedCountryEntryDate
        ? new Date(visaApplication.plannedCountryEntryDate)
        : undefined,
      entryTime: visaApplication?.plannedCountryEntryDate
        ? new Date(visaApplication.plannedCountryEntryDate).toTimeString().slice(0, 5)
        : '00:00',
    },
  });

  const [entryDateOpen, setEntryDateOpen] = useState(false);
  const [entryDate, setEntryDate] = useState<Date | undefined>(
    visaApplication?.plannedCountryEntryDate
      ? new Date(visaApplication.plannedCountryEntryDate)
      : undefined
  );
  const [entryTime, setEntryTime] = useState<string>(
    visaApplication?.plannedCountryEntryDate
      ? new Date(visaApplication.plannedCountryEntryDate).toTimeString().slice(0, 5)
      : '00:00'
  );

  const editVisaApplicationMutation = trpc.visaApplication.edit.useMutation();

  const handleEntryDateUpdate = async (selectedDate: Date | undefined) => {
    if (!selectedDate) return;

    setEntryDate(selectedDate);
    setSaveStatus('saving');

    const [hours, minutes] = entryTime.split(':').map(Number);
    const combinedDate = new Date(selectedDate);
    combinedDate.setHours(hours, minutes, 0, 0);
    const dateString = combinedDate.toISOString();

    setVisaApplications(
      visaApplications.map(va =>
        va.orderItemId === item.id ? { ...va, plannedCountryEntryDate: combinedDate } : va
      )
    );

    form.setValue('entryDate', selectedDate);
    setEntryDateOpen(false);

    try {
      await editVisaApplicationMutation.mutateAsync({
        id: visaApplication?.id || '',
        plannedCountryEntryDate: dateString,
      });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  const handleEntryTimeUpdate = async (newTime: string) => {
    setEntryTime(newTime);

    if (!entryDate) return;

    setSaveStatus('saving');

    const [hours, minutes] = newTime.split(':').map(Number);
    const combinedDate = new Date(entryDate);
    combinedDate.setHours(hours, minutes, 0, 0);
    const dateString = combinedDate.toISOString();

    setVisaApplications(
      visaApplications.map(va =>
        va.orderItemId === item.id ? { ...va, plannedCountryEntryDate: combinedDate } : va
      )
    );

    form.setValue('entryTime', newTime);

    try {
      await editVisaApplicationMutation.mutateAsync({
        id: visaApplication?.id || '',
        plannedCountryEntryDate: dateString,
      });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [isVisaFree, setIsVisaFree] = useState(false);
  const [visaFreeStampDuration, setVisaFreeStampDuration] = useState<number | null>(null);

  // Calculate surcharge amount based on client citizenship and visa application country
  const surchargeAmount = useMemo(() => {
    if (
      !client?.citizenship?.surcharges ||
      !visaApplication?.country?.id ||
      !visaApplication?.visaType?.id
    ) {
      return 0;
    }

    // First, try to find a specific surcharge for this visa type
    const specificSurcharge = client.citizenship.surcharges.find(
      surcharge => surcharge.countryId === visaApplication.country.id && !surcharge.isGlobal
      // Note: We'd need visaTypeId in the surcharge object to match specific visa types
      // For now, we'll check isGlobal: false for specific surcharges
    );

    if (specificSurcharge) {
      return specificSurcharge.surchargeAmount;
    }

    // Fall back to global surcharge for this country
    const globalSurcharge = client.citizenship.surcharges.find(
      surcharge => surcharge.countryId === visaApplication.country.id && surcharge.isGlobal
    );

    return globalSurcharge?.surchargeAmount || 0;
  }, [
    client?.citizenship?.surcharges,
    visaApplication?.country?.id,
    visaApplication?.visaType?.id,
  ]);

  useEffect(() => {
    if (visaApplication?.country?.id && client) {
      // Check if blacklisted
      setIsBlacklisted(
        client?.citizenship?.blacklisted?.some(
          blacklistedEntry => blacklistedEntry.countryId === visaApplication?.country?.id
        ) || false
      );

      // Check if visa-free
      const visaFreeEntry = client?.citizenship?.visaFree?.find(
        entry => entry.countryId === visaApplication?.country?.id
      );
      setIsVisaFree(!!visaFreeEntry);
      setVisaFreeStampDuration(visaFreeEntry?.stampDuration || null);
    }
  }, [visaApplication?.country?.id, client?.citizenship]);

  return (
    <Card className="p-3 bg-secondary gap-5">
      <div className="flex justify-between">
        <div className="flex flex-wrap items-start gap-2">
          <Badge variant={isBlacklisted ? 'destructive' : 'accent'}>
            Visa - {visaApplication?.country?.name}
          </Badge>
          {surchargeAmount > 0 && (
            <Badge variant="destructive" className="text-xs">
              Surcharge {formatCurrency(surchargeAmount, 'VND')} is applied
            </Badge>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {!isBlacklisted && (
        <>
          <Form {...form}>
            <div className="flex flex-wrap justify-start items-center">
              <div>
                <Label htmlFor="date-picker" className="mb-2">
                  Entry date
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  <div className="flex flex-col gap-3">
                    <FormField
                      control={form.control}
                      name="entryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Popover open={entryDateOpen} onOpenChange={setEntryDateOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="secondary"
                                  id="date-picker"
                                  className={cn(
                                    'min-w-52 justify-between',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {entryDate ? entryDate.toLocaleDateString() : 'Select date'}
                                  <CalendarIcon />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={entryDate}
                                  captionLayout="dropdown"
                                  onSelect={handleEntryDateUpdate}
                                  disabled={date => {
                                    const yesterday = new Date();
                                    yesterday.setDate(yesterday.getDate() - 1);
                                    return date < yesterday;
                                  }}
                                  startMonth={new Date()}
                                  endMonth={new Date(2100, 11)}
                                />
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <Input
                      type="time"
                      value={entryTime}
                      onChange={e => {
                        handleEntryTimeUpdate(e.target.value);
                      }}
                      className="bg-secondary appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    />
                  </div>
                  {isVisaFree && (
                    <div className="flex items-center ms-2 gap-2">
                      <Badge variant="info" className="text-xs text-secondary">
                        {visaFreeStampDuration
                          ? `${visaFreeStampDuration} days visa free allowed`
                          : ''}
                      </Badge>
                      {entryDate && visaFreeStampDuration && (
                        <Badge variant="destructive" className="text-xs text-secondary">
                          exit by{' '}
                          {new Date(
                            entryDate.getTime() + visaFreeStampDuration * 24 * 60 * 60 * 1000
                          ).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <VisaTypeSelector item={item} />
            </div>
          </Form>
        </>
      )}
      {isBlacklisted && (
        <Card className="text-sm p-3 bg-secondary text-[#FAFAFA]">
          <div className="flex gap-3 items-center">
            <AlertTriangle className="text-destructive" />
            <span>Entry Prohibited - Blacklisted Citizenship</span>
          </div>
        </Card>
      )}
      <Dialog
        open={showDeleteModal}
        onOpenChange={open => {
          if (!open) {
            setShowDeleteModal(false);
          }
        }}
      >
        <DialogContent className="max-w-md bg-secondary">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              Delete Visa Application
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Are you sure you want to delete this visa application? This action cannot be undone
              and will also remove the associated order item from your order.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrderItem}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default VisaCard;
