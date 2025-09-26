import { useForm, useFieldArray } from 'react-hook-form';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { CalendarIcon, Plus, Trash2, Timer } from 'lucide-react';
import { trpc } from '@/lib/trpc';

import { IconDisplay } from '../ui/icon-display';
import { Separator } from '../ui/separator';

const routeStopSchema = z.object({
  id: z.string().optional(),
  cityId: z.string().min(1, 'City is required'),
  stopType: z.enum(['departure', 'arrival', 'intermediate']),
  pickupMode: z.enum(['location', 'address', 'none']).default('location'),
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
          departureTime: '',
          arrivalNextDay: false,
        },
        {
          cityId: '',
          stopType: 'arrival' as const,
          pickupMode: 'location',
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
    fields: stopFields,
    append: appendStop,
    remove: removeStop,
  } = useFieldArray({
    control: form.control,
    name: 'routeStops',
  });

  const removeStopWithTypeUpdate = (index: number) => {
    removeStop(index);
    // Update stop types after removal to ensure first is departure and last is arrival
    setTimeout(() => {
      const stops = form.getValues('routeStops');
      if (stops.length >= 2) {
        form.setValue(`routeStops.0.stopType`, 'departure' as const);
        form.setValue(`routeStops.${stops.length - 1}.stopType`, 'arrival' as const);
      }
    }, 0);
  };

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

  const cities = citiesData?.cities || [];
  const transports = transportsData?.transports || [];
  const seatClasses = seatClassesData?.seatClasses || [];

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

  const addStop = () => {
    // Insert intermediate stop before the last stop (destination)
    const insertIndex = stopFields.length - 1;
    appendStop(
      {
        cityId: '',
        stopType: 'intermediate' as const,
        pickupMode: 'location',
        departureTime: '',
        arrivalNextDay: false,
      },
      insertIndex as any
    );

    // Update stop types to ensure first is departure and last is arrival
    setTimeout(() => {
      form.setValue(`routeStops.0.stopType`, 'departure' as const);
      const lastIndex = form.getValues('routeStops').length - 1;
      form.setValue(`routeStops.${lastIndex}.stopType`, 'arrival' as const);
    }, 0);
  };

  const ColorIndication = ({ color }: { color: string }) => {
    const colorMap = {
      'emerald-600': '#059669',
      'sky-600': '#0284c7',
      'pink-600': '#db2777',
    };

    return (
      <>
        {color !== 'pink-600' && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M7.62866 2.04511C8.63657 2.05331 9.62516 2.32269 10.498 2.82669C11.3778 3.33469 12.1097 4.06353 12.6212 4.94127C13.1327 5.81905 13.4059 6.81526 13.4141 7.83117C13.4223 8.84703 13.1651 9.8477 12.6679 10.7336C12.1706 11.6194 11.4509 12.3603 10.5795 12.8824C9.70802 13.4045 8.71503 13.6895 7.6993 13.7101C6.68359 13.7306 5.68022 13.4856 4.78833 12.9991C3.89643 12.5127 3.14663 11.802 2.61393 10.937C2.08123 10.0719 1.7838 9.08242 1.7509 8.06701L1.74805 7.87788L1.7509 7.68932C1.78356 6.6819 2.07692 5.6997 2.60197 4.8393C3.12701 3.979 3.86584 3.26912 4.74674 2.77941C5.62772 2.28966 6.62074 2.03692 7.62866 2.04511ZM7.58138 6.12788C6.61495 6.12788 5.83148 6.91147 5.83138 7.87788C5.83138 8.84438 6.61488 9.62788 7.58138 9.62788C8.54788 9.62788 9.33138 8.84438 9.33138 7.87788C9.33128 6.91147 8.54781 6.12788 7.58138 6.12788Z"
              fill={colorMap[color as keyof typeof colorMap]}
            />
          </svg>
        )}
        {color === 'pink-600' && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.2944 3.58262C12.2583 4.54636 12.8095 5.84719 12.8316 7.21003C12.8537 8.57287 12.3449 9.89088 11.4128 10.8854L11.2944 11.0079L8.81931 13.4824C8.50526 13.7962 8.08366 13.979 7.6399 13.9936C7.19615 14.0082 6.76343 13.8536 6.4294 13.5611L6.3454 13.4824L3.86973 11.0073C2.88516 10.0227 2.33203 8.68735 2.33203 7.29495C2.33203 5.90256 2.88516 4.56719 3.86973 3.58262C4.8543 2.59805 6.18967 2.04492 7.58206 2.04492C8.97446 2.04492 10.3098 2.59805 11.2944 3.58262ZM7.58206 5.54495C7.35225 5.54495 7.12469 5.59022 6.91237 5.67816C6.70005 5.76611 6.50713 5.89501 6.34463 6.05752C6.18212 6.22002 6.05322 6.41294 5.96527 6.62526C5.87733 6.83758 5.83206 7.06514 5.83206 7.29495C5.83206 7.52477 5.87733 7.75233 5.96527 7.96465C6.05322 8.17697 6.18212 8.36989 6.34463 8.53239C6.50713 8.69489 6.70005 8.8238 6.91237 8.91174C7.12469 8.99969 7.35225 9.04495 7.58206 9.04495C8.04619 9.04495 8.49131 8.86058 8.8195 8.53239C9.14769 8.2042 9.33206 7.75908 9.33206 7.29495C9.33206 6.83083 9.14769 6.38571 8.8195 6.05752C8.49131 5.72933 8.04619 5.54495 7.58206 5.54495Z"
              fill={colorMap[color as keyof typeof colorMap]}
            />
          </svg>
        )}
      </>
    );
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
              <div className="flex flex-col gap-3">
                {stopFields.map((field, index) => (
                  <div key={field.id} className="space-y-3">
                    {/* Add button above Border row */}
                    {index === stopFields.length - 1 && (
                      <div className="flex start gap-2 items-center">
                        <ColorIndication color="" />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => addStop()}
                        >
                          <Plus className="w-4 h-4" />
                          Add Stopover
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="flex flex-wrap gap-1 items-center">
                        <ColorIndication
                          color={
                            index === 0
                              ? 'emerald-600'
                              : index === stopFields.length - 1
                                ? 'pink-600'
                                : 'sky-600'
                          }
                        />
                        <FormField
                          control={form.control as any}
                          name={`routeStops.${index}.cityId`}
                          render={({ field }) => {
                            const getPlaceholder = () => {
                              if (index === 0) return 'Departure';
                              if (index === stopFields.length - 1) return 'Border';
                              return 'Stopover';
                            };

                            return (
                              <FormItem>
                                <FormControl>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="min-w-52">
                                      <SelectValue placeholder={getPlaceholder()} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {cities.map(city => (
                                        <SelectItem key={city.id} value={city.id}>
                                          <div className="flex gap-2 items-center">
                                            <span className="font-medium">{city.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                              {city.country?.name}
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />

                        {/* Show only departure time for departure and stopover */}
                        {index < stopFields.length - 1 && (
                          <FormField
                            control={form.control as any}
                            name={`routeStops.${index}.departureTime`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="time"
                                    className="bg-secondary appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        )}

                        {/* Show only arrival time for destination (border) */}
                        {index === stopFields.length - 1 && (
                          <FormField
                            control={form.control as any}
                            name={`routeStops.${index}.arrivalTime`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="time"
                                    className="bg-secondary appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        )}

                        <div className="flex items-center gap-2">
                          {/* Remove button only for intermediate stops */}
                          {index > 0 && index < stopFields.length - 1 && (
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => removeStopWithTypeUpdate(index)}
                              title="Remove stopover"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        {/* Show Next day switch only for non-departure stops */}
                        {index > 0 && (
                          <FormField
                            control={form.control as any}
                            name={`routeStops.${index}.arrivalNextDay`}
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2">
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <FormLabel>Next day</FormLabel>
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <FormField
                  control={form.control as any}
                  name={`routeStops.${stopFields.length - 1}.waitingDuration`}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <Timer className="text-pink-600 h-4 w-4" />
                        <Label>Waiting at the border</Label>
                      </div>
                      <FormControl>
                        <DurationInput
                          value={field.value}
                          onChange={field.onChange}
                          className="md:ms-6 max-w-[92px] bg-secondary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
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
