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

const AllVisaCitizenshipSurchargesPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // Permission checks
  const canRead = hasPermission('visaCitizenshipSurcharges.read');
  const canUpdate = hasPermission('visaCitizenshipSurcharges.update');
  const canDelete = hasPermission('visaCitizenshipSurcharges.delete');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCitizenship, setSelectedCitizenship] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');

  const { data, error, isLoading, isError, refetch } =
    trpc.visaCitizenshipSurcharge.getAll.useQuery();

  const { data: citizenshipsData } = trpc.citizenship.getAll.useQuery({});
  const { data: countriesData } = trpc.country.getAll.useQuery();

  const deleteVisaCitizenshipSurchargeMutation = trpc.visaCitizenshipSurcharge.delete.useMutation({
    onSuccess: () => {
      toast.success('Visa citizenship surcharge deleted successfully');
      refetch();
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const handleDelete = (id: string) => {
    deleteVisaCitizenshipSurchargeMutation.mutate({ id });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading visa citizenship surcharges...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error: {error?.message}</div>
        </div>
      </div>
    );
  }

  const surcharges = data?.visaCitizenshipSurcharges || [];

  // Filter surcharges based on search criteria
  const filteredSurcharges = surcharges.filter(surcharge => {
    const matchesSearch =
      searchTerm === '' ||
      surcharge.citizenship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surcharge.country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surcharge.visaTypes.some(vt =>
        vt.visaType.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      (surcharge.note && surcharge.note.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCitizenship =
      selectedCitizenship === 'all' || surcharge.citizenship.id === selectedCitizenship;

    const matchesCountry = selectedCountry === 'all' || surcharge.country.id === selectedCountry;

    return matchesSearch && matchesCitizenship && matchesCountry;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCitizenship('all');
    setSelectedCountry('all');
  };

  return (
    <div className="grid gap-6 p-6 pb-0">
      <FilterContainer onClearFilters={resetFilters}>
        <FilterFields>
          <FilterField label="Search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by citizenship, country, visa type, or note..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </FilterField>

          <FilterField label="Citizenship">
            <Select value={selectedCitizenship} onValueChange={setSelectedCitizenship}>
              <SelectTrigger>
                <SelectValue placeholder="All citizenships" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All citizenships</SelectItem>
                {(citizenshipsData?.citizenships || []).map(citizenship => (
                  <SelectItem key={citizenship.id} value={citizenship.id}>
                    {citizenship.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        </FilterFields>
      </FilterContainer>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Visa Citizenship Surcharges ({filteredSurcharges.length})
              {filteredSurcharges.length !== surcharges.length && (
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  of {surcharges.length} total
                </span>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSurcharges.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {surcharges.length === 0
                ? 'No visa citizenship surcharges found. Create one to get started.'
                : 'No surcharges match your current filters.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
                  {filteredSurcharges.map(surcharge => (
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
                            surcharge.visaTypes.map(vt => (
                              <Badge key={vt.visaType.id} variant="secondary" className="text-xs">
                                {vt.visaType.name}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">
                          {surcharge.surchargeAmount.toLocaleString()} VND
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AllVisaCitizenshipSurchargesPage;
