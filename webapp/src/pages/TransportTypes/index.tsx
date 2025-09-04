import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { FilterContainer, FilterFields, FilterField } from '@/components/Filters';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { AlertTriangle, Edit, Search, Trash2, X, Truck } from 'lucide-react';
import { IconDisplay } from '@/components/ui/icon-display';
import { getEditTransportTypeRoute } from '@/lib/routes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function TransportTypesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: transportTypesData,
    isLoading,
    error,
    refetch,
  } = trpc.transportType.getAll.useQuery({
    search: debouncedSearchTerm || undefined,
  });

  const transportTypes = transportTypesData?.transportTypes || [];

  const deleteTransportTypeMutation = trpc.transportType.delete.useMutation({
    onSuccess: () => {
      toast.success('Transport type deleted successfully');
      refetch();
    },
    onError: error => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleDeleteTransportType = (id: string) => {
    deleteTransportTypeMutation.mutate({ id });
  };

  const resetFilters = () => {
    setSearchTerm('');
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <span>Error loading transport types: {error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4 lg:gap-6 p-4 sm:p-6 pb-0">
      <FilterContainer onClearFilters={resetFilters}>
        <FilterFields>
          <FilterField label="Search Transport Types">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </FilterField>
        </FilterFields>
      </FilterContainer>

      {isLoading ? (
        <div className="flex justify-center items-center p-4 sm:p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : transportTypes.length === 0 ? (
        <div className="text-center py-4 sm:py-8 text-muted-foreground">
          No transport types found matching your criteria.
        </div>
      ) : (
        <>
          {/* Table view (hidden on mobile) */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto rounded-md border border-muted">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted hover:bg-gray-800/50">
                    <TableHead>Icon</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transportTypes.map(transportType => (
                    <TableRow key={transportType.id} className="hover:bg-muted/50">
                      <TableCell className="w-16">
                        <IconDisplay
                          iconFilename={transportType.icon || undefined}
                          iconType="transport-type"
                          alt={transportType.name}
                          size="md"
                          fallback={<Truck className="h-6 w-6 text-muted-foreground" />}
                        />
                      </TableCell>
                      <TableCell>
                        <Link
                          to={getEditTransportTypeRoute({ id: transportType.id })}
                          className="hover:underline font-medium"
                        >
                          {transportType.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(getEditTransportTypeRoute({ id: transportType.id }))
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Transport Type</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{transportType.name}"? This
                                  action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTransportType(transportType.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {transportTypes.map(transportType => (
              <Card key={transportType.id} className="border border-muted">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Link
                      to={getEditTransportTypeRoute({ id: transportType.id })}
                      className="hover:underline flex-1"
                    >
                      <CardTitle className="text-base">
                        <div className="flex items-center space-x-3">
                          <IconDisplay
                            iconFilename={transportType.icon || undefined}
                            iconType="transport-type"
                            alt={transportType.name}
                            size="md"
                            fallback={<Truck className="h-6 w-6 text-muted-foreground" />}
                          />
                          <span className="font-medium text-foreground">{transportType.name}</span>
                        </div>
                      </CardTitle>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(getEditTransportTypeRoute({ id: transportType.id }))}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Transport Type</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{transportType.name}"? This action
                            cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteTransportType(transportType.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
