import { getCreateUserRoute } from '../../lib/routes';
import { trpc } from '../../lib/trpcProvider';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusIcon, User, Mail, UsersIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Define a type for the user based on your Prisma schema
type User = {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string;
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
  const { data, error, isLoading, isError } = trpc.user.getAll.useQuery();

  const formatName = (user: User) => {
    return `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName}`;
  };

  return (
    <>
      <div className="flex sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="text-3xl sm:text-5xl font-semibold capitalize">All users</div>
        <Button onClick={() => navigate(getCreateUserRoute())}>
          <PlusIcon className="mr-2 h-4 w-4" /> Create User
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {data?.users && (
        <>
          {/* Table view (hidden on mobile) */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.map((user: User) => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/users/${user.id}`)}
                  >
                    <TableCell>
                      <Link to={`/users/${user.id}`}>{formatName(user)}</Link>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Card view (visible only on mobile) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {data.users.map((user: User) => (
              <Card
                key={user.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/users/${user.id}`)}
              >
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

      {isError && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <h3 className="font-medium text-lg mb-2">Error Loading Users</h3>
          <p>{error.message}</p>
        </div>
      )}

      {data?.users && data.users.length === 0 && (
        <div className="p-12 text-center border rounded-lg">
          <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No users found</h3>
          <p className="text-muted-foreground mb-4">Get started by creating a new user.</p>
          <Button onClick={() => navigate(getCreateUserRoute())}>
            <PlusIcon className="mr-2 h-4 w-4" /> Create User
          </Button>
        </div>
      )}
    </>
  );
};

export default AllUsersPage;
