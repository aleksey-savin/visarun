import { useForm, useFieldArray } from 'react-hook-form';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';

import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { trpc } from '@/lib/trpc';

import { IconDisplay } from '../ui/icon-display';
import { Separator } from '../ui/separator';
import StopoverList from './StopoverList';
import { StopoverData } from './Stopover';

const routeStopSchema = z.object({
  id: z.string().optional(),
  cityId: z.string().min(1, 'City is required'),
  stopType: z.enum(['departure', 'arrival', 'intermediate']),
  pickupMode: z.enum(['location', 'address']).default('location'),
  pickupLocationId: z.string().optional(),
  arrivalTime: z.string().optional(),
  departureTime: z.string().optional(),
  arrivalNextDay: z.boolean().default(false),
  waitingDuration: z.number().min(0).optional(),
  stopOrder: z.number().optional(),
});

const routeTransportSchema = z.object({
  id: z.string().optional(),
  transportId: z.string().min(1, 'Transport is required'),
  isActive: z.boolean().default(true),
});

const seatPriceSchema = z.object({
  id: z.string().optional(),
  seatClassId: z.string().min(1, 'Seat class is required'),
  price: z.number().min(0, 'Price must be non-negative'),
});

const formSchema = z.object({
  stamp: z.boolean().default(false),
  visa: z.boolean().default(false),

  routeStops: z
    .array(routeStopSchema)
    .min(2, 'At least 2 stops are required (origin and destination)')
    .refine(
      stops =>
        stops[0]?.departureTime &&
        stops[0].departureTime.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      'Departure time is required for the first stop'
    ),
  transports: z.array(routeTransportSchema).min(1, 'At least one transport is required'),
  seatPrices: z.array(seatPriceSchema).optional(),

  // Schedule fields
  daysOfWeek: z.array(z.number()).min(1, 'At least one day must be selected'),
  departureTime: z.string().optional(),
  validFrom: z.date({
    required_error: 'Valid from date is required',
  }),
  validTo: z.date().optional(),
  autoGeneratePeriodMonths: z.number().min(1).max(24).default(12),
  isActive: z.boolean().default(true),
});

const editFormSchema = z.object({
  stamp: z.boolean().default(false),
  visa: z.boolean().default(false),

  routeStops: z
    .array(routeStopSchema)
    .min(2, 'At least 2 stops are required (origin and destination)')
    .refine(
      stops =>
        stops[0]?.departureTime &&
        stops[0].departureTime.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      'Departure time is required for the first stop'
    ),
  transports: z.array(routeTransportSchema).min(1, 'At least one transport is required'),
  seatPrices: z.array(seatPriceSchema).optional(),

  // Schedule fields
  daysOfWeek: z.array(z.number()).min(1, 'At least one day must be selected'),
  departureTime: z.string().optional(),
  validFrom: z.date({
    required_error: 'Valid from date is required',
  }),
  validTo: z.date().optional(),
  autoGeneratePeriodMonths: z.number().min(1).max(24).default(12),
  isActive: z.boolean().default(true),
});

export type CombinedVisarunFormData = z.infer<typeof formSchema>;

interface CombinedVisarunFormProps {
  initialData?: Partial<CombinedVisarunFormData>;
  onSubmit: (data: CombinedVisarunFormData) => Promise<void>;
  onCancel: () => void;
  title?: string;
  mode?: 'create' | 'edit';
}

const dayLabels = [
  { value: 1, label: 'Mo', fullLabel: 'Monday' },
  { value: 2, label: 'Tu', fullLabel: 'Tuesday' },
  { value: 3, label: 'We', fullLabel: 'Wednesday' },
  { value: 4, label: 'Th', fullLabel: 'Thursday' },
  { value: 5, label: 'Fr', fullLabel: 'Friday' },
  { value: 6, label: 'Sa', fullLabel: 'Saturday' },
  { value: 0, label: 'Su', fullLabel: 'Sunday' },
];

interface DurationInputProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function DurationInput({
  value,
  onChange,
  placeholder = 'HH:MM',
  className,
  disabled,
}: DurationInputProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const [inputValue, setInputValue] = useState(value ? formatDuration(value) : '');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // Only allow digits
    newValue = newValue.replace(/[^\d]/g, '');

    // Limit to 4 digits max
    if (newValue.length > 4) {
      newValue = newValue.slice(0, 4);
    }

    // Validate hours and minutes during input
    if (newValue.length >= 1) {
      const firstDigit = parseInt(newValue[0]);
      if (firstDigit > 2) {
        newValue = '2' + newValue.slice(1);
      }
    }

    if (newValue.length >= 2) {
      const hours = parseInt(newValue.slice(0, 2));
      if (hours > 23) {
        newValue = '23' + newValue.slice(2);
      }
    }

    if (newValue.length >= 3) {
      const minutesFirstDigit = parseInt(newValue[2]);
      if (minutesFirstDigit > 5) {
        newValue = newValue.slice(0, 2) + '5' + newValue.slice(3);
      }
    }

    if (newValue.length === 4) {
      const minutes = parseInt(newValue.slice(2, 4));
      if (minutes > 59) {
        newValue = newValue.slice(0, 2) + '59';
      }
    }

    // Auto-format with colon
    let formattedValue = '';
    if (newValue.length === 0) {
      formattedValue = '';
    } else if (newValue.length <= 2) {
      formattedValue = newValue;
    } else {
      const hours = newValue.slice(0, 2);
      const minutes = newValue.slice(2, 4);
      formattedValue = `${hours}:${minutes}`;
    }

    setInputValue(formattedValue);

    // Allow empty input
    if (formattedValue === '') {
      onChange(undefined);
      return;
    }

    // Check if it's a complete valid time format and update form value
    const completeTimePattern = /^(\d{1,2}):(\d{2})$/;
    const match = formattedValue.match(completeTimePattern);

    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      onChange(hours * 60 + minutes);
    } else if (formattedValue.length <= 2 && parseInt(formattedValue) <= 23) {
      // Handle partial hours input
      const hours = parseInt(formattedValue);
      onChange(hours * 60);
    }
  };

  const handleBlur = () => {
    if (value) {
      setInputValue(formatDuration(value));
    } else if (inputValue && !inputValue.match(/^(\d{1,2}):(\d{2})$/)) {
      setInputValue('');
    }
  };

  return (
    <Input
      type="text"
      placeholder={placeholder}
      value={inputValue}
      onChange={handleInputChange}
      onBlur={handleBlur}
      className={className}
      maxLength={5}
      disabled={disabled}
    />
  );
}

export default function CombinedVisarunForm({
  initialData,
  onSubmit,
  onCancel,
  mode = 'create',
}: CombinedVisarunFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CombinedVisarunFormData>({
    resolver: zodResolver(mode === 'edit' ? editFormSchema : formSchema) as any,
    defaultValues: {
      stamp: initialData?.stamp ?? false,
      visa: initialData?.visa ?? false,

      routeStops: initialData?.routeStops || [
        {
          cityId: '',
          stopType: 'departure' as const,
          pickupMode: 'location',
          pickupLocationId: undefined,
          departureTime: '',
          arrivalNextDay: false,
        },
        {
          cityId: '',
          stopType: 'arrival' as const,
          pickupMode: 'address',
          pickupLocationId: undefined,
          arrivalTime: '',
          arrivalNextDay: false,
        },
      ],
      transports: initialData?.transports || [],
      seatPrices: initialData?.seatPrices || [],
      daysOfWeek: initialData?.daysOfWeek || [],
      departureTime: initialData?.departureTime || '',
      validFrom: initialData?.validFrom || new Date(),
      validTo: initialData?.validTo,
      autoGeneratePeriodMonths: initialData?.autoGeneratePeriodMonths || 12,
      isActive: initialData?.isActive ?? true,
    },
  });

  const {
    fields: transportFields,
    append: appendTransport,
    remove: removeTransport,
  } = useFieldArray({
    control: form.control,
    name: 'transports',
  });

  const selectedDaysOfWeek = form.watch('daysOfWeek');

  // Fetch cities
  const { data: citiesData } = trpc.city.getAll.useQuery();

  // Fetch transports
  const { data: transportsData } = trpc.transport.getAll.useQuery();

  // Fetch seat classes
  const { data: seatClassesData } = trpc.seatClass.getAll.useQuery();

  // Fetch pickup locations
  const { data: pickupLocationsData } = trpc.pickupLocation.getAll.useQuery({
    isActive: true,
  });

  const cities = citiesData?.cities || [];
  const transports = transportsData?.transports || [];
  const seatClasses = seatClassesData?.seatClasses || [];
  const pickupLocations = pickupLocationsData?.pickupLocations || [];

  // Get available seat classes based on selected transports
  const getAvailableSeatClasses = () => {
    const selectedTransportIds = form
      .watch('transports')
      .filter(t => t.transportId)
      .map(t => t.transportId);

    const availableSeatClasses: string[] = [];

    selectedTransportIds.forEach(transportId => {
      const transport = transports.find(t => t.id === transportId);
      if (transport?.seatDistribution) {
        transport.seatDistribution.forEach(dist => {
          if (!availableSeatClasses.includes(dist.seatClassId)) {
            availableSeatClasses.push(dist.seatClassId);
          }
        });
      }
    });

    return seatClasses.filter(sc => availableSeatClasses.includes(sc.id));
  };

  const availableSeatClasses = getAvailableSeatClasses();

  const handleSubmit = async (data: CombinedVisarunFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDay = (dayValue: number) => {
    const current = form.getValues('daysOfWeek');
    const updated = current.includes(dayValue)
      ? current.filter(d => d !== dayValue)
      : [...current, dayValue].sort((a, b) => a - b);
    form.setValue('daysOfWeek', updated);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit as any)}>
          <Card className="bg-secondary mb-4">
            <CardContent className="space-y-5">
              <div className="md:ms-6">
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant={form.watch('stamp') ? 'accent' : 'secondary'}
                    onClick={() => form.setValue('stamp', !form.watch('stamp'))}
                    className={cn(form.watch('stamp') ? 'border border-transparent' : 'border')}
                  >
                    Stamp
                  </Button>
                  <Button
                    type="button"
                    variant={form.watch('visa') ? 'accent' : 'secondary'}
                    onClick={() => form.setValue('visa', !form.watch('visa'))}
                    className={cn(form.watch('visa') ? 'border border-transparent' : 'border')}
                  >
                    Visa
                  </Button>
                </div>
              </div>

              <StopoverList
                stopovers={form.watch('routeStops') as StopoverData[]}
                cities={cities}
                pickupLocations={pickupLocations}
                onChange={stopovers => form.setValue('routeStops', stopovers)}
                DurationInput={DurationInput}
              />
              <div className="md:ms-6">
                <div className="flex flex-col gap-2">
                  <Label>Transport type</Label>
                  <div className="flex flex-wrap gap-2">
                    {transports.map(transport => {
                      const currentTransports = form.watch('transports');
                      const isSelected = currentTransports.some(
                        t => t.transportId === transport.id
                      );

                      return (
                        <Button
                          key={transport.id}
                          type="button"
                          variant={isSelected ? 'accent' : 'secondary'}
                          size="sm"
                          className="flex items-center gap-2 h-10"
                          onClick={() => {
                            if (isSelected) {
                              // Remove transport
                              const fieldIndex = transportFields.findIndex(
                                (_, index) =>
                                  form.getValues(`transports.${index}.transportId`) === transport.id
                              );
                              if (fieldIndex !== -1) {
                                removeTransport(fieldIndex);
                              }
                            } else {
                              // Add transport
                              appendTransport({ transportId: transport.id, isActive: true });
                            }
                          }}
                        >
                          <IconDisplay
                            iconFilename={transport.transportType.icon || undefined}
                            iconType="transport-type"
                            alt={transport.transportType.name}
                            size="md"
                          />
                          <span>{transport.seatCount || 0}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 ms-6">
                <Label>Pricing</Label>
                <div className="flex flex-wrap gap-2">
                  {availableSeatClasses.map(seatClass => {
                    const currentSeatPrices = form.watch('seatPrices') || [];
                    const existingPrice = currentSeatPrices.find(
                      sp => sp.seatClassId === seatClass.id
                    );

                    return (
                      <div key={seatClass.id}>
                        <div className="relative">
                          <IconDisplay
                            iconType="transport-seat"
                            iconFilename={seatClass.icon || ''}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"
                          />
                          <Input
                            type="number"
                            min="0"
                            placeholder={seatClass.name}
                            className="pl-10 max-w-52"
                            value={existingPrice?.price?.toString() || ''}
                            onChange={e => {
                              const value = e.target.value;

                              // If empty value, remove the seat price entry
                              if (value === '') {
                                const currentSeatPrices = form.getValues('seatPrices') || [];
                                const filteredSeatPrices = currentSeatPrices.filter(
                                  sp => sp.seatClassId !== seatClass.id
                                );
                                form.setValue('seatPrices', filteredSeatPrices);
                                return;
                              }

                              const price = parseFloat(value);

                              if (isNaN(price) || price < 0) {
                                return;
                              }

                              const currentSeatPrices = form.getValues('seatPrices') || [];
                              const seatClassIndex = currentSeatPrices.findIndex(
                                sp => sp.seatClassId === seatClass.id
                              );

                              if (seatClassIndex >= 0) {
                                const updatedSeatPrices = [...currentSeatPrices];
                                updatedSeatPrices[seatClassIndex].price = price;
                                form.setValue('seatPrices', updatedSeatPrices);
                              } else {
                                const newSeatPrices = [
                                  ...currentSeatPrices,
                                  { seatClassId: seatClass.id, price },
                                ];
                                form.setValue('seatPrices', newSeatPrices);
                              }
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {availableSeatClasses.length === 0 && (
                  <p className="text-muted-foreground text-start text-sm ">
                    Select transport types to configure seat pricing
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-4 ps-6">
                <div className="flex flex-col gap-2">
                  <Label>Trip every</Label>
                  <div className="flex flex-wrap gap-2">
                    {dayLabels.map(day => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={selectedDaysOfWeek.includes(day.value) ? 'accent' : 'secondary'}
                        onClick={() => toggleDay(day.value)}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <FormField
                    control={form.control as any}
                    name="validFrom"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Set from</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="secondary"
                                className={cn(
                                  'justify-start text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, 'dd.MM.yyyy') : 'Select Date'}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="validTo"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>to</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="secondary"
                                className={cn(
                                  'justify-start text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, 'dd.MM.yyyy') : 'Select Date'}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <Separator />
              <div className="ms-6">
                <div className="flex gap-2">
                  <FormField
                    control={form.control as any}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Label>Is active</Label>
                </div>
              </div>
              <div className="ms-6">
                <FormField
                  control={form.control as any}
                  name="autoGeneratePeriodMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auto-generation period (months)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="24"
                          className="w-24"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 12)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Separator />
              {/* Actions */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? mode === 'edit'
                      ? 'Updating...'
                      : 'Saving...'
                    : mode === 'edit'
                      ? 'Update'
                      : 'Save'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
