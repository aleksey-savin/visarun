import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  FileText,
  Calendar as CalendarIcon,
  Type,
  CheckCircle,
  ToggleLeft,
  Users,
  ArrowLeft,
  Save,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRequirement, useUpdateRequirement } from '@/hooks/useRequirements';
import { VisaTypeSelector } from '@/components/Requirements/VisaTypeSelector';
import { CitizenshipSelector } from '@/components/Requirements/CitizenshipSelector';
import { FileUpload } from '@/components/ui/file-upload';
import { getAllRequirementsRoute } from '@/lib/routes';

const inputTypeOptions = [
  { value: 'document', label: 'Document', icon: FileText },
  { value: 'date', label: 'Date', icon: CalendarIcon },
  { value: 'text', label: 'Text', icon: Type },
  { value: 'boolean', label: 'Boolean', icon: ToggleLeft },
  { value: 'checkpoint', label: 'Checkpoint', icon: CheckCircle },
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

const EditRequirementPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: requirement, isLoading, error } = useRequirement(id!);
  const updateMutation = useUpdateRequirement();

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

  // Initialize form data when requirement loads
  useEffect(() => {
    if (requirement) {
      setFormData({
        serviceType: requirement.serviceType as 'visa' | 'visarun',
        inputType: requirement.inputType as 'document' | 'checkpoint' | 'date' | 'text' | 'boolean',
        operator: requirement.operator || '',
        thresholdNumber: requirement.thresholdNumber || undefined,
        thresholdDate: requirement.thresholdDate ? new Date(requirement.thresholdDate) : undefined,
        thresholdText: requirement.thresholdText || '',
        thresholdBool: requirement.thresholdBool || undefined,
        checkpointValue: requirement.checkpointValue || '',
        title: requirement.title,
        description: requirement.description || '',
        appliesToAllCitizenships: requirement.appliesToAllCitizenships,
        sampleUrl: requirement.sampleUrl || '',
        citizenshipIds: requirement.citizenships?.map(c => c.citizenship.id) || [],
        visaTypeIds: requirement.visaTypeLinks?.map(v => v.visaType.id) || [],
        routeIds: [],
      });
    }
  }, [requirement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    const submitData: {
      id: string;
      serviceType: 'visa' | 'visarun';
      inputType: 'document' | 'date' | 'text' | 'boolean' | 'checkpoint';
      title: string;
      description?: string;
      appliesToAllCitizenships: boolean;
      sampleUrl?: string;
      operator?: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'contains';
      thresholdDate?: Date;
      thresholdText?: string;
      thresholdBool?: boolean;
      checkpointValue?: string;
      citizenshipIds?: string[];
      visaTypeIds?: string[];
      routeIds?: string[];
    } = {
      id,
      serviceType: formData.serviceType,
      inputType: formData.inputType,
      title: formData.title,
      description: formData.description || undefined,
      appliesToAllCitizenships: formData.appliesToAllCitizenships,
      sampleUrl: formData.sampleUrl || undefined,
    };

    // Add threshold values based on input type
    if (formData.inputType === 'date') {
      submitData.operator = formData.operator as
        | 'eq'
        | 'neq'
        | 'lt'
        | 'lte'
        | 'gt'
        | 'gte'
        | 'contains';
      submitData.thresholdDate = formData.thresholdDate;
    } else if (formData.inputType === 'text') {
      submitData.operator = formData.operator as
        | 'eq'
        | 'neq'
        | 'lt'
        | 'lte'
        | 'gt'
        | 'gte'
        | 'contains';
      submitData.thresholdText = formData.thresholdText;
    } else if (formData.inputType === 'boolean') {
      submitData.operator = (formData.operator || 'eq') as
        | 'eq'
        | 'neq'
        | 'lt'
        | 'lte'
        | 'gt'
        | 'gte'
        | 'contains';
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

    try {
      await updateMutation.mutateAsync(submitData);
      toast.success('Requirement updated successfully');
      navigate(getAllRequirementsRoute());
    } catch {
      toast.error('Failed to update requirement');
    }
  };

  const availableOperators = getOperatorsByInputType(formData.inputType);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading requirement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(getAllRequirementsRoute())}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Requirements
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Requirement</h1>
            <p className="text-muted-foreground">Requirement not found</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Error loading requirement: {error.message}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!requirement) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(getAllRequirementsRoute())}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Requirements
        </Button>
      </div>
      <div className="pb-8">
        <h1 className="text-3xl font-bold">Edit Requirement</h1>
        <p className="text-muted-foreground">Update requirement details and validation rules</p>
      </div>
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
                disabled={updateMutation.isPending}
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
                        setFormData({
                          ...formData,
                          inputType: option.value,
                          operator: '',
                        })
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
                disabled={updateMutation.isPending}
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
                disabled={updateMutation.isPending}
              />
            </CardContent>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(getAllRequirementsRoute())}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending || !formData.title}>
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? 'Updating...' : 'Update Requirement'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditRequirementPage;
