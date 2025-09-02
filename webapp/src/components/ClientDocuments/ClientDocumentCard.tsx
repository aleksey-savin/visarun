import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

import {
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  User,
  Tag,
  AlertCircle,
  CheckCircle,
  Clock,
  FileIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ClientDocumentCardProps {
  document: {
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
    requirement?: {
      id: string;
      title: string;
      description?: string;
      serviceType: string;
      inputType: string;
    };
    uploadedBy: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    _count?: {
      serviceRequirements: number;
    };
  };
  onView?: (document: ClientDocumentCardProps['document']) => void;
  onEdit?: (document: ClientDocumentCardProps['document']) => void;
  onDelete?: (id: string) => void;
  onDownload?: (document: ClientDocumentCardProps['document']) => void;
  compact?: boolean;
  showClient?: boolean;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileTypeIcon = (fileType: string) => {
  if (fileType.includes('pdf')) {
    return <FileText className="w-4 h-4 text-red-600" />;
  } else if (fileType.includes('image')) {
    return <FileIcon className="w-4 h-4 text-blue-600" />;
  } else if (fileType.includes('document') || fileType.includes('word')) {
    return <FileText className="w-4 h-4 text-blue-800" />;
  } else {
    return <FileIcon className="w-4 h-4 text-gray-600" />;
  }
};

const getFileTypeColor = (fileType: string) => {
  if (fileType.includes('pdf')) {
    return 'bg-red-100 text-red-800';
  } else if (fileType.includes('image')) {
    return 'bg-blue-100 text-blue-800';
  } else if (fileType.includes('document') || fileType.includes('word')) {
    return 'bg-blue-100 text-blue-800';
  } else {
    return 'bg-gray-100 text-gray-800';
  }
};

const isExpired = (expiresAt?: Date) => {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
};

const isExpiringSoon = (expiresAt?: Date) => {
  if (!expiresAt) return false;
  const now = new Date();
  const expires = new Date(expiresAt);
  const daysUntilExpiry = (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
};

export const ClientDocumentCard: React.FC<ClientDocumentCardProps> = ({
  document,
  onView,
  onEdit,
  onDelete,
  onDownload,
  compact = false,
  showClient = true,
}) => {
  const expired = isExpired(document.expiresAt);
  const expiringSoon = isExpiringSoon(document.expiresAt);

  return (
    <Card
      className={`h-full hover:shadow-md transition-shadow ${expired ? 'border-red-200 bg-red-50' : expiringSoon ? 'border-yellow-200 bg-yellow-50' : ''}`}
    >
      <CardHeader className={compact ? 'pb-3' : 'pb-4'}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {getFileTypeIcon(document.fileType)}
              <CardTitle className={`${compact ? 'text-base' : 'text-lg'} font-semibold truncate`}>
                {document.originalName}
              </CardTitle>
            </div>
            {document.comment && (
              <CardDescription className="mt-1 text-sm text-gray-600">
                {document.comment}
              </CardDescription>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1 ml-2">
            {onView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(document)}
                className="p-1 h-8 w-8"
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDownload(document)}
                className="p-1 h-8 w-8"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(document)}
                className="p-1 h-8 w-8"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(document.id)}
                className="p-1 h-8 w-8 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge className={getFileTypeColor(document.fileType)}>
            {document.fileType.split('/')[1]?.toUpperCase() || 'FILE'}
          </Badge>

          {document.isValid ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Valid
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800">
              <AlertCircle className="w-3 h-3 mr-1" />
              Invalid
            </Badge>
          )}

          {expired && (
            <Badge className="bg-red-100 text-red-800">
              <AlertCircle className="w-3 h-3 mr-1" />
              Expired
            </Badge>
          )}

          {expiringSoon && !expired && (
            <Badge className="bg-yellow-100 text-yellow-800">
              <Clock className="w-3 h-3 mr-1" />
              Expiring Soon
            </Badge>
          )}

          {document._count && document._count.serviceRequirements > 0 && (
            <Badge variant="secondary" className="border-blue-300 text-blue-700">
              Used in {document._count.serviceRequirements} requirements
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className={compact ? 'pt-0' : 'pt-2'}>
        {/* File Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Size:</span>
            <span className="font-medium">{formatFileSize(document.fileSize)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Uploaded:</span>
            <span className="font-medium">
              {formatDistanceToNow(new Date(document.uploadedAt))} ago
            </span>
          </div>

          {document.expiresAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Expires:</span>
              <span
                className={`font-medium ${expired ? 'text-red-600' : expiringSoon ? 'text-yellow-600' : ''}`}
              >
                {expired ? 'Expired' : formatDistanceToNow(new Date(document.expiresAt))}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {document.tags.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Tags:</div>
            <div className="flex flex-wrap gap-1">
              {document.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Client Info */}
        {showClient && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Client:</span>
              <span className="font-medium">
                {document.client.firstName} {document.client.lastName}
              </span>
            </div>
          </div>
        )}

        {/* Requirement Info */}
        {document.requirement && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-1">Related Requirement:</div>
            <div className="text-sm p-2 bg-gray-50 rounded">
              <div className="font-medium">{document.requirement.title}</div>
              {document.requirement.description && (
                <div className="text-gray-600 mt-1">{document.requirement.description}</div>
              )}
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {document.requirement.serviceType}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {document.requirement.inputType}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Uploaded By */}
        {!compact && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <User className="w-3 h-3" />
            Uploaded by {document.uploadedBy.firstName} {document.uploadedBy.lastName}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
