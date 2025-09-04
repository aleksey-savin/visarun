import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import {
  getEditVisaCitizenshipSurchargeRoute,
  getViewVisaCitizenshipSurchargeRoute,
} from '../../lib/routes';
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
import { Eye, Edit, Trash2, Search } from 'lucide-react';
import { FilterContainer, FilterFields, FilterField } from '@/components/Filters';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { formatCurrency } from '@/utils/currency';

const AllVisaCitizenshipSurchargesPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // Permission checks
  const canRead = hasPermission('visaCitizenshipSurcharges.read');
  const canUpdate = hasPermission('visaCitizenshipSurcharges.update');
  const canDelete = hasPermission('visaCitizenshipSurcharges.delete');

  // State for filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [citizenshipFilter, setCitizenshipFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Data fetching
  const {
    data: surchargesData,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.visaCitizenshipSurcharge.getAll.useQuery();

  const { data: citizenshipsData } = trpc.citizenship.getAll.useQuery({
    limit: 1000,
    offset: 0,
  });

  const { data: countriesData } = trpc.country.getAll.useQuery();

  // Mutations
  const deleteMutation = trpc.visaCitizenshipSurcharge.delete.useMutation({
    onSuccess: () => {
      toast.success('Visa citizenship surcharge deleted successfully');
      refetch();
    },
    onError: error => {
      toast.error('Failed to delete visa citizenship surcharge', {
        description: error.message,
      });
    },
  });

  // Data processing
  const surcharges = surchargesData?.visaCitizenshipSurcharges || [];
  const citizenships = citizenshipsData?.citizenships || [];
  const countries = countriesData?.countries || [];

  // Filter surcharges
  const filteredSurcharges = surcharges.filter((surcharge: any) => {
    const matchesSearch =
      searchTerm === '' ||
      surcharge.citizenship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surcharge.country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (surcharge.note && surcharge.note.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCitizenship =
      citizenshipFilter === 'all' || surcharge.citizenship.id === citizenshipFilter;

    const matchesCountry = countryFilter === 'all' || surcharge.country.id === countryFilter;

    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'global' && surcharge.isGlobal) ||
      (typeFilter === 'specific' && !surcharge.isGlobal);

    return matchesSearch && matchesCitizenship && matchesCountry && matchesType;
  });

  // Event handlers
  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCitizenshipFilter('all');
    setCountryFilter('all');
    setTypeFilter('all');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <h3 className="font-medium text-lg mb-2">Error Loading Visa Citizenship Surcharges</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 p-6 pb-0">
      <FilterContainer onClearFilters={resetFilters}>
        <FilterFields>
          <FilterField label="Search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by citizenship, country, or note..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </FilterField>

          <FilterField label="Citizenship">
            <Select value={citizenshipFilter} onValueChange={setCitizenshipFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All citizenships" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All citizenships</SelectItem>
                {citizenships.map(citizenship => (
                  <SelectItem key={citizenship.id} value={citizenship.id}>
                    {citizenship.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Country">
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {countries.map(country => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Type">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="specific">Specific</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>
        </FilterFields>
      </FilterContainer>

      {filteredSurcharges.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {surcharges.length === 0
            ? 'No visa citizenship surcharges found. Create one to get started.'
            : 'No surcharges match your current filters.'}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto rounded-md border border-muted">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted hover:bg-gray-800/50">
                    <TableHead>Citizenship</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Visa Types</TableHead>
                    <TableHead>Surcharge Amount</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSurcharges.map((surcharge: any) => (
                    <TableRow key={surcharge.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Link
                          to={getViewVisaCitizenshipSurchargeRoute({ id: surcharge.id })}
                          className="flex items-center gap-2 font-medium hover:underline"
                        >
                          <span>{surcharge.citizenship.name}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{surcharge.country.name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={surcharge.isGlobal ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {surcharge.isGlobal ? 'Global' : 'Specific'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {surcharge.isGlobal ? (
                            <span className="text-sm text-muted-foreground italic">
                              All visa types in country
                            </span>
                          ) : (
                            surcharge.visaTypes.map((vt: any) => (
                              <Badge key={vt.visaType.id} variant="secondary" className="text-xs">
                                {vt.visaType.name}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">
                          {formatCurrency(surcharge.surchargeAmount, 'VND')}
                        </span>
                      </TableCell>
                      <TableCell>
                        {surcharge.note ? (
                          <span className="text-sm text-muted-foreground">{surcharge.note}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">No note</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(getViewVisaCitizenshipSurchargeRoute({ id: surcharge.id }))
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
                                navigate(getEditVisaCitizenshipSurchargeRoute({ id: surcharge.id }))
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
                                  <AlertDialogTitle>Delete Surcharge</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this visa citizenship surcharge
                                    for {surcharge.citizenship.name} in {surcharge.country.name}?
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(surcharge.id)}
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

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {filteredSurcharges.map((surcharge: any) => (
              <Card key={surcharge.id} className="border border-muted">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Link
                      to={getViewVisaCitizenshipSurchargeRoute({ id: surcharge.id })}
                      className="hover:underline flex-1"
                    >
                      <CardTitle className="text-base">
                        <span className="font-medium text-foreground">
                          {surcharge.citizenship.name} → {surcharge.country.name}
                        </span>
                      </CardTitle>
                    </Link>
                    <Badge
                      variant={surcharge.isGlobal ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {surcharge.isGlobal ? 'Global' : 'Specific'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Amount:</span>
                      <span className="text-sm font-mono">
                        {formatCurrency(surcharge.surchargeAmount, 'VND')}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Visa Types:</span>
                      <div className="flex flex-wrap gap-1">
                        {surcharge.isGlobal ? (
                          <span className="text-sm text-muted-foreground italic">
                            All visa types in country
                          </span>
                        ) : (
                          surcharge.visaTypes.map((vt: any) => (
                            <Badge key={vt.visaType.id} variant="secondary" className="text-xs">
                              {vt.visaType.name}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                    {surcharge.note && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">Note:</span>
                        <span className="text-sm">{surcharge.note}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                      {canRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(getViewVisaCitizenshipSurchargeRoute({ id: surcharge.id }))
                          }
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
                          onClick={() =>
                            navigate(getEditVisaCitizenshipSurchargeRoute({ id: surcharge.id }))
                          }
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
                              <AlertDialogTitle>Delete Surcharge</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this visa citizenship surcharge for{' '}
                                {surcharge.citizenship.name} in {surcharge.country.name}? This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(surcharge.id)}
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
        </>
      )}
    </div>
  );
};

export default AllVisaCitizenshipSurchargesPage;
