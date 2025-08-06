import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useOrderEditStore } from '@/stores';

interface Citizenship {
  id: string;
  name: string;
  emoji: string;
}

interface CitizenshipSectionProps {
  form: UseFormReturn<any>;
  citizenships: Citizenship[];
  primaryClientDataQuery: any;
  autoSave: (data: any, saveType: 'user' | 'client' | 'both') => void;
  onAutoSave: (data: any, fieldType: 'user' | 'client' | 'both') => void;
}

export const CitizenshipSection: React.FC<CitizenshipSectionProps> = ({
  form,
  citizenships,
  primaryClientDataQuery,
  onAutoSave,
}) => {
  // Access Zustand store directly
  const {
    passportDate,
    setPassportDate,
    isCalendarOpen,
    setIsCalendarOpen,
    setOptimisticPrimaryClientData,
  } = useOrderEditStore();

  return (
    <div className="flex gap-4">
      <FormField
        control={form.control}
        name="citizenshipId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Citizenship</FormLabel>
            <FormControl>
              <Select
                onValueChange={value => {
                  field.onChange(value);

                  // Optimistic update for primaryClientData
                  if (primaryClientDataQuery?.client) {
                    const updatedData = {
                      ...primaryClientDataQuery,
                      client: {
                        ...primaryClientDataQuery.client,
                        citizenshipId: value === 'none' ? null : value,
                      },
                    };
                    setOptimisticPrimaryClientData(updatedData);

                    // Trigger autosave immediately for citizenship change
                    const currentData = form.getValues();
                    currentData.citizenshipId = value;
                    onAutoSave(currentData, 'client');
                  }
                }}
                value={field.value}
                defaultValue={field.value}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select citizenship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No citizenship</SelectItem>
                  {citizenships.map(citizenship => (
                    <SelectItem key={citizenship.id} value={citizenship.id}>
                      {citizenship.emoji} {citizenship.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="passportExpirationDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Passport expiration date</FormLabel>
            <FormControl>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="secondary"
                    className={cn(
                      'w-full justify-start text-left font-normal bg-[#171717] border-[#3F3F46] hover:bg-[#171717] hover:border-ring focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                      !passportDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {passportDate ? (
                      format(passportDate, 'PPP')
                    ) : (
                      <span>Pick passport expiration date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={passportDate || undefined}
                    onSelect={date => {
                      setPassportDate(date || null);
                      field.onChange(date);
                      setIsCalendarOpen(false);

                      // Auto-save when passport date is selected
                      const formData = form.getValues();
                      formData.passportExpirationDate = date;
                      onAutoSave(formData, 'client');
                    }}
                    captionLayout="dropdown"
                    fromYear={new Date().getFullYear()}
                    toYear={2100}
                  />
                </PopoverContent>
              </Popover>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
