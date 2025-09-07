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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
import { Switch } from '@/components/ui/switch';
import { calculatePlannedCompletionDate } from '@/utils/visa-completion-calculator';

const formSchema = z.object({
  entryDate: z.date().optional(),
  entryTime: z.string().optional(),
  exitDate: z.date().optional(),
  exitTime: z.string().optional(),
  completionDate: z.date().optional(),
  completionTime: z.string().optional(),
  stampUntilDate: z.date().optional(),
  stampUntilTime: z.string().optional(),
  clientIsInTheCountry: z.boolean().optional(),
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

    setVisaApplications(visaApplications?.filter(va => va.orderItemId !== item.id));
    setOrderItems(orderItems?.filter(i => i.id !== item.id));

    await deleteOrderItemMutation.mutateAsync({ id: item.id || '' });

    setShowDeleteModal(false);

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
      exitDate: visaApplication?.plannedCountryExitDate
        ? new Date(visaApplication.plannedCountryExitDate)
        : undefined,
      exitTime: visaApplication?.plannedCountryExitDate
        ? new Date(visaApplication.plannedCountryExitDate).toTimeString().slice(0, 5)
        : '00:00',
      completionDate: visaApplication?.plannedCompletionDate
        ? new Date(visaApplication.plannedCompletionDate)
        : undefined,
      completionTime: visaApplication?.plannedCompletionDate
        ? new Date(visaApplication.plannedCompletionDate).toTimeString().slice(0, 5)
        : '00:00',
      stampUntilDate: visaApplication?.stampUntilDate
        ? new Date(visaApplication.stampUntilDate)
        : undefined,
      stampUntilTime: visaApplication?.stampUntilDate
        ? new Date(visaApplication.stampUntilDate).toTimeString().slice(0, 5)
        : '00:00',
    },
  });

  // Visa entry date and time
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

  // Visa exit date and time
  const [exitDateOpen, setExitDateOpen] = useState(false);
  const [exitDate, setExitDate] = useState<Date | undefined>(
    visaApplication?.plannedCountryExitDate
      ? new Date(visaApplication.plannedCountryExitDate)
      : undefined
  );
  const [exitTime, setExitTime] = useState<string>(
    visaApplication?.plannedCountryExitDate
      ? new Date(visaApplication.plannedCountryExitDate).toTimeString().slice(0, 5)
      : '00:00'
  );

  const handleExitDateUpdate = async (selectedDate: Date | undefined) => {
    if (!selectedDate) return;

    setExitDate(selectedDate);
    setSaveStatus('saving');

    const [hours, minutes] = exitTime.split(':').map(Number);
    const combinedDate = new Date(selectedDate);
    combinedDate.setHours(hours, minutes, 0, 0);
    const dateString = combinedDate.toISOString();

    // Also update stamp until date to the same value
    setStampUntilDate(combinedDate);
    setStampUntilTime(
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    );

    // Calculate planned completion date
    const plannedCompletionDate = calculatePlannedCompletionDate(
      visaApplication?.visaType &&
        visaApplication.visaType.processingMode &&
        visaApplication.visaType.processingUnit
        ? {
            processingMode: visaApplication.visaType.processingMode,
            processingUnit: visaApplication.visaType.processingUnit,
            processingValueFixed: visaApplication.visaType.processingValueFixed,
            processingValueMax: visaApplication.visaType.processingValueMax,
          }
        : null,
      combinedDate,
      visaApplication?.clientIsInTheCountry || false,
      visaApplication?.createdAt ? new Date(visaApplication.createdAt) : null
    );

    const updatedApplication: any = {
      ...visaApplication,
      plannedCountryExitDate: combinedDate,
      stampUntilDate: combinedDate,
      ...(plannedCompletionDate && { plannedCompletionDate }),
    };

    setVisaApplications(
      visaApplications.map(va => (va.orderItemId === item.id ? updatedApplication : va))
    );

    // Update completion date state if calculated
    if (plannedCompletionDate) {
      setCompletionDate(plannedCompletionDate);
      setCompletionTime(plannedCompletionDate.toTimeString().slice(0, 5));
      form.setValue('completionDate', plannedCompletionDate);
      form.setValue('completionTime', plannedCompletionDate.toTimeString().slice(0, 5));
    }

    form.setValue('exitDate', selectedDate);
    form.setValue('stampUntilDate', combinedDate);
    form.setValue(
      'stampUntilTime',
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    );
    setExitDateOpen(false);

    try {
      const mutationData: any = {
        id: visaApplication?.id || '',
        plannedCountryExitDate: dateString,
        stampUntilDate: dateString,
      };

      if (plannedCompletionDate) {
        mutationData.plannedCompletionDate = plannedCompletionDate.toISOString();
      }

      await editVisaApplicationMutation.mutateAsync(mutationData);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  const handleExitTimeUpdate = async (newTime: string) => {
    setExitTime(newTime);

    if (!exitDate) return;

    setSaveStatus('saving');

    const [hours, minutes] = newTime.split(':').map(Number);
    const combinedDate = new Date(exitDate);
    combinedDate.setHours(hours, minutes, 0, 0);
    const dateString = combinedDate.toISOString();

    // Also update stamp until date to the same value
    setStampUntilDate(combinedDate);
    setStampUntilTime(newTime);

    // Calculate planned completion date
    const plannedCompletionDate = calculatePlannedCompletionDate(
      visaApplication?.visaType &&
        visaApplication.visaType.processingMode &&
        visaApplication.visaType.processingUnit
        ? {
            processingMode: visaApplication.visaType.processingMode,
            processingUnit: visaApplication.visaType.processingUnit,
            processingValueFixed: visaApplication.visaType.processingValueFixed,
            processingValueMax: visaApplication.visaType.processingValueMax,
          }
        : null,
      combinedDate,
      visaApplication?.clientIsInTheCountry || false,
      visaApplication?.createdAt ? new Date(visaApplication.createdAt) : null
    );

    const updatedApplication: any = {
      ...visaApplication,
      plannedCountryExitDate: combinedDate,
      stampUntilDate: combinedDate,
      ...(plannedCompletionDate && { plannedCompletionDate }),
    };

    setVisaApplications(
      visaApplications.map(va => (va.orderItemId === item.id ? updatedApplication : va))
    );

    // Update completion date state if calculated
    if (plannedCompletionDate) {
      setCompletionDate(plannedCompletionDate);
      setCompletionTime(plannedCompletionDate.toTimeString().slice(0, 5));
      form.setValue('completionDate', plannedCompletionDate);
      form.setValue('completionTime', plannedCompletionDate.toTimeString().slice(0, 5));
    }

    form.setValue('exitTime', newTime);
    form.setValue('stampUntilDate', combinedDate);
    form.setValue('stampUntilTime', newTime);

    try {
      const mutationData: any = {
        id: visaApplication?.id || '',
        plannedCountryExitDate: dateString,
        stampUntilDate: dateString,
      };

      if (plannedCompletionDate) {
        mutationData.plannedCompletionDate = plannedCompletionDate.toISOString();
      }

      await editVisaApplicationMutation.mutateAsync(mutationData);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  // Visa completion date and time
  const [completionDateOpen, setCompletionDateOpen] = useState(false);
  const [completionDate, setCompletionDate] = useState<Date | undefined>(
    visaApplication?.plannedCompletionDate
      ? new Date(visaApplication.plannedCompletionDate)
      : undefined
  );
  const [completionTime, setCompletionTime] = useState<string>(
    visaApplication?.plannedCompletionDate
      ? new Date(visaApplication.plannedCompletionDate).toTimeString().slice(0, 5)
      : '00:00'
  );

  const handleCompletionDateUpdate = async (selectedDate: Date | undefined) => {
    if (!selectedDate) return;

    setCompletionDate(selectedDate);
    setSaveStatus('saving');

    const [hours, minutes] = completionTime.split(':').map(Number);
    const combinedDate = new Date(selectedDate);
    combinedDate.setHours(hours, minutes, 0, 0);
    const dateString = combinedDate.toISOString();

    setVisaApplications(
      visaApplications.map(va =>
        va.orderItemId === item.id ? { ...va, plannedCompletionDate: combinedDate } : va
      )
    );

    form.setValue('completionDate', selectedDate);
    setCompletionDateOpen(false);

    try {
      await editVisaApplicationMutation.mutateAsync({
        id: visaApplication?.id || '',
        plannedCompletionDate: dateString,
      });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  const handleCompletionTimeUpdate = async (newTime: string) => {
    setCompletionTime(newTime);

    if (!completionDate) return;

    setSaveStatus('saving');

    const [hours, minutes] = newTime.split(':').map(Number);
    const combinedDate = new Date(completionDate);
    combinedDate.setHours(hours, minutes, 0, 0);
    const dateString = combinedDate.toISOString();

    setVisaApplications(
      visaApplications.map(va =>
        va.orderItemId === item.id ? { ...va, plannedCompletionDate: combinedDate } : va
      )
    );

    form.setValue('completionTime', newTime);

    try {
      await editVisaApplicationMutation.mutateAsync({
        id: visaApplication?.id || '',
        plannedCompletionDate: dateString,
      });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  // Stamp until` date and time
  const [stampUntilDateOpen, setStampUntilDateOpen] = useState(false);
  const [stampUntilDate, setStampUntilDate] = useState<Date | undefined>(
    visaApplication?.stampUntilDate ? new Date(visaApplication.stampUntilDate) : undefined
  );
  const [stampUntilTime, setStampUntilTime] = useState<string>(
    visaApplication?.stampUntilDate
      ? new Date(visaApplication.stampUntilDate).toTimeString().slice(0, 5)
      : '00:00'
  );

  const handleStampUntilDateUpdate = async (selectedDate: Date | undefined) => {
    if (!selectedDate) return;

    setStampUntilDate(selectedDate);
    setSaveStatus('saving');

    const [hours, minutes] = stampUntilTime.split(':').map(Number);
    const combinedDate = new Date(selectedDate);
    combinedDate.setHours(hours, minutes, 0, 0);
    const dateString = combinedDate.toISOString();

    // Calculate planned completion date
    const plannedCompletionDate = calculatePlannedCompletionDate(
      visaApplication?.visaType &&
        visaApplication.visaType.processingMode &&
        visaApplication.visaType.processingUnit
        ? {
            processingMode: visaApplication.visaType.processingMode,
            processingUnit: visaApplication.visaType.processingUnit,
            processingValueFixed: visaApplication.visaType.processingValueFixed,
            processingValueMax: visaApplication.visaType.processingValueMax,
          }
        : null,
      combinedDate,
      visaApplication?.clientIsInTheCountry || false,
      visaApplication?.createdAt ? new Date(visaApplication.createdAt) : null
    );

    const updatedApplication: any = {
      ...visaApplication,
      stampUntilDate: combinedDate,
      ...(plannedCompletionDate && { plannedCompletionDate }),
    };

    setVisaApplications(
      visaApplications.map(va => (va.orderItemId === item.id ? updatedApplication : va))
    );

    // Update completion date state if calculated
    if (plannedCompletionDate) {
      setCompletionDate(plannedCompletionDate);
      setCompletionTime(plannedCompletionDate.toTimeString().slice(0, 5));
      form.setValue('completionDate', plannedCompletionDate);
      form.setValue('completionTime', plannedCompletionDate.toTimeString().slice(0, 5));
    }

    form.setValue('stampUntilDate', selectedDate);
    setStampUntilDateOpen(false);

    try {
      const mutationData: any = {
        id: visaApplication?.id || '',
        stampUntilDate: dateString,
      };

      if (plannedCompletionDate) {
        mutationData.plannedCompletionDate = plannedCompletionDate.toISOString();
      }

      await editVisaApplicationMutation.mutateAsync(mutationData);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  const handleStampUntilTimeUpdate = async (newTime: string) => {
    setStampUntilTime(newTime);

    if (!stampUntilDate) return;

    setSaveStatus('saving');

    const [hours, minutes] = newTime.split(':').map(Number);
    const combinedDate = new Date(stampUntilDate);
    combinedDate.setHours(hours, minutes, 0, 0);
    const dateString = combinedDate.toISOString();

    // Calculate planned completion date
    const plannedCompletionDate = calculatePlannedCompletionDate(
      visaApplication?.visaType &&
        visaApplication.visaType.processingMode &&
        visaApplication.visaType.processingUnit
        ? {
            processingMode: visaApplication.visaType.processingMode,
            processingUnit: visaApplication.visaType.processingUnit,
            processingValueFixed: visaApplication.visaType.processingValueFixed,
            processingValueMax: visaApplication.visaType.processingValueMax,
          }
        : null,
      combinedDate,
      visaApplication?.clientIsInTheCountry || false,
      visaApplication?.createdAt ? new Date(visaApplication.createdAt) : null
    );

    const updatedApplication: any = {
      ...visaApplication,
      stampUntilDate: combinedDate,
      ...(plannedCompletionDate && { plannedCompletionDate }),
    };

    setVisaApplications(
      visaApplications.map(va => (va.orderItemId === item.id ? updatedApplication : va))
    );

    // Update completion date state if calculated
    if (plannedCompletionDate) {
      setCompletionDate(plannedCompletionDate);
      setCompletionTime(plannedCompletionDate.toTimeString().slice(0, 5));
      form.setValue('completionDate', plannedCompletionDate);
      form.setValue('completionTime', plannedCompletionDate.toTimeString().slice(0, 5));
    }

    form.setValue('stampUntilTime', newTime);

    try {
      const mutationData: any = {
        id: visaApplication?.id || '',
        stampUntilDate: dateString,
      };

      if (plannedCompletionDate) {
        mutationData.plannedCompletionDate = plannedCompletionDate.toISOString();
      }

      await editVisaApplicationMutation.mutateAsync(mutationData);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  const [clientIsInTheCountry, setClientIsInTheCountry] = useState(
    visaApplication?.clientIsInTheCountry || false
  );

  const handleClientIsInTheCountry = async (clientIsInTheCountry: boolean) => {
    setSaveStatus('saving');

    setClientIsInTheCountry(clientIsInTheCountry);

    if (!visaApplication?.id) {
      setSaveStatus('error');
      return;
    }

    // Calculate planned completion date when client status changes
    const plannedCompletionDate = calculatePlannedCompletionDate(
      visaApplication?.visaType &&
        visaApplication.visaType.processingMode &&
        visaApplication.visaType.processingUnit
        ? {
            processingMode: visaApplication.visaType.processingMode,
            processingUnit: visaApplication.visaType.processingUnit,
            processingValueFixed: visaApplication.visaType.processingValueFixed,
            processingValueMax: visaApplication.visaType.processingValueMax,
          }
        : null,
      visaApplication?.plannedCountryExitDate
        ? new Date(visaApplication.plannedCountryExitDate)
        : null,
      clientIsInTheCountry,
      visaApplication?.createdAt ? new Date(visaApplication.createdAt) : null
    );

    const updatedApplication: any = {
      ...visaApplication,
      clientIsInTheCountry,
      ...(plannedCompletionDate && { plannedCompletionDate }),
    };

    setVisaApplications(
      visaApplications.map(va => (va.orderItemId === item.id ? updatedApplication : va))
    );

    // Update completion date state if calculated
    if (plannedCompletionDate) {
      setCompletionDate(plannedCompletionDate);
      setCompletionTime(plannedCompletionDate.toTimeString().slice(0, 5));
      form.setValue('completionDate', plannedCompletionDate);
      form.setValue('completionTime', plannedCompletionDate.toTimeString().slice(0, 5));
    }

    try {
      const mutationData: any = {
        id: visaApplication?.id || '',
        clientIsInTheCountry,
      };

      if (plannedCompletionDate) {
        mutationData.plannedCompletionDate = plannedCompletionDate.toISOString();
      }

      await editVisaApplicationMutation.mutateAsync(mutationData);

      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }

    setSaveStatus('saved');
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

  useEffect(() => {
    if (visaApplication?.plannedCountryEntryDate) {
      const date = new Date(visaApplication.plannedCountryEntryDate);
      setEntryDate(date);
      setEntryTime(date.toTimeString().slice(0, 5));
      form.setValue('entryDate', date);
      form.setValue('entryTime', date.toTimeString().slice(0, 5));
    } else {
      setEntryDate(undefined);
      setEntryTime('00:00');
      form.setValue('entryDate', undefined);
      form.setValue('entryTime', '00:00');
    }

    if (visaApplication?.plannedCountryExitDate) {
      const date = new Date(visaApplication.plannedCountryExitDate);
      setExitDate(date);
      setExitTime(date.toTimeString().slice(0, 5));
      form.setValue('exitDate', date);
      form.setValue('exitTime', date.toTimeString().slice(0, 5));
    } else {
      setExitDate(undefined);
      setExitTime('00:00');
      form.setValue('exitDate', undefined);
      form.setValue('exitTime', '00:00');
    }

    if (visaApplication?.plannedCompletionDate) {
      const date = new Date(visaApplication.plannedCompletionDate);
      setCompletionDate(date);
      setCompletionTime(date.toTimeString().slice(0, 5));
      form.setValue('completionDate', date);
      form.setValue('completionTime', date.toTimeString().slice(0, 5));
    } else {
      setCompletionDate(undefined);
      setCompletionTime('00:00');
      form.setValue('completionDate', undefined);
      form.setValue('completionTime', '00:00');
    }

    if (visaApplication?.stampUntilDate) {
      const date = new Date(visaApplication.stampUntilDate);
      setStampUntilDate(date);
      setStampUntilTime(date.toTimeString().slice(0, 5));
      form.setValue('stampUntilDate', date);
      form.setValue('stampUntilTime', date.toTimeString().slice(0, 5));
    } else {
      setStampUntilDate(undefined);
      setStampUntilTime('00:00');
      form.setValue('stampUntilDate', undefined);
      form.setValue('stampUntilTime', '00:00');
    }
  }, [
    visaApplication?.plannedCountryEntryDate,
    visaApplication?.plannedCountryExitDate,
    visaApplication?.plannedCompletionDate,
    visaApplication?.stampUntilDate,
    form,
  ]);

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
          <div className="flex gap-2 md:ps-4 pt-3 md:pt-0.5">
            <Switch
              checked={clientIsInTheCountry}
              onCheckedChange={() => handleClientIsInTheCountry(!clientIsInTheCountry)}
            />
            <Label>Client in {visaApplication?.country?.name}</Label>
          </div>
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
            {clientIsInTheCountry && (
              <>
                {/* Leaving country row */}
                <div className="flex flex-wrap justify-start items-center gap-6">
                  <div>
                    <Label htmlFor="date-picker" className="mb-2">
                      Leaving date
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      <div className="flex flex-col gap-3">
                        <FormField
                          control={form.control}
                          name="exitDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Popover open={exitDateOpen} onOpenChange={setExitDateOpen}>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="secondary"
                                      id="date-picker"
                                      className={cn(
                                        'min-w-52 justify-between',
                                        !field.value && 'text-muted-foreground'
                                      )}
                                    >
                                      {exitDate ? exitDate.toLocaleDateString() : 'Select date'}
                                      <CalendarIcon />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-auto overflow-hidden p-0"
                                    align="start"
                                  >
                                    <Calendar
                                      mode="single"
                                      selected={exitDate}
                                      captionLayout="dropdown"
                                      onSelect={handleExitDateUpdate}
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
                          value={exitTime}
                          onChange={e => {
                            handleExitTimeUpdate(e.target.value);
                          }}
                          className={cn(
                            exitTime ? '' : 'text-secondary',
                            'bg-secondary appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Stamp until */}
                  <div>
                    <Label htmlFor="date-picker" className="mb-2">
                      Stamp until
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      <div className="flex flex-col gap-3">
                        <FormField
                          control={form.control}
                          name="stampUntilDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Popover
                                  open={stampUntilDateOpen}
                                  onOpenChange={setStampUntilDateOpen}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="secondary"
                                      id="date-picker"
                                      className={cn(
                                        'min-w-52 justify-between',
                                        !field.value && 'text-muted-foreground'
                                      )}
                                    >
                                      {stampUntilDate
                                        ? stampUntilDate.toLocaleDateString()
                                        : 'Select date'}
                                      <CalendarIcon />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-auto overflow-hidden p-0"
                                    align="start"
                                  >
                                    <Calendar
                                      mode="single"
                                      selected={stampUntilDate}
                                      captionLayout="dropdown"
                                      onSelect={handleStampUntilDateUpdate}
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
                          value={stampUntilTime}
                          onChange={e => {
                            handleStampUntilTimeUpdate(e.target.value);
                          }}
                          className={cn(
                            stampUntilTime ? '' : 'text-secondary',
                            'bg-secondary appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            {/* Enter country row */}
            <div className="flex flex-wrap gap-6 justify-start items-center">
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
                      className={cn(
                        entryTime ? '' : 'text-secondary',
                        'bg-secondary appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
                      )}
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
                            entryDate.getTime() + (visaFreeStampDuration - 1) * 24 * 60 * 60 * 1000
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

            <div className="flex flex-wrap gap-6 justify-between items-end">
              <div className="flex flex-wrap gap-6">
                {/* Completion date */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="date-picker">Visa readiness</Label>
                    {visaApplication?.visaType &&
                      (visaApplication.visaType.processingMode === 'fixed' ||
                        (!visaApplication.clientIsInTheCountry &&
                          visaApplication.visaType.processingMode === 'approximate')) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertTriangle className="h-4 w-4 text-yellow-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Automatic calculation is in testing mode and requires verification
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <div className="flex flex-col gap-3">
                      <FormField
                        control={form.control}
                        name="completionDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Popover
                                open={completionDateOpen}
                                onOpenChange={setCompletionDateOpen}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="secondary"
                                    id="date-picker"
                                    className={cn(
                                      'min-w-52 justify-between',
                                      !field.value && 'text-muted-foreground'
                                    )}
                                  >
                                    {completionDate
                                      ? completionDate.toLocaleDateString()
                                      : 'Select date'}
                                    <CalendarIcon />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto overflow-hidden p-0"
                                  align="start"
                                >
                                  <Calendar
                                    mode="single"
                                    selected={completionDate}
                                    captionLayout="dropdown"
                                    onSelect={handleCompletionDateUpdate}
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
                        value={completionTime}
                        onChange={e => {
                          handleCompletionTimeUpdate(e.target.value);
                        }}
                        className={cn(
                          completionTime ? '' : 'text-secondary',
                          'bg-secondary appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>{formatCurrency(item?.finalPrice || 0, 'VND')}</div>
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
