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
import { AlertTriangle, Edit, Search, Trash2, X, Armchair } from 'lucide-react';
import { IconDisplay } from '@/components/ui/icon-display';
import { getEditSeatClassRoute } from '@/lib/routes';
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

export default function SeatClassesPage() {
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
    data: seatClassesData,
    isLoading,
    error,
    refetch,
  } = trpc.seatClass.getAll.useQuery({
    search: debouncedSearchTerm || undefined,
  });

  const seatClasses = seatClassesData?.seatClasses || [];

  const deleteSeatClassMutation = trpc.seatClass.delete.useMutation({
    onSuccess: () => {
      toast.success('Seat class deleted successfully');
      refetch();
    },
    onError: error => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleDeleteSeatClass = (id: string) => {
    deleteSeatClassMutation.mutate({ id });
  };

  const resetFilters = () => {
    setSearchTerm('');
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <span>Error loading seat classes: {error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:gap-4 lg:gap-6 p-4 sm:p-6 pb-0">
        <FilterContainer onClearFilters={resetFilters}>
          <FilterFields>
            <FilterField label="Search Seat Classes">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name or description..."
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
        ) : seatClasses.length === 0 ? (
          <div className="text-center py-4 sm:py-8 text-muted-foreground">
            No seat classes found matching your criteria.
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
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seatClasses.map(seatClass => (
                      <TableRow key={seatClass.id} className="hover:bg-muted/50">
                        <TableCell className="w-16">
                          <IconDisplay
                            iconFilename={seatClass.icon || undefined}
                            iconType="transport-seat"
                            alt={seatClass.name}
                            size="md"
                            fallback={<Armchair className="h-6 w-6 text-muted-foreground" />}
                          />
                        </TableCell>
                        <TableCell>
                          <Link
                            to={getEditSeatClassRoute({ id: seatClass.id })}
                            className="hover:underline font-medium"
                          >
                            {seatClass.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {seatClass.description || 'No description'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(getEditSeatClassRoute({ id: seatClass.id }))}
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
                                  <AlertDialogTitle>Delete Seat Class</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{seatClass.name}"? This action
                                    cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteSeatClass(seatClass.id)}
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
              {seatClasses.map(seatClass => (
                <Card key={seatClass.id} className="border border-muted">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Link
                        to={getEditSeatClassRoute({ id: seatClass.id })}
                        className="hover:underline flex-1"
                      >
                        <CardTitle className="text-base">
                          <div className="flex items-center space-x-3">
                            <IconDisplay
                              iconFilename={seatClass.icon || undefined}
                              iconType="transport-seat"
                              alt={seatClass.name}
                              size="md"
                              fallback={<Armchair className="h-6 w-6 text-muted-foreground" />}
                            />
                            <span className="font-medium text-foreground">{seatClass.name}</span>
                          </div>
                        </CardTitle>
                      </Link>
                    </div>
                    {seatClass.description && (
                      <p className="text-sm text-muted-foreground mt-1 ml-9">
                        {seatClass.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(getEditSeatClassRoute({ id: seatClass.id }))}
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
                            <AlertDialogTitle>Delete Seat Class</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{seatClass.name}"? This action cannot
                              be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteSeatClass(seatClass.id)}
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
    </>
  );
}
