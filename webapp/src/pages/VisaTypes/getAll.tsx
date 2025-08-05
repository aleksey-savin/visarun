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
import { Eye, Edit, Trash2, Search, Filter, Globe, Clock, DollarSign } from 'lucide-react';
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
              <Button onClick={() => refetch()} variant="outline">
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

  return (
    <div className="grid gap-6 p-6 pb-0">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name or country..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Country</label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="All countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All countries</SelectItem>
                  {countriesData?.countries.map(country => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Processing Mode</label>
              <Select value={selectedProcessingMode} onValueChange={setSelectedProcessingMode}>
                <SelectTrigger>
                  <SelectValue placeholder="All modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All modes</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="approximate">Approximate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Multi-entry</label>
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
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Visa Types ({filteredVisaTypes.length})
              {filteredVisaTypes.length !== visaTypes.length && (
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  of {visaTypes.length} total
                </span>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {filteredVisaTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {visaTypes.length === 0
                ? 'No visa types found. Create one to get started.'
                : 'No visa types match your current filters.'}
            </div>
          ) : (
            <>
              {/* Table view (hidden on mobile) */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
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
                        <TableRow key={visaType.id}>
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
                                  (+${visaType.multientryExtraCost.toFixed(2)})
                                </span>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <Badge variant="outline">
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
                                  onClick={() =>
                                    navigate(getViewVisaTypeRoute({ id: visaType.id }))
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              {canUpdate && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    navigate(getEditVisaTypeRoute({ id: visaType.id }))
                                  }
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
                                        Are you sure you want to delete "{visaType.name}"? This
                                        action cannot be undone and may affect related applications.
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

              {/* Card view (visible only on mobile) */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredVisaTypes.map(visaType => (
                  <Card key={visaType.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="px-4 py-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Link
                            to={getViewVisaTypeRoute({ id: visaType.id })}
                            className="font-medium hover:underline"
                          >
                            <h3 className="font-medium">{visaType.name}</h3>
                          </Link>
                          <div className="text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {visaType.country.name}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
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
                      </div>
                      <div className="flex justify-between items-end pt-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-sm">
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono">{visaType.serviceCost.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {visaType.processingMode === 'fixed'
                                ? `${visaType.processingValueFixed} ${visaType.processingUnit}`
                                : `${visaType.processingValueMin}-${visaType.processingValueMax} ${visaType.processingUnit}`}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={visaType.isMultientry ? 'default' : 'secondary'}>
                            {visaType.isMultientry ? 'Multi-entry' : 'Single-entry'}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {visaType._count?.visaApplications || 0} apps
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AllVisaTypesPage;
