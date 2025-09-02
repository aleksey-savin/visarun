import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileText, Calendar as CalendarIcon, ToggleLeft, Save, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getAllRequirementsRoute } from '@/lib/routes';

import { CitizenshipScopeSelector } from './CitizenshipScopeSelector';
import { ApplicationScopeSelector } from './ApplicationScopeSelector';
import { FileUpload } from '@/components/ui/file-upload';

// Schema for form validation
const formSchema = z
  .object({
    serviceType: z.enum(['visa', 'visarun']),
    inputType: z.enum(['document', 'checkpoint', 'date', 'text', 'boolean']),
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().optional(),
    operator: z.string().optional(),
    thresholdNumber: z.number().optional(),
    thresholdDate: z.date().optional(),
    thresholdText: z.string().optional(),
    thresholdBool: z.boolean().optional(),
    checkpointValue: z.string().optional(),
    appliesToAllCitizenships: z.boolean(),
    isOptional: z.boolean(),
    sampleUrl: z.string().optional(),
    citizenshipIds: z.array(z.string().uuid()),
    visaTypeIds: z.array(z.string().uuid()),
    // New fields for application scope
    applicationScope: z.enum(['specific', 'country_all', 'global']),
    countryId: z.string().uuid().optional(),
  })
  .refine(
    data => {
      // Country ID is required when scope is country_all
      if (data.applicationScope === 'country_all' && !data.countryId) {
        return false;
      }
      // Visa type IDs are required when scope is specific for visa service
      if (
        data.serviceType === 'visa' &&
        data.applicationScope === 'specific' &&
        data.visaTypeIds.length === 0
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Invalid application scope configuration',
      path: ['applicationScope'],
    }
  );

type FormData = z.infer<typeof formSchema>;

interface RequirementFormProps {
  mode: 'create' | 'edit';
  requirement?: {
    id: string;
    serviceType: string;
    inputType: string;
    operator?: string;
    thresholdNumber?: number;
    thresholdDate?: Date;
    thresholdText?: string;
    thresholdBool?: boolean;
    checkpointValue?: string;
    title: string;
    description?: string;
    appliesToAllCitizenships: boolean;
    isOptional?: boolean;
    sampleUrl?: string;
    applicationScope?: 'specific' | 'country_all' | 'global';
    countryId?: string;
    country?: {
      id: string;
      name: string;
    };
    citizenships?: Array<{
      citizenship: {
        id: string;
        name: string;
      };
    }>;
    visaTypeLinks?: Array<{
      visaType: {
        id: string;
        name: string;
        country: {
          id: string;
          name: string;
        };
      };
    }>;
  };
  onSubmit: (data: Record<string, any>) => Promise<void>;
  isSubmitting?: boolean;
}

const inputTypeOptions = [
  { value: 'document', label: 'Document', icon: FileText },
  // { value: 'date', label: 'Date', icon: CalendarIcon },
  // { value: 'text', label: 'Text', icon: Type },
  { value: 'boolean', label: 'Boolean', icon: ToggleLeft },
  // { value: 'checkpoint', label: 'Checkpoint', icon: CheckCircle },
] as Array<{
  value: 'document' | 'date' | 'text' | 'boolean' | 'checkpoint';
  label: string;
  icon: React.FC<{ className?: string }>;
}>;

const operatorOptions = [
  { value: 'eq', label: 'Equal to' },
  { value: 'neq', label: 'Not equal to' },
  { value: 'lt', label: 'Less than' },
  { value: 'lte', label: 'Less than or equal to' },
  { value: 'gt', label: 'Greater than' },
  { value: 'gte', label: 'Greater than or equal to' },
  { value: 'contains', label: 'Contains' },
];

const getOperatorsByInputType = (inputType: string) => {
  switch (inputType) {
    case 'date':
      return ['lt', 'lte', 'gt', 'gte', 'eq'];
    case 'text':
      return ['eq', 'neq', 'contains'];
    case 'boolean':
      return ['eq'];
    default:
      return [];
  }
};

export const RequirementForm: React.FC<RequirementFormProps> = ({
  mode,
  requirement,
  onSubmit,
  isSubmitting = false,
}) => {
  const navigate = useNavigate();
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceType: 'visa',
      inputType: 'document',
      title: '',
      description: '',
      operator: '',
      thresholdNumber: undefined,
      thresholdDate: undefined,
      thresholdText: '',
      thresholdBool: undefined,
      checkpointValue: '',
      appliesToAllCitizenships: true,
      isOptional: false,
      sampleUrl: '',
      citizenshipIds: [],
      visaTypeIds: [],
      applicationScope: 'specific',
      countryId: undefined,
    },
  });

  useEffect(() => {
    if (!requirement) return;

    const roleIds = requirement.citizenships?.map(assignment => assignment.citizenship.id) || [];
    const visaTypeIds = requirement.visaTypeLinks?.map(v => v.visaType.id) || [];

    form.reset({
      serviceType: requirement.serviceType as 'visa' | 'visarun',
      inputType: requirement.inputType as 'document' | 'checkpoint' | 'date' | 'text' | 'boolean',
      title: requirement.title,
      description: requirement.description || '',
      operator: requirement.operator || '',
      thresholdNumber: requirement.thresholdNumber || undefined,
      thresholdDate: requirement.thresholdDate ? new Date(requirement.thresholdDate) : undefined,
      thresholdText: requirement.thresholdText || '',
      thresholdBool:
        requirement.thresholdBool !== undefined ? requirement.thresholdBool : undefined,
      checkpointValue: requirement.checkpointValue || '',
      appliesToAllCitizenships: requirement.appliesToAllCitizenships,
      isOptional: requirement.isOptional || false,
      sampleUrl: requirement.sampleUrl || '',
      citizenshipIds: roleIds,
      visaTypeIds: visaTypeIds,
      applicationScope:
        (requirement.applicationScope as 'specific' | 'country_all' | 'global') || 'specific',
      countryId: requirement.countryId || undefined,
    });

    setTimeout(() => {
      form.setValue('citizenshipIds', roleIds);
      form.setValue('visaTypeIds', visaTypeIds);
      form.setValue(
        'applicationScope',
        (requirement.applicationScope as 'specific' | 'country_all' | 'global') || 'specific'
      );
      form.setValue('countryId', requirement.countryId || undefined);
    }, 0);
  }, [requirement, form]);

  async function handleSubmit(values: FormData) {
    try {
      const submitData: Record<string, any> = {
        serviceType: values.serviceType,
        inputType: values.inputType,
        title: values.title,
        description: values.description || undefined,
        appliesToAllCitizenships: values.appliesToAllCitizenships,
        isOptional: values.isOptional,
        sampleUrl: values.sampleUrl || undefined,
      };

      // Add ID for edit mode
      if (mode === 'edit' && requirement?.id) {
        submitData.id = requirement.id;
      }

      // Add threshold values based on input type
      if (values.inputType === 'date') {
        submitData.operator = values.operator;
        submitData.thresholdDate = values.thresholdDate;
      } else if (values.inputType === 'text') {
        submitData.operator = values.operator;
        submitData.thresholdText = values.thresholdText;
      } else if (values.inputType === 'boolean') {
        submitData.operator = values.operator || 'eq';
        submitData.thresholdBool = values.thresholdBool;
      } else if (values.inputType === 'checkpoint') {
        submitData.checkpointValue = values.checkpointValue;
      }

      // Add application scope
      submitData.applicationScope = values.applicationScope;
      if (values.applicationScope === 'country_all' && values.countryId) {
        submitData.countryId = values.countryId;
      }

      // Add IDs arrays
      if (!values.appliesToAllCitizenships && values.citizenshipIds.length > 0) {
        submitData.citizenshipIds = values.citizenshipIds;
      }
      if (values.applicationScope === 'specific' && values.visaTypeIds.length > 0) {
        submitData.visaTypeIds = values.visaTypeIds;
      }

      await onSubmit(submitData as any);
    } catch {
      // Error handling is done in the parent component
    }
  }

  const availableOperators = getOperatorsByInputType(form.watch('inputType'));
  const inputType = form.watch('inputType');
  const serviceType = form.watch('serviceType');

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="bg-secondary p-6 mb-2.5">
          <CardContent className="px-0 pt-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    {/* Title */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="flex-1 min-w-[300px]">
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter requirement title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Service Type */}
                    <FormField
                      control={form.control}
                      name="serviceType"
                      render={({ field }) => (
                        <FormItem className="flex-1 min-w-[200px]">
                          <FormLabel>Service Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select service type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="visa">Visa Application</SelectItem>
                              <SelectItem value="visarun">Visa Run</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detailed description of the requirement..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Is Optional */}
                  <FormField
                    control={form.control}
                    name="isOptional"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Optional Requirement</FormLabel>
                          <FormDescription>
                            Mark this requirement as optional for the application
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Sample Document Upload */}
                  <FormField
                    control={form.control}
                    name="sampleUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sample Document (Optional)</FormLabel>
                        <FormControl>
                          <FileUpload
                            value={field.value || ''}
                            onChange={field.onChange}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            maxSize={10 * 1024 * 1024} // 10MB
                            uploadEndpoint="/upload/requirement-document"
                            fileFieldName="document"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Input Type & Validation */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Input Type & Validation</h3>
                  </div>

                  {/* Input Type Selection */}
                  <FormField
                    control={form.control}
                    name="inputType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Input Type</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {inputTypeOptions.map(option => {
                            const Icon = option.icon;
                            const isSelected = field.value === option.value;
                            return (
                              <Button
                                key={option.value}
                                type="button"
                                variant={isSelected ? 'default' : 'secondary'}
                                className="flex flex-col h-auto p-3"
                                onClick={() => {
                                  field.onChange(option.value);
                                  form.setValue('operator', '');
                                }}
                              >
                                <Icon className="w-4 h-4 mb-1" />
                                <span className="text-xs">{option.label}</span>
                              </Button>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Validation Rules for specific input types */}
                  {availableOperators.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Operator */}
                      <FormField
                        control={form.control}
                        name="operator"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Operator</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select operator" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {operatorOptions
                                  .filter(op => availableOperators.includes(op.value))
                                  .map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Threshold Value */}
                      {inputType === 'date' && (
                        <FormField
                          control={form.control}
                          name="thresholdDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Threshold Date</FormLabel>
                              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="secondary"
                                      className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !field.value && 'text-muted-foreground'
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {field.value ? (
                                        format(field.value, 'PPP')
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={date => {
                                      field.onChange(date);
                                      setDatePickerOpen(false);
                                    }}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {inputType === 'text' && (
                        <FormField
                          control={form.control}
                          name="thresholdText"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Threshold Text</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter text value" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {inputType === 'boolean' && (
                        <FormField
                          control={form.control}
                          name="thresholdBool"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Threshold Value</FormLabel>
                              <Select
                                onValueChange={value => field.onChange(value === 'true')}
                                value={
                                  field.value !== undefined ? field.value.toString() : undefined
                                }
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select value" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="true">True</SelectItem>
                                  <SelectItem value="false">False</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}

                  {/* Checkpoint Value */}
                  {inputType === 'checkpoint' && (
                    <FormField
                      control={form.control}
                      name="checkpointValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Checkpoint Value</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., embassy_visited" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <Separator />

                {/* Application Scope - Only for visa service type */}
                {serviceType === 'visa' && (
                  <div className="space-y-4">
                    <Form {...form}>
                      <FormField
                        control={form.control}
                        name="applicationScope"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <ApplicationScopeSelector
                                scope={field.value}
                                onScopeChange={field.onChange}
                                countryId={form.watch('countryId')}
                                onCountryChange={(countryId: string | undefined) =>
                                  form.setValue('countryId', countryId)
                                }
                                visaTypeIds={form.watch('visaTypeIds')}
                                onVisaTypeIdsChange={(ids: string[]) =>
                                  form.setValue('visaTypeIds', ids)
                                }
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </Form>
                  </div>
                )}

                <Separator />

                {/* Citizenship Scope */}
                <div className="space-y-4">
                  <Form {...form}>
                    <FormField
                      control={form.control}
                      name="appliesToAllCitizenships"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <CitizenshipScopeSelector
                              appliesToAllCitizenships={field.value}
                              onAppliesToAllChange={checked => {
                                field.onChange(checked);
                                if (checked) {
                                  form.setValue('citizenshipIds', []);
                                }
                              }}
                              selectedCitizenshipIds={form.watch('citizenshipIds')}
                              onCitizenshipIdsChange={ids => form.setValue('citizenshipIds', ids)}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Form>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting
                      ? 'Saving...'
                      : mode === 'create'
                        ? 'Create Requirement'
                        : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate(getAllRequirementsRoute())}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
