import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
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
  Upload,
  AlertCircle,
  CheckCircle2,
  Eye,
  Download,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { useAvailableDocuments } from '../../hooks/useServiceRequirements';
import { useSubmitRequirement } from '../../hooks/useServiceRequirements';

interface ServiceRequirementSubmissionFormProps {
  serviceRequirement: {
    id: string;
    status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'needs_revision';
    textValue?: string;
    dateValue?: Date;
    booleanValue?: boolean;
    checkpointValue?: string;
    documentId?: string;
    comment?: string;
    requirement: {
      id: string;
      title: string;
      description?: string;
      serviceType: string;
      inputType: string;
      operator?: string;
      thresholdNumber?: number;
      thresholdDate?: Date;
      thresholdText?: string;
      thresholdBool?: boolean;
      checkpointValue?: string;
    };
    document?: {
      id: string;
      fileName: string;
      originalName: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
      uploadedAt: Date;
      isValid: boolean;
    };
  };
  serviceType: 'visa_application' | 'visarun_order' | 'document_service';
  serviceId: string;
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (result: any) => void;
}

const getInputTypeIcon = (inputType: string) => {
  switch (inputType) {
    case 'document':
      return <FileText className="w-4 h-4" />;
    case 'date':
      return <CalendarIcon className="w-4 h-4" />;
    case 'text':
      return <Type className="w-4 h-4" />;
    case 'boolean':
      return <ToggleLeft className="w-4 h-4" />;
    case 'checkpoint':
      return <CheckCircle className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const ServiceRequirementSubmissionForm: React.FC<ServiceRequirementSubmissionFormProps> = ({
  serviceRequirement,
  serviceType,
  serviceId,
  clientId,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { requirement } = serviceRequirement;

  const [formData, setFormData] = useState({
    textValue: '',
    dateValue: undefined as Date | undefined,
    booleanValue: undefined as boolean | undefined,
    checkpointValue: '',
    documentId: '',
    comment: '',
  });

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);

  // Load available documents for document type requirements
  const { data: availableDocuments, isLoading: documentsLoading } = useAvailableDocuments(
    clientId,
    requirement.id
  );

  const submitMutation = useSubmitRequirement();

  // Initialize form data when dialog opens
  useEffect(() => {
    if (open && serviceRequirement) {
      setFormData({
        textValue: serviceRequirement.textValue || '',
        dateValue: serviceRequirement.dateValue
          ? new Date(serviceRequirement.dateValue)
          : undefined,
        booleanValue: serviceRequirement.booleanValue,
        checkpointValue: serviceRequirement.checkpointValue || '',
        documentId: serviceRequirement.documentId || '',
        comment: serviceRequirement.comment || '',
      });
    }
  }, [open, serviceRequirement]);

  const validateInput = (value: string | Date | boolean) => {
    const { inputType, operator, thresholdDate, thresholdText, thresholdBool, checkpointValue } =
      requirement;

    try {
      switch (inputType) {
        case 'document':
          if (value && typeof value === 'string') {
            return { isValid: true, message: 'Document selected' };
          }
          return { isValid: false, message: 'Please select a document' };

        case 'checkpoint':
          if (value === checkpointValue) {
            return { isValid: true, message: 'Checkpoint value matches requirement' };
          }
          return { isValid: false, message: `Expected: ${checkpointValue}` };

        case 'date': {
          if (!(value instanceof Date)) {
            return { isValid: false, message: 'Valid date required' };
          }

          if (!thresholdDate || !operator) {
            return { isValid: false, message: 'Requirement configuration incomplete' };
          }

          // Pre-define the variables outside the switch for case blocks
          const dateValue = value;
          let isValid = false;
          let message = '';

          switch (operator) {
            case 'eq':
              isValid = dateValue.getTime() === thresholdDate.getTime();
              message = isValid
                ? 'Date matches requirement'
                : `Date must be ${thresholdDate.toDateString()}`;
              break;
            case 'neq':
              isValid = dateValue.getTime() !== thresholdDate.getTime();
              message = isValid
                ? 'Date is acceptable'
                : `Date must not be ${thresholdDate.toDateString()}`;
              break;
            case 'lt':
              isValid = dateValue.getTime() < thresholdDate.getTime();
              message = isValid
                ? 'Date is valid'
                : `Date must be before ${thresholdDate.toDateString()}`;
              break;
            case 'lte':
              isValid = dateValue.getTime() <= thresholdDate.getTime();
              message = isValid
                ? 'Date is valid'
                : `Date must be on or before ${thresholdDate.toDateString()}`;
              break;
            case 'gt':
              isValid = dateValue.getTime() > thresholdDate.getTime();
              message = isValid
                ? 'Date is valid'
                : `Date must be after ${thresholdDate.toDateString()}`;
              break;
            case 'gte':
              isValid = dateValue.getTime() >= thresholdDate.getTime();
              message = isValid
                ? 'Date is valid'
                : `Date must be on or after ${thresholdDate.toDateString()}`;
              break;
          }

          return { isValid, message };
        }

        case 'text': {
          if (typeof value !== 'string') {
            return { isValid: false, message: 'Valid text required' };
          }

          if (!thresholdText || !operator) {
            return { isValid: false, message: 'Requirement configuration incomplete' };
          }

          // Pre-define variables outside the switch
          const textValue = value.trim();
          let textValid = false;
          let textMessage = '';

          switch (operator) {
            case 'eq':
              textValid = textValue === thresholdText;
              textMessage = textValid
                ? 'Text matches requirement'
                : `Text must be exactly: ${thresholdText}`;
              break;
            case 'neq':
              textValid = textValue !== thresholdText;
              textMessage = textValid ? 'Text is acceptable' : `Text must not be: ${thresholdText}`;
              break;
            case 'contains':
              textValid = textValue.toLowerCase().includes(thresholdText.toLowerCase());
              textMessage = textValid
                ? 'Text contains required content'
                : `Text must contain: ${thresholdText}`;
              break;
          }

          return { isValid: textValid, message: textMessage };
        }

        case 'boolean': {
          if (typeof value !== 'boolean') {
            return { isValid: false, message: 'Valid boolean value required' };
          }

          if (thresholdBool === null || thresholdBool === undefined) {
            return { isValid: false, message: 'Requirement configuration incomplete' };
          }

          const boolValid = value === thresholdBool;
          const boolMessage = boolValid
            ? 'Boolean value matches requirement'
            : `Boolean must be ${thresholdBool}`;

          return { isValid: boolValid, message: boolMessage };
        }

        default:
          return { isValid: false, message: 'Unknown requirement input type' };
      }
    } catch (error) {
      return {
        isValid: false,
        message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };

  const handleInputChange = (field: string, value: string | Date | boolean | null | undefined) => {
    setFormData({ ...formData, [field]: value });

    // Validate the input
    if (value === null || value === undefined) return; // Skip validation for null/undefined values

    let inputValue = value;
    if (requirement.inputType === 'checkpoint') {
      inputValue = value;
    } else if (requirement.inputType === 'date') {
      inputValue = value;
    } else if (requirement.inputType === 'text') {
      inputValue = value;
    } else if (requirement.inputType === 'boolean') {
      inputValue = value;
    } else if (requirement.inputType === 'document') {
      inputValue = value;
    }

    const validation = validateInput(inputValue);
    setValidationResult(validation);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Get the appropriate value based on input type
    let inputValue;
    switch (requirement.inputType) {
      case 'document':
        inputValue = formData.documentId;
        break;
      case 'date':
        inputValue = formData.dateValue;
        break;
      case 'text':
        inputValue = formData.textValue;
        break;
      case 'boolean':
        inputValue = formData.booleanValue;
        break;
      case 'checkpoint':
        inputValue = formData.checkpointValue;
        break;
      default:
        inputValue = null;
    }

    // Validate before submission
    const validation = validateInput(inputValue as string | boolean | Date);
    setValidationResult(validation);

    if (!validation.isValid) {
      return;
    }

    try {
      const result = await submitMutation.mutateAsync({
        serviceType,
        serviceId,
        requirementId: requirement.id,
        textValue: formData.textValue || undefined,
        dateValue: formData.dateValue,
        booleanValue: formData.booleanValue,
        checkpointValue: formData.checkpointValue || undefined,
        documentId: formData.documentId || undefined,
        comment: formData.comment || undefined,
      });

      if (onSuccess) {
        onSuccess(result);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  const selectedDocument = availableDocuments?.documents.find(
    doc => doc.id === formData.documentId
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getInputTypeIcon(requirement.inputType)}
            Submit Requirement: {requirement.title}
          </DialogTitle>
          <DialogDescription>
            {requirement.description && (
              <span className="block mb-2">{requirement.description}</span>
            )}
            Fill in the required information to submit this requirement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    serviceRequirement.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : serviceRequirement.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : serviceRequirement.status === 'needs_revision'
                          ? 'bg-yellow-100 text-yellow-800'
                          : serviceRequirement.status === 'submitted'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                  }
                >
                  {serviceRequirement.status === 'approved' && (
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                  )}
                  {serviceRequirement.status === 'rejected' && (
                    <AlertCircle className="w-3 h-3 mr-1" />
                  )}
                  {serviceRequirement.status === 'needs_revision' && (
                    <AlertCircle className="w-3 h-3 mr-1" />
                  )}
                  {serviceRequirement.status === 'submitted' && (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  )}
                  <span className="capitalize">{serviceRequirement.status.replace('_', ' ')}</span>
                </Badge>
                <Badge variant="outline">{requirement.inputType}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Input Field */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Input Value</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {requirement.inputType === 'document' && (
                <div className="space-y-2">
                  <Label>Select Document</Label>
                  {documentsLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading documents...</span>
                    </div>
                  ) : (
                    <Select
                      value={formData.documentId}
                      onValueChange={value => handleInputChange('documentId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a document" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDocuments?.documents.map(
                          (doc: {
                            id: string;
                            originalName: string;
                            fileSize: number;
                            fileType: string;
                          }) => (
                            <SelectItem key={doc.id} value={doc.id}>
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                <span>{doc.originalName}</span>
                                <span className="text-sm text-gray-500">
                                  ({formatFileSize(doc.fileSize)})
                                </span>
                              </div>
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  )}

                  {selectedDocument && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{selectedDocument.originalName}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(selectedDocument.fileSize)} •{' '}
                            {selectedDocument.fileType}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(selectedDocument.fileUrl, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = selectedDocument.fileUrl;
                              link.download = selectedDocument.originalName;
                              link.click();
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {requirement.inputType === 'date' && (
                <div className="space-y-2">
                  <Label>Select Date</Label>
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.dateValue && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dateValue ? (
                          format(formData.dateValue, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.dateValue}
                        onSelect={date => {
                          if (date) {
                            handleInputChange('dateValue', date);
                          }
                          setDatePickerOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {requirement.thresholdDate && (
                    <p className="text-sm text-gray-500">
                      Requirement: {requirement.operator}{' '}
                      {format(new Date(requirement.thresholdDate), 'PPP')}
                    </p>
                  )}
                </div>
              )}

              {requirement.inputType === 'text' && (
                <div className="space-y-2">
                  <Label>Enter Text</Label>
                  <Input
                    value={formData.textValue}
                    onChange={e => handleInputChange('textValue', e.target.value)}
                    placeholder="Enter text value"
                  />
                  {requirement.thresholdText && (
                    <p className="text-sm text-gray-500">
                      Requirement: {requirement.operator} "{requirement.thresholdText}"
                    </p>
                  )}
                </div>
              )}

              {requirement.inputType === 'boolean' && (
                <div className="space-y-2">
                  <Label>Select Value</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.booleanValue === true}
                      onCheckedChange={checked => handleInputChange('booleanValue', checked)}
                    />
                    <Label>{formData.booleanValue ? 'True' : 'False'}</Label>
                  </div>
                  {requirement.thresholdBool !== undefined && (
                    <p className="text-sm text-gray-500">
                      Required value: {requirement.thresholdBool ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              )}

              {requirement.inputType === 'checkpoint' && (
                <div className="space-y-2">
                  <Label>Checkpoint Value</Label>
                  <Input
                    value={formData.checkpointValue}
                    onChange={e => handleInputChange('checkpointValue', e.target.value)}
                    placeholder="Enter checkpoint value"
                  />
                  {requirement.checkpointValue && (
                    <p className="text-sm text-gray-500">
                      Expected value: {requirement.checkpointValue}
                    </p>
                  )}
                </div>
              )}

              {/* Validation Result */}
              {validationResult && (
                <div
                  className={`p-3 rounded-lg border ${
                    validationResult.isValid
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {validationResult.isValid ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span
                      className={`text-sm ${
                        validationResult.isValid ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {validationResult.message}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comment (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.comment}
                onChange={e => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Add any additional comments or notes..."
                rows={3}
              />
            </CardContent>
          </Card>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={
              submitMutation.isPending || (validationResult ? !validationResult.isValid : false)
            }
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Submit Requirement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
