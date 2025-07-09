import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import {
  FileText,
  Calendar,
  Type,
  CheckCircle,
  ToggleLeft,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  User,
  Edit,
  Eye,
  Download,
  Upload,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ServiceRequirementCardProps {
  serviceRequirement: {
    id: string;
    status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'needs_revision';
    textValue?: string;
    dateValue?: Date;
    booleanValue?: boolean;
    checkpointValue?: string;
    documentId?: string;
    submittedAt?: Date;
    reviewedAt?: Date;
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
      expiresAt?: Date;
      tags: string[];
      comment?: string;
      client: {
        id: string;
        firstName: string;
        lastName: string;
      };
    };
    reviewedBy?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  onEdit?: (serviceRequirement: any) => void;
  onSubmit?: (serviceRequirement: any) => void;
  onView?: (serviceRequirement: any) => void;
  onDownloadDocument?: (document: any) => void;
  compact?: boolean;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4" />;
    case 'submitted':
      return <CheckCircle className="w-4 h-4" />;
    case 'approved':
      return <CheckCircle2 className="w-4 h-4" />;
    case 'rejected':
      return <XCircle className="w-4 h-4" />;
    case 'needs_revision':
      return <RefreshCw className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-gray-100 text-gray-800';
    case 'submitted':
      return 'bg-blue-100 text-blue-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'needs_revision':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getInputTypeIcon = (inputType: string) => {
  switch (inputType) {
    case 'document':
      return <FileText className="w-4 h-4" />;
    case 'date':
      return <Calendar className="w-4 h-4" />;
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

const getInputTypeColor = (inputType: string) => {
  switch (inputType) {
    case 'document':
      return 'bg-blue-100 text-blue-800';
    case 'date':
      return 'bg-green-100 text-green-800';
    case 'text':
      return 'bg-yellow-100 text-yellow-800';
    case 'boolean':
      return 'bg-purple-100 text-purple-800';
    case 'checkpoint':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatSubmittedValue = (
  serviceRequirement: ServiceRequirementCardProps['serviceRequirement']
) => {
  const { requirement, textValue, dateValue, booleanValue, checkpointValue, document } =
    serviceRequirement;

  switch (requirement.inputType) {
    case 'document':
      return document ? document.originalName : 'No document uploaded';
    case 'date':
      return dateValue ? new Date(dateValue).toLocaleDateString() : 'No date provided';
    case 'text':
      return textValue || 'No text provided';
    case 'boolean':
      return booleanValue !== undefined ? (booleanValue ? 'Yes' : 'No') : 'No value provided';
    case 'checkpoint':
      return checkpointValue || 'No checkpoint value';
    default:
      return 'No value provided';
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const ServiceRequirementCard: React.FC<ServiceRequirementCardProps> = ({
  serviceRequirement,
  onEdit,
  onSubmit,
  onView,
  onDownloadDocument,
  compact = false,
}) => {
  const { requirement, status, document, submittedAt, reviewedAt, reviewedBy, comment } =
    serviceRequirement;

  return (
    <Card
      className={`h-full hover:shadow-md transition-shadow ${
        status === 'rejected'
          ? 'border-red-200 bg-red-50'
          : status === 'needs_revision'
            ? 'border-yellow-200 bg-yellow-50'
            : status === 'approved'
              ? 'border-green-200 bg-green-50'
              : ''
      }`}
    >
      <CardHeader className={compact ? 'pb-3' : 'pb-4'}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className={`${compact ? 'text-base' : 'text-lg'} font-semibold`}>
              {requirement.title}
            </CardTitle>
            {requirement.description && (
              <CardDescription className="mt-1 text-sm text-gray-600">
                {requirement.description}
              </CardDescription>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1 ml-2">
            {onView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(serviceRequirement)}
                className="p-1 h-8 w-8"
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
            {onEdit && (status === 'pending' || status === 'needs_revision') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(serviceRequirement)}
                className="p-1 h-8 w-8"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onSubmit && (status === 'pending' || status === 'needs_revision') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSubmit(serviceRequirement)}
                className="p-1 h-8 w-8 text-green-600 hover:text-green-700"
              >
                <Upload className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Status and Type Badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge className={getStatusColor(status)}>
            {getStatusIcon(status)}
            <span className="ml-1 capitalize">{status.replace('_', ' ')}</span>
          </Badge>

          <Badge className={getInputTypeColor(requirement.inputType)}>
            {getInputTypeIcon(requirement.inputType)}
            <span className="ml-1 capitalize">{requirement.inputType}</span>
          </Badge>

          <Badge variant="outline" className="text-xs">
            {requirement.serviceType}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className={compact ? 'pt-0' : 'pt-2'}>
        {/* Submitted Value */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Submitted Value:</div>
          <div className="text-sm p-2 bg-gray-50 rounded">
            {formatSubmittedValue(serviceRequirement)}
          </div>
        </div>

        {/* Document Details */}
        {document && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Document Details:</div>
            <div className="text-sm p-2 bg-blue-50 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{document.originalName}</div>
                  <div className="text-gray-600 mt-1">
                    {formatFileSize(document.fileSize)} • {document.fileType}
                  </div>
                  <div className="text-gray-600">
                    Uploaded {formatDistanceToNow(new Date(document.uploadedAt))} ago
                  </div>
                </div>
                {onDownloadDocument && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDownloadDocument(document)}
                    className="p-1 h-8 w-8"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {document.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {document.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comment */}
        {comment && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Comment:</div>
            <div className="text-sm p-2 bg-gray-50 rounded">{comment}</div>
          </div>
        )}

        {/* Timestamps */}
        <div className="space-y-2">
          {submittedAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Submitted:</span>
              <span className="font-medium">{formatDistanceToNow(new Date(submittedAt))} ago</span>
            </div>
          )}

          {reviewedAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Reviewed:</span>
              <span className="font-medium">{formatDistanceToNow(new Date(reviewedAt))} ago</span>
            </div>
          )}
        </div>

        {/* Reviewed By */}
        {reviewedBy && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Reviewed by:</span>
              <span className="font-medium">
                {reviewedBy.firstName} {reviewedBy.lastName}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        {!compact && (status === 'pending' || status === 'needs_revision') && (
          <>
            <Separator className="my-4" />
            <div className="flex flex-wrap gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(serviceRequirement)}
                  className="text-xs"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              )}
              {onSubmit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSubmit(serviceRequirement)}
                  className="text-xs"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Submit
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
