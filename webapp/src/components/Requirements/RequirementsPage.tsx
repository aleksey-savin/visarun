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

import { useRequirements, useDeleteRequirement } from '../../hooks/useRequirements';
import { useVisaTypes } from '../../hooks/useVisaTypes';
import {
  Plus,
  Search,
  Filter,
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
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  getCreateRequirementRoute,
  getViewRequirementRoute,
  getEditRequirementRoute,
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

  // Get visa types for country-based filtering
  const { data: visaTypesData } = useVisaTypes({ limit: 1000 });
  const visaTypes = visaTypesData?.visaTypes || [];

  // Mutations
  const deleteMutation = useDeleteRequirement();

  const requirements = data?.requirements || [];

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
        variant="outline"
        className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}
      >
        <span className="mr-1">{getInputTypeIcon(type)}</span>
        {type}
      </Badge>
    );
  };

  // No need for client-side filtering anymore, backend handles country filtering
  const filteredRequirements = requirements;

  // Get unique countries from visa types for the filter
  const availableCountries = Array.from(
    new Map(visaTypes.map(vt => [vt.country.id, vt.country])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Requirements Management</h1>
            <p className="text-muted-foreground">
              Manage requirements for visa applications and services
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Error loading requirements: {error.message}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Requirements Management</h1>
          <p className="text-muted-foreground">
            Manage requirements for visa applications and services
          </p>
        </div>
        <Button onClick={() => navigate(getCreateRequirementRoute())}>
          <Plus className="w-4 h-4 mr-2" />
          Create Requirement
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search requirements..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Service Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Service Type</label>
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
            </div>

            {/* Input Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Input Type</label>
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
            </div>

            {/* Country Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Country</label>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {availableCountries.map(country => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Requirements ({filteredRequirements.length})
              {filteredRequirements.length !== requirements.length && (
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  of {requirements.length} total
                </span>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading requirements...</span>
            </div>
          ) : filteredRequirements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {requirements.length === 0
                ? 'No requirements found. Create one to get started.'
                : 'No requirements match your current filters.'}
            </div>
          ) : (
            <>
              {/* Table view (hidden on mobile) */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Title</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Scope</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequirements.map(requirement => (
                        <TableRow key={requirement.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{requirement.title}</TableCell>
                          <TableCell>{getServiceTypeBadge(requirement.serviceType)}</TableCell>
                          <TableCell>{getInputTypeBadge(requirement.inputType)}</TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            {requirement.description || '-'}
                          </TableCell>
                          <TableCell>
                            {requirement.appliesToAllCitizenships ? (
                              <Badge variant="outline" className="border-blue-300 text-blue-700">
                                <Users className="w-3 h-3 mr-1" />
                                All Citizenships
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                {requirement._count?.citizenships || 0} specific
                              </Badge>
                            )}
                          </TableCell>
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
                </div>
              </div>

              {/* Card view (visible only on mobile) */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredRequirements.map(requirement => (
                  <Card key={requirement.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium">{requirement.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {requirement.description || 'No description'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
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
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {getServiceTypeBadge(requirement.serviceType)}
                        {getInputTypeBadge(requirement.inputType)}
                        {requirement.appliesToAllCitizenships ? (
                          <Badge variant="outline" className="border-blue-300 text-blue-700">
                            <Users className="w-3 h-3 mr-1" />
                            All Citizenships
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            {requirement._count?.citizenships || 0} specific
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRequirementId} onOpenChange={() => setDeleteRequirementId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Requirement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this requirement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRequirementId && handleDeleteRequirement(deleteRequirementId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
