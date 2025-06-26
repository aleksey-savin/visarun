import { useState } from 'react';
import { getCreateRoleRoute, getViewRoleRoute } from '../../lib/routes';
import { trpc } from '../../lib/trpcProvider';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusIcon, Shield, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react';
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

  // Function to get role badge color based on role name
  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'manager':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      default:
        return 'bg-green-100 text-green-800 hover:bg-green-100';
    }
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

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Roles</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <Button onClick={() => navigate(getCreateRoleRoute())}>
          <PlusIcon className="mr-2 h-4 w-4" /> Create Role
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
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
              Roles ({filteredRoles.length})
              {filteredRoles.length !== roles.length && (
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  of {roles.length} total
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
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
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
                              <Badge variant="outline">Custom</Badge>
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

              {/* Card view (visible only on mobile) */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredRoles.map((role: Role) => (
                  <Card key={role.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="px-4 py-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Shield className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium capitalize">{role.name}</h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
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
                      </div>
                      <div className="mt-2 flex justify-between items-end">
                        <div className="text-sm text-muted-foreground">
                          {role.description || 'No description'}
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <Badge className={getRoleBadgeColor(role.name)}>{role.name}</Badge>
                          {role.isSystem ? (
                            <Badge
                              variant="secondary"
                              className="bg-yellow-100 text-yellow-800 text-xs"
                            >
                              System
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Custom
                            </Badge>
                          )}
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
