import { useState } from 'react';
import { getCreateUserRoute } from '../../lib/routes';
import { trpc } from '../../lib/trpcProvider';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusIcon, User, Mail, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react';
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
  contactMethods?: {
    id: string;
    method: {
      name: string;
    };
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
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const { data, error, isLoading, isError, refetch } = trpc.user.getAll.useQuery();

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

  // Filter users on the frontend
  const users = data?.users || [];
  const filteredUsers = users.filter(user => {
    const fullName = formatName(user);
    const matchesSearch =
      searchTerm === '' ||
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const userRoles = user.roleAssignments.map(assignment => assignment.role.name);
    const matchesRole =
      selectedRoleFilter === 'all' ||
      (selectedRoleFilter === 'no-roles' && userRoles.length === 0) ||
      userRoles.includes(selectedRoleFilter);

    return matchesSearch && matchesRole;
  });

  // Get unique roles for filter dropdown
  const allRoles = users.flatMap(user =>
    user.roleAssignments.map(assignment => assignment.role.name)
  );
  const uniqueRoles = [...new Set(allRoles)];

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage system users and their roles</p>
        </div>
        <Button onClick={() => navigate(getCreateUserRoute())}>
          <PlusIcon className="mr-2 h-4 w-4" /> Create User
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
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={selectedRoleFilter} onValueChange={setSelectedRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="no-roles">No roles</SelectItem>
                  {uniqueRoles.map(role => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
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
              Users ({filteredUsers.length})
              {filteredUsers.length !== users.length && (
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  of {users.length} total
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
              <h3 className="font-medium text-lg mb-2">Error Loading Users</h3>
              <p>{error.message}</p>
            </div>
          )}

          {filteredUsers.length === 0 && !isLoading && !isError ? (
            <div className="text-center py-8 text-muted-foreground">
              {users.length === 0
                ? 'No users found. Create one to get started.'
                : 'No users match your current filters.'}
            </div>
          ) : (
            <>
              {/* Table view (hidden on mobile) */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user: User) => (
                        <TableRow key={user.id} className="hover:bg-muted/50">
                          <TableCell>
                            <Link to={`/users/${user.id}`} className="hover:underline">
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
                                <Badge variant="outline">No roles</Badge>
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

              {/* Card view (visible only on mobile) */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredUsers.map((user: User) => (
                  <Card key={user.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="px-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{formatName(user)}</h3>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Mail className="mr-1 h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
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
                      </div>
                      <div className="flex justify-between items-end pt-2">
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
                            <Badge variant="outline">No roles</Badge>
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
