import { useState } from 'react';
import { getViewRoleRoute } from '../../lib/routes';
import { trpc } from '../../lib/trpcProvider';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Search, Eye, Edit, Trash2 } from 'lucide-react';
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

// Define a type for the role based on your Prisma schema
type Role = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
};

const AllRolesPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);

  const { data, error, isLoading, isError, refetch } = trpc.role.getAll.useQuery();

  const deleteMutation = trpc.role.delete.useMutation({
    onSuccess: () => {
      refetch();
      setDeleteRoleId(null);
    },
    onError: error => {
      console.error('Failed to delete role:', error);
    },
  });

  const handleDelete = (roleId: string) => {
    deleteMutation.mutate({ id: roleId });
  };

  // Filter roles on the frontend
  const roles = data?.roles || [];
  const filteredRoles = roles.filter(role => {
    const matchesSearch =
      searchTerm === '' ||
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType =
      selectedTypeFilter === 'all' ||
      (selectedTypeFilter === 'system' && role.isSystem) ||
      (selectedTypeFilter === 'custom' && !role.isSystem);

    return matchesSearch && matchesType;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedTypeFilter('all');
  };

  return (
    <div className="grid gap-6 p-6 pb-0">
      <FilterContainer onClearFilters={resetFilters}>
        <FilterFields>
          <FilterField label="Search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </FilterField>

          <FilterField label="Type">
            <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="system">System roles</SelectItem>
                <SelectItem value="custom">Custom roles</SelectItem>
              </SelectContent>
            </Select>
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
          <h3 className="font-medium text-lg mb-2">Error Loading Roles</h3>
          <p>{error.message}</p>
        </div>
      )}

      {filteredRoles.length === 0 && !isLoading && !isError ? (
        <div className="text-center py-8 text-muted-foreground">
          {roles.length === 0
            ? 'No roles found. Create one to get started.'
            : 'No roles match your current filters.'}
        </div>
      ) : (
        <>
          {/* Table view (hidden on mobile) */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto rounded-md border border-muted">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted hover:bg-gray-800/50">
                    <TableHead className="w-[150px]">Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role: Role) => (
                    <TableRow key={role.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Link
                          to={getViewRoleRoute({ id: role.id })}
                          className="flex items-center space-x-2 hover:underline"
                        >
                          <span className="font-medium capitalize">{role.name}</span>
                        </Link>
                      </TableCell>
                      <TableCell>{role.description || 'No description'}</TableCell>
                      <TableCell>
                        {role.isSystem ? (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            System
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Custom</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(getViewRoleRoute({ id: role.id }))}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/roles/edit/${role.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!role.isSystem && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteRoleId(role.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
            {filteredRoles.map((role: Role) => (
              <Card key={role.id} className="border border-muted">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Link to={getViewRoleRoute({ id: role.id })} className="hover:underline flex-1">
                      <CardTitle className="text-base">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <span className="font-medium text-foreground capitalize">
                            {role.name}
                          </span>
                        </div>
                      </CardTitle>
                    </Link>
                    {role.isSystem ? (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        System
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Custom</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Description:</span>
                      <span className="text-sm">{role.description || 'No description'}</span>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(getViewRoleRoute({ id: role.id }))}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/roles/edit/${role.id}`)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      {!role.isSystem && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteRoleId(role.id)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRoleId} onOpenChange={() => setDeleteRoleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this role? This action cannot be undone and may affect
              users assigned to this role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRoleId && handleDelete(deleteRoleId)}
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

export default AllRolesPage;
