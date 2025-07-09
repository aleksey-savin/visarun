import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';

import { RequirementCard } from './RequirementCard';
import { useRequirements } from '../../hooks/useRequirements';
import { Search, Plus, SortAsc, SortDesc, FileText, Loader2 } from 'lucide-react';

interface RequirementsListProps {
  onCreateRequirement?: () => void;
  onEditRequirement?: (requirement: any) => void;
  onDeleteRequirement?: (id: string) => void;
  onLinkCitizenships?: (id: string) => void;
  onLinkVisaTypes?: (id: string) => void;
  compact?: boolean;
  visaTypeId?: string;
  citizenshipId?: string;
}

export const RequirementsList: React.FC<RequirementsListProps> = ({
  onCreateRequirement,
  onEditRequirement,
  onDeleteRequirement,
  onLinkCitizenships,
  onLinkVisaTypes,
  compact = false,
  visaTypeId,
  citizenshipId,
}) => {
  const [search, setSearch] = useState('');
  const [serviceType, setServiceType] = useState('all');
  const [inputType, setInputType] = useState('all');
  const [sortBy, setSortBy] = useState<'title' | 'serviceType' | 'inputType'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading, error } = useRequirements({
    search: search || undefined,
    serviceType:
      serviceType === 'all' ? undefined : (serviceType as 'visa' | 'visarun') || undefined,
    inputType:
      inputType === 'all'
        ? undefined
        : (inputType as 'document' | 'checkpoint' | 'date' | 'text' | 'boolean') || undefined,
    visaTypeId,
    citizenshipId,
    limit,
    offset: page * limit,
  });

  const requirements = data?.requirements || [];
  const pagination = data?.pagination;

  const handleSort = (field: 'title' | 'serviceType' | 'inputType') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedRequirements = [...requirements].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading requirements: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Requirements</h2>
          <p className="text-gray-600">Manage requirements for visa applications and services</p>
        </div>
        {onCreateRequirement && (
          <Button onClick={onCreateRequirement}>
            <Plus className="w-4 h-4 mr-2" />
            Create Requirement
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search requirements..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Service Type */}
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger>
                <SelectValue placeholder="Service Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="visa">Visa</SelectItem>
                <SelectItem value="visarun">Visa Run</SelectItem>
              </SelectContent>
            </Select>

            {/* Input Type */}
            <Select value={inputType} onValueChange={setInputType}>
              <SelectTrigger>
                <SelectValue placeholder="Input Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="checkpoint">Checkpoint</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={value => {
                const [field, order] = value.split('-');
                setSortBy(field as 'title' | 'serviceType' | 'inputType');
                setSortOrder(order as 'asc' | 'desc');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title-asc">Title A-Z</SelectItem>
                <SelectItem value="title-desc">Title Z-A</SelectItem>
                <SelectItem value="serviceType-asc">Service A-Z</SelectItem>
                <SelectItem value="serviceType-desc">Service Z-A</SelectItem>
                <SelectItem value="inputType-asc">Type A-Z</SelectItem>
                <SelectItem value="inputType-desc">Type Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          {(search || serviceType || inputType) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {search && (
                <Badge variant="outline" className="px-2 py-1">
                  Search: {search}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-auto p-0"
                    onClick={() => setSearch('')}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              {serviceType && (
                <Badge variant="outline" className="px-2 py-1">
                  Service: {serviceType}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-auto p-0"
                    onClick={() => setServiceType('')}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              {inputType && (
                <Badge variant="outline" className="px-2 py-1">
                  Type: {inputType}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-auto p-0"
                    onClick={() => setInputType('')}
                  >
                    ×
                  </Button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Requirements ({pagination?.total || 0})</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('title')}
                className="text-sm"
              >
                Title
                {sortBy === 'title' &&
                  (sortOrder === 'asc' ? (
                    <SortAsc className="w-4 h-4 ml-1" />
                  ) : (
                    <SortDesc className="w-4 h-4 ml-1" />
                  ))}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('serviceType')}
                className="text-sm"
              >
                Service
                {sortBy === 'serviceType' &&
                  (sortOrder === 'asc' ? (
                    <SortAsc className="w-4 h-4 ml-1" />
                  ) : (
                    <SortDesc className="w-4 h-4 ml-1" />
                  ))}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('inputType')}
                className="text-sm"
              >
                Type
                {sortBy === 'inputType' &&
                  (sortOrder === 'asc' ? (
                    <SortAsc className="w-4 h-4 ml-1" />
                  ) : (
                    <SortDesc className="w-4 h-4 ml-1" />
                  ))}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading requirements...</span>
            </div>
          ) : sortedRequirements.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requirements found</h3>
              <p className="text-gray-600 mb-4">
                {search || serviceType !== 'all' || inputType !== 'all'
                  ? 'No requirements match your current filters.'
                  : 'Get started by creating your first requirement.'}
              </p>
              {onCreateRequirement && (
                <Button onClick={onCreateRequirement}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Requirement
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedRequirements.map(requirement => (
                <RequirementCard
                  key={requirement.id}
                  requirement={requirement}
                  onEdit={onEditRequirement}
                  onDelete={onDeleteRequirement}
                  onLinkCitizenships={onLinkCitizenships}
                  onLinkVisaTypes={onLinkVisaTypes}
                  compact={compact}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.total > limit && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {pagination.offset + 1} to{' '}
                {Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!pagination.hasMore}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
