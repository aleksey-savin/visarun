import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { FilterContainer, FilterFields, FilterField } from '../Filters';

import { useRequirements, useDeleteRequirement } from '../../hooks/useRequirements';
import { useCountries } from '../../hooks/useCountries';
import {
  Search,
  FileText,
  Calendar,
  Type,
  CheckCircle,
  ToggleLeft,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Users,
  Globe,
  Flag,
  Target,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import {
  getViewRequirementRoute,
  getEditRequirementRoute,
  getCreateRequirementRoute,
} from '../../lib/routes';

export const RequirementsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [serviceType, setServiceType] = useState('all');
  const [inputType, setInputType] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [deleteRequirementId, setDeleteRequirementId] = useState<string | null>(null);
  const limit = 50;

  // Queries
  const { data, isLoading, error, refetch } = useRequirements({
    search: search || undefined,
    serviceType: serviceType === 'all' ? undefined : (serviceType as 'visa' | 'visarun'),
    inputType:
      inputType === 'all'
        ? undefined
        : (inputType as 'document' | 'checkpoint' | 'date' | 'text' | 'boolean'),
    countryId: countryFilter === 'all' ? undefined : countryFilter,
    limit,
  });

  // Get countries for filtering
  const { data: countriesData } = useCountries();
  const countries = countriesData?.countries || [];

  // Mutations
  const deleteMutation = useDeleteRequirement();

  const requirements = data?.requirements || [];

  const resetFilters = () => {
    setSearch('');
    setServiceType('all');
    setInputType('all');
    setCountryFilter('all');
  };

  const handleDeleteRequirement = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Requirement deleted successfully');
      refetch();
    } catch {
      toast.error('Failed to delete requirement');
    }
  };

  const inputTypeIcons = {
    document: FileText,
    date: Calendar,
    text: Type,
    boolean: ToggleLeft,
    checkpoint: CheckCircle,
  };

  const getInputTypeIcon = (type: string) => {
    const Icon = inputTypeIcons[type as keyof typeof inputTypeIcons] || FileText;
    return <Icon className="w-4 h-4" />;
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
        variant="secondary"
        className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}
      >
        <span className="mr-1">{getInputTypeIcon(type)}</span>
        {type}
      </Badge>
    );
  };

  const getApplicationScopeBadge = (requirement: any) => {
    if (requirement.serviceType !== 'visa') {
      return null;
    }

    switch (requirement.applicationScope) {
      case 'global':
        return (
          <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
            <Globe className="w-3 h-3 mr-1" />
            Global
          </Badge>
        );
      case 'country_all':
        return (
          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
            <Flag className="w-3 h-3 mr-1" />
            {requirement.country?.name || 'Country'}
          </Badge>
        );
      case 'specific':
        return (
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
            <Target className="w-3 h-3 mr-1" />
            {requirement.visaTypeLinks?.length || 0} Types
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
            <Target className="w-3 h-3 mr-1" />
            Specific
          </Badge>
        );
    }
  };

  const getCitizenshipScopeBadge = (requirement: any) => {
    if (requirement.appliesToAllCitizenships) {
      return (
        <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
          <Users className="w-3 h-3 mr-1" />
          All
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
          <Target className="w-3 h-3 mr-1" />
          {requirement.citizenships?.length || 0}
        </Badge>
      );
    }
  };

  if (error) {
    return (
      <>
        <div className="p-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-red-600">
                Error loading requirements: {error.message}
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="grid gap-6 p-6 pb-0">
        {/* Filters */}
        <FilterContainer onClearFilters={resetFilters}>
          <FilterFields>
            <FilterField label="Search">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search requirements..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </FilterField>

            <FilterField label="Service Type">
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="visa">Visa</SelectItem>
                  <SelectItem value="visarun">Visa Run</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label="Input Type">
              <Select value={inputType} onValueChange={setInputType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
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
            </FilterField>

            <FilterField label="Country">
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map(country => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
          </FilterFields>
        </FilterContainer>

        {/* Requirements Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Requirements ({requirements.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Loading requirements...</span>
              </div>
            ) : requirements.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No requirements found</h3>
                <p className="text-gray-600 mb-4">
                  {search || serviceType !== 'all' || inputType !== 'all' || countryFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Get started by creating your first requirement'}
                </p>
                <Button onClick={() => navigate(getCreateRequirementRoute())}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Requirement
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Input Type</TableHead>
                    <TableHead>Application Scope</TableHead>
                    <TableHead>Citizenship Scope</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requirements.map(requirement => (
                    <TableRow key={requirement.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Link
                          to={getViewRequirementRoute({ id: requirement.id })}
                          className="hover:underline"
                        >
                          <div className="space-y-1">
                            <div className="font-medium">{requirement.title}</div>
                            {requirement.description && (
                              <div className="text-sm text-gray-600 truncate max-w-[200px]">
                                {requirement.description}
                              </div>
                            )}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>{getServiceTypeBadge(requirement.serviceType)}</TableCell>
                      <TableCell>{getInputTypeBadge(requirement.inputType)}</TableCell>
                      <TableCell>{getApplicationScopeBadge(requirement)}</TableCell>
                      <TableCell>{getCitizenshipScopeBadge(requirement)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(getViewRequirementRoute({ id: requirement.id }))
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(getEditRequirementRoute({ id: requirement.id }))
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteRequirementId(requirement.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteRequirementId} onOpenChange={() => setDeleteRequirementId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Requirement</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this requirement? This action cannot be undone and
                will affect all linked visa types and citizenship assignments.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteRequirementId) {
                    handleDeleteRequirement(deleteRequirementId);
                    setDeleteRequirementId(null);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};
