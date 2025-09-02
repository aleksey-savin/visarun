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
  ExternalLink,
  Edit,
  Trash2,
  Link,
  Users,
} from 'lucide-react';

interface RequirementCardProps {
  requirement: {
    id: string;
    title: string;
    description?: string | null;
    serviceType: string;
    inputType: string;
    operator?: string | null;
    thresholdNumber?: number | null;
    thresholdDate?: Date | string | null;
    thresholdText?: string | null;
    thresholdBool?: boolean | null;
    checkpointValue?: string | null;
    appliesToAllCitizenships: boolean;
    sampleUrl?: string | null;
    _count?: {
      citizenships: number;
      documents: number;
      visaTypeLinks: number;
      routeLinks: number;
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
  onEdit?: (requirement: any) => void;
  onDelete?: (id: string) => void;
  onLinkCitizenships?: (id: string) => void;
  onLinkVisaTypes?: (id: string) => void;
  compact?: boolean;
}

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

const getServiceTypeColor = (serviceType: string) => {
  switch (serviceType) {
    case 'visa':
      return 'bg-indigo-100 text-indigo-800';
    case 'visarun':
      return 'bg-emerald-100 text-emerald-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatThresholdValue = (requirement: RequirementCardProps['requirement']) => {
  const {
    inputType,
    operator,
    thresholdNumber,
    thresholdDate,
    thresholdText,
    thresholdBool,
    checkpointValue,
  } = requirement;

  if (inputType === 'document') {
    return 'File upload required';
  }

  if (inputType === 'checkpoint') {
    return `Checkpoint: ${checkpointValue}`;
  }

  if (inputType === 'date' && thresholdDate) {
    const dateStr = new Date(thresholdDate).toLocaleDateString();
    return `${operator} ${dateStr}`;
  }

  if (inputType === 'text' && thresholdText) {
    return `${operator} "${thresholdText}"`;
  }

  if (inputType === 'boolean' && thresholdBool !== undefined) {
    return `Must be ${thresholdBool}`;
  }

  if (inputType === 'number' && thresholdNumber !== undefined) {
    return `${operator} ${thresholdNumber}`;
  }

  return 'No threshold set';
};

export const RequirementCard: React.FC<RequirementCardProps> = ({
  requirement,
  onEdit,
  onDelete,
  onLinkCitizenships,
  onLinkVisaTypes,
  compact = false,
}) => {
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className={compact ? 'pb-3' : 'pb-4'}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className={`${compact ? 'text-lg' : 'text-xl'} font-semibold`}>
              {requirement.title}
            </CardTitle>
            {requirement.description && (
              <CardDescription className="mt-1 text-sm text-gray-600">
                {requirement.description}
              </CardDescription>
            )}
          </div>
          {(onEdit || onDelete) && (
            <div className="flex gap-1 ml-2">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(requirement)}
                  className="p-1 h-8 w-8"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(requirement.id)}
                  className="p-1 h-8 w-8 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <Badge className={getServiceTypeColor(requirement.serviceType)}>
            {requirement.serviceType}
          </Badge>
          <Badge className={getInputTypeColor(requirement.inputType)}>
            {getInputTypeIcon(requirement.inputType)}
            <span className="ml-1 capitalize">{requirement.inputType}</span>
          </Badge>
          {requirement.appliesToAllCitizenships && (
            <Badge variant="secondary" className="border-blue-300 text-blue-700">
              <Users className="w-3 h-3 mr-1" />
              All Citizenships
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className={compact ? 'pt-0' : 'pt-2'}>
        {/* Threshold/Validation Info */}
        {!compact && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-1">Validation Rule:</div>
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {formatThresholdValue(requirement)}
            </div>
          </div>
        )}

        {/* Links and Counts */}
        <div className="space-y-3">
          {/* Citizenship Links */}
          {requirement.citizenships && requirement.citizenships.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Applies to:</div>
              <div className="flex flex-wrap gap-1">
                {requirement.citizenships.slice(0, 3).map(link => (
                  <Badge key={link.citizenship.id} variant="secondary" className="text-xs">
                    {link.citizenship.name}
                  </Badge>
                ))}
                {requirement.citizenships.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{requirement.citizenships.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Visa Type Links */}
          {requirement.visaTypeLinks && requirement.visaTypeLinks.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Visa Types:</div>
              <div className="flex flex-wrap gap-1">
                {requirement.visaTypeLinks.slice(0, 2).map(link => (
                  <Badge key={link.visaType.id} variant="secondary" className="text-xs">
                    {link.visaType.country.name} - {link.visaType.name}
                  </Badge>
                ))}
                {requirement.visaTypeLinks.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{requirement.visaTypeLinks.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          {requirement._count && !compact && (
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {requirement._count.documents > 0 && (
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  <span>{requirement._count.documents} docs</span>
                </div>
              )}
              {requirement._count.visaTypeLinks > 0 && (
                <div className="flex items-center gap-1">
                  <Link className="w-4 h-4" />
                  <span>{requirement._count.visaTypeLinks} visa types</span>
                </div>
              )}
              {requirement._count.citizenships > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{requirement._count.citizenships} citizenships</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!compact && (onLinkCitizenships || onLinkVisaTypes || requirement.sampleUrl) && (
          <>
            <Separator className="my-4" />
            <div className="flex flex-wrap gap-2">
              {onLinkCitizenships && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onLinkCitizenships(requirement.id)}
                  className="text-xs"
                >
                  <Users className="w-3 h-3 mr-1" />
                  Link Citizenships
                </Button>
              )}
              {onLinkVisaTypes && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onLinkVisaTypes(requirement.id)}
                  className="text-xs"
                >
                  <Link className="w-3 h-3 mr-1" />
                  Link Visa Types
                </Button>
              )}
              {requirement.sampleUrl && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    requirement.sampleUrl && window.open(requirement.sampleUrl, '_blank')
                  }
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Sample
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
