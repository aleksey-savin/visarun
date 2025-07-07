import { useState } from 'react';
import { getCreateCountryRoute, getViewCountryRoute } from '../../lib/routes';
import { trpc } from '../../lib/trpcProvider';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  PlusIcon,
  Globe,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Define a type for the country based on your Prisma schema
type Country = {
  id: string;
  name: string;
  eVisaAvailable: boolean;
  multivisaAvailable: boolean;
  _count: {
    cities: number;
    visaFree: number;
    blacklisted: number;
  };
};

const AllCountriesPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedeVisaFilter, setSelectedeVisaFilter] = useState('all');
  const [selectedMultivisaFilter, setSelectedMultivisaFilter] = useState('all');
  const [deleteCountryId, setDeleteCountryId] = useState<string | null>(null);

  const { data, error, isLoading, isError, refetch } = trpc.country.getAll.useQuery();

  const deleteMutation = trpc.country.delete.useMutation({
    onSuccess: () => {
      refetch();
      setDeleteCountryId(null);
    },
    onError: error => {
      console.error('Failed to delete country:', error);
    },
  });

  const handleDelete = (countryId: string) => {
    deleteMutation.mutate({ id: countryId });
  };

  // Filter countries on the frontend
  const countries = data?.countries || [];
  const filteredCountries = countries.filter(country => {
    const matchesSearch =
      searchTerm === '' || country.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matcheseVisa =
      selectedeVisaFilter === 'all' ||
      (selectedeVisaFilter === 'true' && country.eVisaAvailable) ||
      (selectedeVisaFilter === 'false' && !country.eVisaAvailable);

    const matchesMultivisa =
      selectedMultivisaFilter === 'all' ||
      (selectedMultivisaFilter === 'true' && country.multivisaAvailable) ||
      (selectedMultivisaFilter === 'false' && !country.multivisaAvailable);

    return matchesSearch && matcheseVisa && matchesMultivisa;
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Countries</h1>
          <p className="text-muted-foreground">Manage countries and their visa requirements</p>
        </div>
        <Button onClick={() => navigate(getCreateCountryRoute())}>
          <PlusIcon className="mr-2 h-4 w-4" /> Create Country
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">eVisa Available</label>
              <Select value={selectedeVisaFilter} onValueChange={setSelectedeVisaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Available</SelectItem>
                  <SelectItem value="false">Not Available</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Multivisa Available</label>
              <Select value={selectedMultivisaFilter} onValueChange={setSelectedMultivisaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Available</SelectItem>
                  <SelectItem value="false">Not Available</SelectItem>
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
              Countries ({filteredCountries.length})
              {filteredCountries.length !== countries.length && (
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  of {countries.length} total
                </span>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {isError && (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <h3 className="font-medium text-lg mb-2">Error Loading Countries</h3>
              <p>{error.message}</p>
            </div>
          )}

          {filteredCountries.length === 0 && !isLoading && !isError ? (
            <div className="text-center py-8 text-muted-foreground">
              {countries.length === 0
                ? 'No countries found. Create one to get started.'
                : 'No countries match your current filters.'}
            </div>
          ) : (
            <>
              {/* Table view (hidden on mobile) */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Country Name</TableHead>
                        <TableHead className="w-[120px]">eVisa Available</TableHead>
                        <TableHead className="w-[140px]">Multivisa Available</TableHead>
                        <TableHead className="w-[80px]">Cities</TableHead>
                        <TableHead className="w-[100px]">Visa Free</TableHead>
                        <TableHead className="w-[100px]">Blacklisted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCountries.map((country: Country) => (
                        <TableRow key={country.id} className="hover:bg-muted/50">
                          <TableCell>
                            <Link
                              to={getViewCountryRoute({ id: country.id })}
                              className="flex items-center space-x-2 font-medium hover:underline"
                            >
                              <Globe className="h-4 w-4 text-primary" />
                              <span>{country.name}</span>
                            </Link>
                          </TableCell>
                          <TableCell>
                            {country.eVisaAvailable ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </TableCell>
                          <TableCell>
                            {country.multivisaAvailable ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{country._count.cities}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {country._count.visaFree}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-red-50 text-red-700">
                              {country._count.blacklisted}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(getViewCountryRoute({ id: country.id }))}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/countries/edit/${country.id}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteCountryId(country.id)}
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
                {filteredCountries.map((country: Country) => (
                  <Card key={country.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="px-4 py-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Globe className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{country.name}</h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(getViewCountryRoute({ id: country.id }))}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/countries/edit/${country.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteCountryId(country.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between items-end">
                        <div className="text-sm text-muted-foreground">
                          <div>Cities: {country._count.cities}</div>
                          <div>
                            Visa Free: {country._count.visaFree} | Blacklisted:{' '}
                            {country._count.blacklisted}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <div className="flex gap-1">
                            {country.eVisaAvailable && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                eVisa
                              </Badge>
                            )}
                            {country.multivisaAvailable && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-purple-50 text-purple-700"
                              >
                                Multivisa
                              </Badge>
                            )}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCountryId} onOpenChange={() => setDeleteCountryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Country</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this country? This action cannot be undone and may
              affect related visa types, cities, and other data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCountryId && handleDelete(deleteCountryId)}
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

export default AllCountriesPage;
