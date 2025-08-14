import { useState } from 'react';
import { getViewCitizenshipRoute } from '../../lib/routes';
import { trpc } from '../../lib/trpcProvider';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Star, StarOff, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { FilterContainer, FilterFields, FilterField } from '@/components/Filters';
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

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

// Define a type for the citizenship based on your Prisma schema
type Citizenship = {
  id: string;
  name: string;
  emoji: string;
  abbreviation: string;
  favourite: boolean;
  _count: {
    visaFree: number;
    blacklisted: number;
    surcharges: number;
  };
};

const AllCitizenshipsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFavouriteFilter, setSelectedFavouriteFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [deleteCitizenshipId, setDeleteCitizenshipId] = useState<string | null>(null);

  const offset = (currentPage - 1) * pageSize;

  const { data, error, isLoading, isError, refetch } = trpc.citizenship.getAll.useQuery({
    limit: pageSize,
    offset,
    search: searchTerm || undefined,
    favourite: selectedFavouriteFilter === 'all' ? undefined : selectedFavouriteFilter === 'true',
  });

  const deleteMutation = trpc.citizenship.delete.useMutation({
    onSuccess: () => {
      refetch();
      setDeleteCitizenshipId(null);
    },
    onError: error => {
      console.error('Failed to delete citizenship:', error);
    },
  });

  const handleDelete = (citizenshipId: string) => {
    deleteMutation.mutate({ id: citizenshipId });
  };

  const citizenships = data?.citizenships || [];
  const pagination = data?.pagination;
  const totalPages = pagination ? Math.ceil(pagination.total / pageSize) : 0;

  // Reset to first page when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFavouriteFilterChange = (value: string) => {
    setSelectedFavouriteFilter(value);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedFavouriteFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="grid gap-6 p-6 pb-0">
      <FilterContainer onClearFilters={resetFilters}>
        <FilterFields>
          <FilterField label="Search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={e => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </FilterField>

          <FilterField label="Favourite">
            <Select value={selectedFavouriteFilter} onValueChange={handleFavouriteFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Favourites</SelectItem>
                <SelectItem value="false">Non-favourites</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>
        </FilterFields>
      </FilterContainer>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Citizenships ({pagination?.total || 0})
              {pagination && (
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  (page {currentPage} of {totalPages})
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
              <h3 className="font-medium text-lg mb-2">Error Loading Citizenships</h3>
              <p>{error.message}</p>
            </div>
          )}

          {citizenships.length === 0 && !isLoading && !isError ? (
            <div className="text-center py-8 text-muted-foreground">
              No citizenships found. Create one to get started.
            </div>
          ) : (
            <>
              {/* Table view (hidden on mobile) */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Flag</TableHead>
                        <TableHead className="w-[200px]">Citizenship Name</TableHead>
                        <TableHead className="w-[80px]">Code</TableHead>
                        <TableHead className="w-[100px]">Favourite</TableHead>
                        <TableHead className="w-[100px]">Visa Free</TableHead>
                        <TableHead className="w-[100px]">Blacklisted</TableHead>
                        <TableHead className="w-[100px]">Surcharges</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {citizenships.map((citizenship: Citizenship) => (
                        <TableRow key={citizenship.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="text-2xl">{citizenship.emoji}</div>
                          </TableCell>
                          <TableCell>
                            <Link
                              to={getViewCitizenshipRoute({ id: citizenship.id })}
                              className="flex items-center space-x-2 font-medium hover:underline"
                            >
                              <Users className="h-4 w-4 text-primary" />
                              <span>{citizenship.name}</span>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono text-xs">
                              {citizenship.abbreviation}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {citizenship.favourite ? (
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            ) : (
                              <StarOff className="h-4 w-4 text-gray-400" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {citizenship._count.visaFree}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-red-50 text-red-700">
                              {citizenship._count.blacklisted}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {citizenship._count.surcharges}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  navigate(getViewCitizenshipRoute({ id: citizenship.id }))
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/citizenships/edit/${citizenship.id}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteCitizenshipId(citizenship.id)}
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
                {citizenships.map((citizenship: Citizenship) => (
                  <Card key={citizenship.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="px-4 py-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                            {citizenship.emoji}
                          </div>
                          <div>
                            <h3 className="font-medium">{citizenship.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="font-mono text-xs">
                                {citizenship.abbreviation}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(getViewCitizenshipRoute({ id: citizenship.id }))
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/citizenships/edit/${citizenship.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteCitizenshipId(citizenship.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between items-end">
                        <div className="text-sm text-muted-foreground">
                          <div>Visa Free: {citizenship._count.visaFree}</div>
                          <div>
                            Blacklisted: {citizenship._count.blacklisted} | Surcharges:{' '}
                            {citizenship._count.surcharges}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          {citizenship.favourite && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {pagination && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {offset + 1} to {Math.min(offset + pageSize, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={` w-auto
                        ${currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          `}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={`w-auto ${
                        currentPage === totalPages
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCitizenshipId} onOpenChange={() => setDeleteCitizenshipId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Citizenship</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this citizenship? This action cannot be undone and may
              affect related visa-free countries, blacklisted countries, and surcharges.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCitizenshipId && handleDelete(deleteCitizenshipId)}
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

export default AllCitizenshipsPage;
