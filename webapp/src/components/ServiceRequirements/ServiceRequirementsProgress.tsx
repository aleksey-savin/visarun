import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';

import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  FileText,
  Calendar,
  Type,
  ToggleLeft,
  CheckCircle,
  Eye,
  Play,
  Users,
} from 'lucide-react';

interface ServiceRequirementsProgressProps {
  readiness: {
    isReady: boolean;
    totalRequirements: number;
    completedRequirements: number;
    pendingRequirements: number;
    approvedRequirements: number;
    rejectedRequirements: number;
    requirements: Array<{
      id: string;
      title: string;
      description?: string;
      inputType: string;
      status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'needs_revision';
      serviceRequirementId?: string;
      submittedValue?: any;
      document?: {
        id: string;
        fileName: string;
        originalName: string;
        fileUrl: string;
        isValid: boolean;
      };
    }>;
  };
  serviceType: string;
  serviceId: string;
  onViewRequirement?: (requirement: any) => void;
  onEditRequirement?: (requirement: any) => void;
  onSubmitRequirement?: (requirement: any) => void;
  onInitializeRequirements?: () => void;
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

export const ServiceRequirementsProgress: React.FC<ServiceRequirementsProgressProps> = ({
  readiness,
  serviceType,

  onViewRequirement,
  onEditRequirement,
  onSubmitRequirement,
  onInitializeRequirements,
}) => {
  const {
    isReady,
    totalRequirements,
    pendingRequirements,
    approvedRequirements,
    rejectedRequirements,
    requirements,
  } = readiness;

  const progressPercentage =
    totalRequirements > 0 ? (approvedRequirements / totalRequirements) * 100 : 0;

  // Group requirements by status
  const requirementsByStatus = requirements.reduce(
    (acc, req) => {
      if (!acc[req.status]) acc[req.status] = [];
      acc[req.status].push(req);
      return acc;
    },
    {} as Record<string, typeof requirements>
  );

  if (totalRequirements === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requirements initialized</h3>
            <p className="text-gray-600 mb-4">
              Initialize requirements for this {serviceType.replace('_', ' ')} to get started.
            </p>
            {onInitializeRequirements && (
              <Button onClick={onInitializeRequirements}>
                <Play className="w-4 h-4 mr-2" />
                Initialize Requirements
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Requirements Progress</CardTitle>
              <CardDescription>
                Track completion status for {serviceType.replace('_', ' ')} requirements
              </CardDescription>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${isReady ? 'text-green-600' : 'text-gray-600'}`}>
                {Math.round(progressPercentage)}%
              </div>
              <div className="text-sm text-gray-500">
                {approvedRequirements} of {totalRequirements} approved
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Approval Progress</span>
                <span className="text-sm text-gray-500">
                  {approvedRequirements}/{totalRequirements}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{pendingRequirements}</div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(requirementsByStatus.submitted || []).length}
                </div>
                <div className="text-sm text-gray-500">Submitted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{approvedRequirements}</div>
                <div className="text-sm text-gray-500">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{rejectedRequirements}</div>
                <div className="text-sm text-gray-500">Rejected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {(requirementsByStatus.needs_revision || []).length}
                </div>
                <div className="text-sm text-gray-500">Needs Revision</div>
              </div>
            </div>

            {/* Ready Status */}
            <div
              className={`p-4 rounded-lg ${isReady ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}
            >
              <div className="flex items-center gap-2">
                {isReady ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-600" />
                )}
                <span className={`font-medium ${isReady ? 'text-green-800' : 'text-gray-800'}`}>
                  {isReady ? 'Ready for processing' : 'Waiting for requirements completion'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Requirements Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requirements.map(requirement => (
              <div
                key={requirement.id}
                className={`p-4 rounded-lg border ${
                  requirement.status === 'approved'
                    ? 'border-green-200 bg-green-50'
                    : requirement.status === 'rejected'
                      ? 'border-red-200 bg-red-50'
                      : requirement.status === 'needs_revision'
                        ? 'border-yellow-200 bg-yellow-50'
                        : requirement.status === 'submitted'
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getInputTypeIcon(requirement.inputType)}
                      <h4 className="font-medium">{requirement.title}</h4>
                    </div>
                    {requirement.description && (
                      <p className="text-sm text-gray-600 mb-3">{requirement.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getStatusColor(requirement.status)}>
                        {getStatusIcon(requirement.status)}
                        <span className="ml-1 capitalize">
                          {requirement.status.replace('_', ' ')}
                        </span>
                      </Badge>
                      <Badge className={getInputTypeColor(requirement.inputType)}>
                        <span className="capitalize">{requirement.inputType}</span>
                      </Badge>
                    </div>

                    {/* Submitted Value */}
                    {requirement.submittedValue && (
                      <div className="text-sm">
                        <span className="text-gray-600">Submitted: </span>
                        <span className="font-medium">
                          {requirement.inputType === 'document'
                            ? requirement.document?.originalName || 'Document uploaded'
                            : requirement.submittedValue.toString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {onViewRequirement && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewRequirement(requirement)}
                        className="p-1 h-8 w-8"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    {onEditRequirement &&
                      (requirement.status === 'pending' ||
                        requirement.status === 'needs_revision') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditRequirement(requirement)}
                          className="p-1 h-8 w-8"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                    {onSubmitRequirement &&
                      (requirement.status === 'pending' ||
                        requirement.status === 'needs_revision') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSubmitRequirement(requirement)}
                          className="p-1 h-8 w-8 text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
