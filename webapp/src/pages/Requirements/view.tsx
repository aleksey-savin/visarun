import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/currency.js';

import {
  FileText,
  Calendar,
  Type,
  CheckCircle,
  ToggleLeft,
  Users,
  ArrowLeft,
  Edit,
  ExternalLink,
  Flag,
  DollarSign,
  Loader2,
} from 'lucide-react';

import { useRequirement } from '@/hooks/useRequirements';
import { getAllRequirementsRoute, getEditRequirementRoute } from '@/lib/routes';

const ViewRequirementPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: requirement, isLoading, error } = useRequirement(id!);

  const getInputTypeIcon = (type: string) => {
    switch (type) {
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

  const getServiceTypeBadge = (type: string) => {
    const colors = {
      visa: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      visarun: 'bg-green-100 text-green-800 hover:bg-green-100',
    };
    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {type}
      </Badge>
    );
  };

  const getInputTypeBadge = (type: string) => {
    const colors = {
      document: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
      date: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
      text: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-100',
      boolean: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100',
      checkpoint: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
    };
    return (
      <Badge
        variant="outline"
        className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}
      >
        <span className="mr-1">{getInputTypeIcon(type)}</span>
        {type}
      </Badge>
    );
  };

  const formatThresholdValue = (requirement: any) => {
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

  const formatProcessingTime = (visaType: any) => {
    const {
      processingMode,
      processingUnit,
      processingValueFixed,
      processingValueMin,
      processingValueMax,
    } = visaType;

    if (processingMode === 'fixed' && processingValueFixed) {
      return `${processingValueFixed} ${processingUnit}`;
    } else if (processingMode === 'approximate' && processingValueMin && processingValueMax) {
      return `~${processingValueMin}-${processingValueMax} ${processingUnit}`;
    }
    return 'Processing time TBD';
  };

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
            <h1 className="text-3xl font-bold">View Requirement</h1>
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(getAllRequirementsRoute())}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Requirements
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{requirement.title}</h1>
            <p className="text-muted-foreground">View requirement details and validation rules</p>
          </div>
        </div>
        <Button onClick={() => navigate(getEditRequirementRoute({ id: requirement.id }))}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Requirement
        </Button>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Title</label>
                <div className="text-lg font-semibold">{requirement.title}</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Service Type</label>
                <div>{getServiceTypeBadge(requirement.serviceType)}</div>
              </div>
            </div>

            {requirement.description && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <div className="text-gray-900 whitespace-pre-wrap">{requirement.description}</div>
              </div>
            )}

            {requirement.sampleUrl && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Sample URL</label>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (requirement.sampleUrl) {
                        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                        const fullUrl = requirement.sampleUrl.startsWith('/')
                          ? `${baseUrl}${requirement.sampleUrl}`
                          : requirement.sampleUrl;
                        window.open(fullUrl, '_blank');
                      }
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Sample
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Input Type & Validation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Input Type & Validation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Input Type</label>
              <div>{getInputTypeBadge(requirement.inputType)}</div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Validation Rule</label>
              <div className="text-gray-900 bg-gray-50 p-3 rounded-md">
                {formatThresholdValue(requirement)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Citizenship Scope */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Citizenship Scope</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Applies to {requirement.citizenships?.length || 0} specific citizenships
              </label>
              <div>
                {requirement.appliesToAllCitizenships ? (
                  <Badge variant="outline" className="border-blue-300 text-blue-700">
                    <Users className="w-3 h-3 mr-1" />
                    All Citizenships
                  </Badge>
                ) : (
                  <div className="space-y-2">
                    {requirement.citizenships && requirement.citizenships.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {requirement.citizenships.map((link: any) => (
                          <Badge key={link.citizenship.id} variant="outline">
                            {link.citizenship.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visa Type Links */}
        {requirement.serviceType === 'visa' &&
          requirement.visaTypeLinks &&
          requirement.visaTypeLinks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Linked Visa Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  This requirement applies to the following visa types:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requirement.visaTypeLinks.map((link: any) => (
                    <div
                      key={link.visaType.id}
                      className="p-4 border rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Flag className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">
                          {link.visaType.country.name} - {link.visaType.name}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          {link.visaType.isMultientry ? 'Multi-entry' : 'Single-entry'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatProcessingTime(link.visaType)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {formatCurrency(link.visaType.serviceCost)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {requirement.documents?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Documents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {requirement.visaTypeLinks?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Linked Visa Types</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {requirement.citizenships?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Linked Citizenships</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViewRequirementPage;
