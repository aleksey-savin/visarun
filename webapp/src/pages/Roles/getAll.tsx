import { getCreateRoleRoute, getViewRoleRoute } from '../../lib/routes';
import { trpc } from '../../lib/trpcProvider';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusIcon, Shield, ShieldCheckIcon } from 'lucide-react';
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

// Define a type for the role based on your Prisma schema
type Role = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
};

const AllRolesPage = () => {
  const navigate = useNavigate();
  const { data, error, isLoading, isError } = trpc.role.getAll.useQuery();

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

  return (
    <>
      <div className="flex sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="text-3xl sm:text-5xl font-semibold capitalize">All roles</div>
        <Button onClick={() => navigate(getCreateRoleRoute())}>
          <PlusIcon className="mr-2 h-4 w-4" /> Create Role
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {data?.roles && (
        <>
          {/* Table view (hidden on mobile) */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.roles.map((role: Role) => (
                  <TableRow
                    key={role.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(getViewRoleRoute({ id: role.id }))}
                  >
                    <TableCell>
                      <Link
                        to={getViewRoleRoute({ id: role.id })}
                        className="flex items-center space-x-2"
                      >
                        <Badge className={getRoleBadgeColor(role.name)}>{role.name}</Badge>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Card view (visible only on mobile) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {data.roles.map((role: Role) => (
              <Card
                key={role.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(getViewRoleRoute({ id: role.id }))}
              >
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
                  <div className="mt-2 text-sm text-muted-foreground">
                    {role.description || 'No description'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {isError && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <h3 className="font-medium text-lg mb-2">Error Loading Roles</h3>
          <p>{error.message}</p>
        </div>
      )}

      {data?.roles && data.roles.length === 0 && (
        <div className="p-12 text-center border rounded-lg">
          <ShieldCheckIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No roles found</h3>
          <p className="text-muted-foreground mb-4">Get started by creating a new role.</p>
          <Button onClick={() => navigate(getCreateRoleRoute())}>
            <PlusIcon className="mr-2 h-4 w-4" /> Create Role
          </Button>
        </div>
      )}
    </>
  );
};

export default AllRolesPage;
