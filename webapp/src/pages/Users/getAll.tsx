import { useState, useEffect, useMemo } from 'react';
import { trpc } from '../../lib/trpcProvider';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User, Mail, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { FilterContainer, FilterFields, FilterField } from '@/components/Filters';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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

// Define a type for the user based on your Prisma schema
type User = {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string | null;
  roleAssignments: {
    id: string;
    assignedAt: string;
    role: {
      id: string;
      name: string;
      description: string | null;
    };
  }[];
  contactMethods: {
    id: string;
    createdAt: string;
    updatedAt: string;
    value: string | null;
    userId: string;
    url: string | null;
    method: {
      id: string;
      name: string;
      description: string | null;
    } | null;
    contactMethodId: string | null;
  }[];
  createdAt: string;
  updatedAt: string;
};

// Get role badge color based on role
const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800 hover:bg-red-100';
    case 'manager':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
    default:
      return 'bg-green-100 text-green-800 hover:bg-green-100';
  }
};

const AllUsersPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [showClients, setShowClients] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const offset = (currentPage - 1) * pageSize;

  // Build query parameters based on filters
  const getQueryParams = () => {
    const params: Record<string, unknown> = {
      limit: pageSize,
      offset,
    };

    if (searchTerm) {
      params.search = searchTerm;
    }

    if (selectedRoleFilter === 'client') {
      params.includeRoles = ['client'];
    } else if (selectedRoleFilter === 'no-roles') {
      params.excludeRoles = ['client', 'admin', 'manager', 'employee'];
    } else if (selectedRoleFilter !== 'all') {
      params.includeRoles = [selectedRoleFilter];
    } else if (!showClients) {
      params.excludeRoles = ['client'];
    }

    return params;
  };

  const { data, error, isLoading, isError, refetch } = trpc.user.getAll.useQuery(getQueryParams());

  const { data: rolesData } = trpc.role.getAll.useQuery();

  const deleteMutation = trpc.user.delete.useMutation({
    onSuccess: () => {
      refetch();
      setDeleteUserId(null);
    },
    onError: error => {
      console.error('Failed to delete user:', error);
    },
  });

  const formatName = (user: User) => {
    return `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName}`;
  };

  const handleDelete = (userId: string) => {
    deleteMutation.mutate({ id: userId });
  };

  // Automatically enable showClients if client role is selected
  useEffect(() => {
    if (selectedRoleFilter === 'client') {
      setShowClients(true);
    }
  }, [selectedRoleFilter]);

  // Backend handles filtering now
  const users = data?.users || [];
  const pagination = data?.pagination;
  const totalPages = pagination ? Math.ceil(pagination.total / pageSize) : 0;

  // Get unique roles for filter dropdown from roles query
  const uniqueRoles = useMemo(() => {
    return (rolesData?.roles || []).map(role => role.name).sort();
  }, [rolesData]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedRoleFilter('all');
    setShowClients(false);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (value: string) => {
    setSelectedRoleFilter(value);
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
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={e => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </FilterField>

          <FilterField label="Role">
            <Select value={selectedRoleFilter} onValueChange={handleRoleFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="no-roles">No roles</SelectItem>
                {uniqueRoles.map(role => (
                  <SelectItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-clients"
                checked={showClients}
                onCheckedChange={checked => setShowClients(checked as boolean)}
                disabled={selectedRoleFilter === 'client'}
              />
              <Label htmlFor="show-clients" className="text-sm font-medium cursor-pointer">
                Show clients
              </Label>
            </div>
          </FilterField>
        </FilterFields>
      </FilterContainer>

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {isError && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <h3 className="font-medium text-lg mb-2">Error Loading Users</h3>
          <p>{error.message}</p>
        </div>
      )}

      {users.length === 0 && !isLoading && !isError ? (
        <div className="text-center py-8 text-muted-foreground">
          {pagination?.total === 0
            ? 'No users found. Create one to get started.'
            : 'No users match your current filters.'}
        </div>
      ) : (
        <>
          {/* Table view (hidden on mobile) */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto rounded-md border border-muted">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted hover:bg-gray-800/50">
                    <TableHead className="w-[100px]">Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: User) => (
                    <TableRow key={user.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Link to={`/users/${user.id}`} className="hover:underline font-medium">
                          {formatName(user)}
                        </Link>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize">
                        <div className="flex flex-wrap gap-1">
                          {user.roleAssignments.map(assignment => (
                            <Badge
                              key={assignment.id}
                              className={getRoleBadgeColor(assignment.role.name)}
                            >
                              {assignment.role.name}
                            </Badge>
                          ))}
                          {user.roleAssignments.length === 0 && (
                            <Badge variant="secondary">No roles</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/users/${user.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/users/edit/${user.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteUserId(user.id)}
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

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {users.map((user: User) => (
              <Card key={user.id} className="border border-muted">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Link to={`/users/${user.id}`} className="hover:underline flex-1">
                      <CardTitle className="text-base">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-primary" />
                          <span className="font-medium text-foreground">{formatName(user)}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground font-normal mt-1">
                          <Mail className="mr-1 h-3 w-3" />
                          {user.email}
                        </div>
                      </CardTitle>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Roles:</span>
                      <div className="flex flex-wrap gap-1">
                        {user.roleAssignments.map(assignment => (
                          <Badge
                            key={assignment.id}
                            className={getRoleBadgeColor(assignment.role.name)}
                          >
                            {assignment.role.name}
                          </Badge>
                        ))}
                        {user.roleAssignments.length === 0 && (
                          <Badge variant="secondary">No roles</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/users/${user.id}`)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/users/edit/${user.id}`)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteUserId(user.id)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
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
        <div className="mt-6 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            Showing {offset + 1} to {Math.min(offset + pageSize, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className={`w-auto ${
                    currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                  }`}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(pageNum => {
                  const distanceFromCurrent = Math.abs(pageNum - currentPage);
                  return (
                    distanceFromCurrent === 0 ||
                    distanceFromCurrent === 1 ||
                    pageNum === 1 ||
                    pageNum === totalPages
                  );
                })
                .map((pageNum, index, array) => {
                  const prevPageNum = array[index - 1];
                  const showEllipsis = prevPageNum && prevPageNum !== pageNum - 1;

                  return (
                    <div key={pageNum}>
                      {showEllipsis && <span className="text-muted-foreground">...</span>}
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    </div>
                  );
                })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className={`w-auto ${
                    currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                  }`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && handleDelete(deleteUserId)}
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

export default AllUsersPage;
