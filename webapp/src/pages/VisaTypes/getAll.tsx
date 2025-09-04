import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import { getEditVisaTypeRoute, getViewVisaTypeRoute } from '../../lib/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Eye, Edit, Trash2, Search, Globe, Clock } from 'lucide-react';
import { FilterContainer, FilterFields, FilterField } from '@/components/Filters';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';

import { formatCurrency } from '@/utils/currency.js';

const AllVisaTypesPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canRead = hasPermission('visaTypes.read');
  const canUpdate = hasPermission('visaTypes.update');
  const canDelete = hasPermission('visaTypes.delete');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedProcessingMode, setSelectedProcessingMode] = useState('all');
  const [selectedMultientry, setSelectedMultientry] = useState('all');

  const { data, error, isLoading, isError, refetch } = trpc.visaType.getAll.useQuery(
    {
      limit: 50,
      offset: 0,
    },
    {
      retry: 3,
      retryDelay: 1000,
    }
  );

  const { data: countriesData } = trpc.country.getAll.useQuery();

  const deleteVisaTypeMutation = trpc.visaType.delete.useMutation({
    onSuccess: () => {
      toast.success('Visa type deleted successfully');
      refetch();
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const handleDelete = (id: string) => {
    deleteVisaTypeMutation.mutate({ id });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading visa types...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">
            Error loading visa types: {error?.message || 'Unknown error'}
            <div className="mt-4">
              <Button onClick={() => refetch()} variant="secondary">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const visaTypes = data?.visaTypes || [];

  // Filter visa types on the frontend for now
  const filteredVisaTypes = visaTypes.filter(visaType => {
    const matchesSearch =
      searchTerm === '' ||
      visaType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visaType.country.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCountry = selectedCountry === 'all' || visaType.countryId === selectedCountry;

    const matchesProcessingMode =
      selectedProcessingMode === 'all' || visaType.processingMode === selectedProcessingMode;

    const matchesMultientry =
      selectedMultientry === 'all' ||
      (selectedMultientry === 'true' && visaType.isMultientry) ||
      (selectedMultientry === 'false' && !visaType.isMultientry);

    return matchesSearch && matchesCountry && matchesProcessingMode && matchesMultientry;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCountry('all');
    setSelectedProcessingMode('all');
    setSelectedMultientry('all');
  };

  return (
    <div className="grid gap-6 p-6 pb-0">
      <FilterContainer onClearFilters={resetFilters}>
        <FilterFields>
          <FilterField label="Search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or country..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </FilterField>

          <FilterField label="Country">
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder="All countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {(countriesData?.countries || []).map(country => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Processing Mode">
            <Select value={selectedProcessingMode} onValueChange={setSelectedProcessingMode}>
              <SelectTrigger>
                <SelectValue placeholder="All modes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All processing modes</SelectItem>
                <SelectItem value="embassy">Embassy</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Multi-entry">
            <Select value={selectedMultientry} onValueChange={setSelectedMultientry}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="true">Multi-entry</SelectItem>
                <SelectItem value="false">Single-entry</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>
        </FilterFields>
      </FilterContainer>

      {filteredVisaTypes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {visaTypes.length === 0
            ? 'No visa types found. Create one to get started.'
            : 'No visa types match your current filters.'}
        </div>
      ) : (
        <>
          {/* Table view (hidden on mobile) */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto rounded-md border border-muted">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted hover:bg-gray-800/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Service Cost</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Processing</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisaTypes.map(visaType => (
                    <TableRow key={visaType.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Link
                          to={getViewVisaTypeRoute({ id: visaType.id })}
                          className="flex items-center gap-2 font-medium hover:underline"
                        >
                          <span>{visaType.name}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span>{visaType.country.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-mono">
                            {formatCurrency(visaType.serviceCost, 'VND')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={visaType.isMultientry ? 'default' : 'secondary'}>
                          {visaType.isMultientry ? 'Multi-entry' : 'Single-entry'}
                          {visaType.isMultientry && visaType.multientryExtraCost && (
                            <span className="ml-1">
                              (+{formatCurrency(visaType.multientryExtraCost, 'VND')})
                            </span>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="secondary">
                            {visaType.processingMode === 'fixed' ? 'Fixed: ' : 'Approx: '}
                            {visaType.processingMode === 'fixed'
                              ? visaType.processingValueFixed
                              : `${visaType.processingValueMin}-${visaType.processingValueMax}`}{' '}
                            {visaType.processingUnit}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          <span>{visaType._count?.visaApplications || 0} applications</span>
                          <span className="text-muted-foreground">
                            {visaType._count?.clientVisas || 0} client visas
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(getViewVisaTypeRoute({ id: visaType.id }))}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(getEditVisaTypeRoute({ id: visaType.id }))}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Visa Type</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{visaType.name}"? This action
                                    cannot be undone and may affect related applications.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(visaType.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {filteredVisaTypes.map(visaType => (
          <Card key={visaType.id} className="border border-muted">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <Link
                  to={getViewVisaTypeRoute({ id: visaType.id })}
                  className="hover:underline flex-1"
                >
                  <CardTitle className="text-base">
                    <span className="font-medium text-foreground">{visaType.name}</span>
                    <div className="text-sm text-muted-foreground font-normal mt-1">
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {visaType.country.name}
                      </div>
                    </div>
                  </CardTitle>
                </Link>
                <Badge variant={visaType.isMultientry ? 'default' : 'secondary'}>
                  {visaType.isMultientry ? 'Multi-entry' : 'Single-entry'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Service Cost:</span>
                  <span className="text-sm font-mono">{visaType.serviceCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Processing Time:</span>
                  <span className="text-sm">
                    {visaType.processingMode === 'fixed'
                      ? `${visaType.processingValueFixed} ${visaType.processingUnit}`
                      : `${visaType.processingValueMin}-${visaType.processingValueMax} ${visaType.processingUnit}`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Applications:</span>
                  <span className="text-sm">{visaType._count?.visaApplications || 0}</span>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  {canRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(getViewVisaTypeRoute({ id: visaType.id }))}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  )}
                  {canUpdate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(getEditVisaTypeRoute({ id: visaType.id }))}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Visa Type</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{visaType.name}"? This action cannot be
                            undone and may affect related applications.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(visaType.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AllVisaTypesPage;
