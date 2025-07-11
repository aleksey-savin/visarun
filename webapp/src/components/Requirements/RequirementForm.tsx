import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';

import { Separator } from '../ui/separator';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  FileText,
  Calendar as CalendarIcon,
  Type,
  CheckCircle,
  ToggleLeft,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { VisaTypeSelector } from './VisaTypeSelector';
import { CitizenshipSelector } from './CitizenshipSelector';
import { FileUpload } from '../ui/file-upload';

interface RequirementFormProps {
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
    sampleUrl?: string;
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

const inputTypeOptions = [
  { value: 'document', label: 'Document', icon: FileText },
  { value: 'date', label: 'Date', icon: CalendarIcon },
  { value: 'text', label: 'Text', icon: Type },
  { value: 'boolean', label: 'Boolean', icon: ToggleLeft },
  { value: 'checkpoint', label: 'Checkpoint', icon: CheckCircle },
];

const operatorOptions = [
  { value: 'eq', label: 'Equals (=)' },
  { value: 'neq', label: 'Not equals (≠)' },
  { value: 'lt', label: 'Less than (<)' },
  { value: 'lte', label: 'Less than or equal (≤)' },
  { value: 'gt', label: 'Greater than (>)' },
  { value: 'gte', label: 'Greater than or equal (≥)' },
  { value: 'contains', label: 'Contains' },
];

const getOperatorsByInputType = (inputType: string) => {
  switch (inputType) {
    case 'date':
      return ['eq', 'neq', 'lt', 'lte', 'gt', 'gte'];
    case 'text':
      return ['eq', 'neq', 'contains', 'lt', 'lte', 'gt', 'gte'];
    case 'boolean':
      return ['eq', 'neq'];
    case 'number':
      return ['eq', 'neq', 'lt', 'lte', 'gt', 'gte'];
    default:
      return [];
  }
};

export const RequirementForm: React.FC<RequirementFormProps> = ({
  requirement,
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    serviceType: 'visa' as 'visa' | 'visarun',
    inputType: 'document' as 'document' | 'checkpoint' | 'date' | 'text' | 'boolean',
    operator: '' as string,
    thresholdNumber: undefined as number | undefined,
    thresholdDate: undefined as Date | undefined,
    thresholdText: '' as string,
    thresholdBool: undefined as boolean | undefined,
    checkpointValue: '' as string,
    title: '',
    description: '',
    appliesToAllCitizenships: true,
    sampleUrl: '',
    citizenshipIds: [] as string[],
    visaTypeIds: [] as string[],
    routeIds: [] as string[],
  });

  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Initialize form data when requirement changes
  useEffect(() => {
    if (requirement) {
      setFormData({
        serviceType: requirement.serviceType as 'visa' | 'visarun',
        inputType: requirement.inputType as 'document' | 'checkpoint' | 'date' | 'text' | 'boolean',
        operator: requirement.operator || '',
        thresholdNumber: requirement.thresholdNumber,
        thresholdDate: requirement.thresholdDate ? new Date(requirement.thresholdDate) : undefined,
        thresholdText: requirement.thresholdText || '',
        thresholdBool: requirement.thresholdBool,
        checkpointValue: requirement.checkpointValue || '',
        title: requirement.title,
        description: requirement.description || '',
        appliesToAllCitizenships: requirement.appliesToAllCitizenships,
        sampleUrl: requirement.sampleUrl || '',
        citizenshipIds: requirement.citizenships?.map(c => c.citizenship.id) || [],
        visaTypeIds: requirement.visaTypeLinks?.map(v => v.visaType.id) || [],
        routeIds: [],
      });
    } else {
      // Reset form for new requirement
      setFormData({
        serviceType: 'visa',
        inputType: 'document',
        operator: '',
        thresholdNumber: undefined,
        thresholdDate: undefined,
        thresholdText: '',
        thresholdBool: undefined,
        checkpointValue: '',
        title: '',
        description: '',
        appliesToAllCitizenships: true,
        sampleUrl: '',
        citizenshipIds: [],
        visaTypeIds: [],
        routeIds: [],
      });
    }
  }, [requirement, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData: any = {
      serviceType: formData.serviceType,
      inputType: formData.inputType,
      title: formData.title,
      description: formData.description || undefined,
      appliesToAllCitizenships: formData.appliesToAllCitizenships,
      sampleUrl: formData.sampleUrl || undefined,
    };

    // Add threshold values based on input type
    if (formData.inputType === 'date') {
      submitData.operator = formData.operator;
      submitData.thresholdDate = formData.thresholdDate;
    } else if (formData.inputType === 'text') {
      submitData.operator = formData.operator;
      submitData.thresholdText = formData.thresholdText;
    } else if (formData.inputType === 'boolean') {
      submitData.operator = formData.operator || 'eq';
      submitData.thresholdBool = formData.thresholdBool;
    } else if (formData.inputType === 'checkpoint') {
      submitData.checkpointValue = formData.checkpointValue;
    }

    // Add IDs arrays
    if (!formData.appliesToAllCitizenships && formData.citizenshipIds.length > 0) {
      submitData.citizenshipIds = formData.citizenshipIds;
    }
    if (formData.visaTypeIds.length > 0) {
      submitData.visaTypeIds = formData.visaTypeIds;
    }
    if (formData.routeIds.length > 0) {
      submitData.routeIds = formData.routeIds;
    }

    // Add ID for edit mode
    if (requirement) {
      submitData.id = requirement.id;
    }

    onSubmit(submitData);
  };

  const availableOperators = getOperatorsByInputType(formData.inputType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{requirement ? 'Edit Requirement' : 'Create New Requirement'}</DialogTitle>
          <DialogDescription>
            {requirement
              ? 'Update the requirement details and validation rules.'
              : 'Create a new requirement for visa applications or visa runs.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Passport Copy"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceType">Service Type *</Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={value =>
                      setFormData({ ...formData, serviceType: value as 'visa' | 'visarun' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visa">Visa Application</SelectItem>
                      <SelectItem value="visarun">Visa Run</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the requirement..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <FileUpload
                  label="Sample Document"
                  description="Upload a sample document to help users understand the requirement"
                  value={formData.sampleUrl}
                  onChange={filePath => setFormData({ ...formData, sampleUrl: filePath || '' })}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  maxSize={10 * 1024 * 1024} // 10MB
                  uploadEndpoint="/upload/requirement-document"
                  fileFieldName="document"
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Input Type & Validation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Input Type & Validation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Input Type *</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {inputTypeOptions.map(option => {
                    const Icon = option.icon;
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant={formData.inputType === option.value ? 'default' : 'outline'}
                        className="flex flex-col h-auto p-3"
                        onClick={() =>
                          setFormData({ ...formData, inputType: option.value as any, operator: '' })
                        }
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span className="text-xs">{option.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Validation Rules */}
              {availableOperators.length > 0 && (
                <div className="space-y-4">
                  <Separator />
                  <div className="space-y-2">
                    <Label>Validation Rule</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="operator">Operator</Label>
                        <Select
                          value={formData.operator}
                          onValueChange={value => setFormData({ ...formData, operator: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select operator" />
                          </SelectTrigger>
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
                      </div>

                      {/* Threshold Value Input */}
                      <div className="space-y-2">
                        <Label>Threshold Value</Label>
                        {formData.inputType === 'date' && (
                          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-left font-normal',
                                  !formData.thresholdDate && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.thresholdDate ? (
                                  format(formData.thresholdDate, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={formData.thresholdDate}
                                onSelect={date => {
                                  setFormData({ ...formData, thresholdDate: date });
                                  setDatePickerOpen(false);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        )}

                        {formData.inputType === 'text' && (
                          <Input
                            value={formData.thresholdText}
                            onChange={e =>
                              setFormData({ ...formData, thresholdText: e.target.value })
                            }
                            placeholder="Enter text value"
                          />
                        )}

                        {formData.inputType === 'boolean' && (
                          <Select
                            value={formData.thresholdBool?.toString() || ''}
                            onValueChange={value =>
                              setFormData({ ...formData, thresholdBool: value === 'true' })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select value" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">True</SelectItem>
                              <SelectItem value="false">False</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Checkpoint Value */}
              {formData.inputType === 'checkpoint' && (
                <div className="space-y-2">
                  <Label htmlFor="checkpointValue">Checkpoint Value *</Label>
                  <Input
                    id="checkpointValue"
                    value={formData.checkpointValue}
                    onChange={e => setFormData({ ...formData, checkpointValue: e.target.value })}
                    placeholder="e.g., embassy_visited"
                    required
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Citizenship Scope */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Citizenship Scope</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="appliesToAll"
                  checked={formData.appliesToAllCitizenships}
                  onCheckedChange={checked =>
                    setFormData({
                      ...formData,
                      appliesToAllCitizenships: checked,
                      citizenshipIds: checked ? [] : formData.citizenshipIds,
                    })
                  }
                />
                <Label htmlFor="appliesToAll" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Apply to all citizenships
                </Label>
              </div>

              {!formData.appliesToAllCitizenships && (
                <CitizenshipSelector
                  selectedIds={formData.citizenshipIds}
                  onSelectionChange={ids => setFormData({ ...formData, citizenshipIds: ids })}
                  disabled={isLoading}
                />
              )}
            </CardContent>
          </Card>

          {/* Visa Type Links */}
          {formData.serviceType === 'visa' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Visa Type Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  Link this requirement to specific visa types (optional)
                </div>
                <VisaTypeSelector
                  selectedIds={formData.visaTypeIds}
                  onSelectionChange={ids => setFormData({ ...formData, visaTypeIds: ids })}
                  disabled={isLoading}
                />
              </CardContent>
            </Card>
          )}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading || !formData.title}>
            {isLoading ? 'Saving...' : requirement ? 'Update Requirement' : 'Create Requirement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
