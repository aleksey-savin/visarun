import { getCreateUserRoute } from '../../lib/routes';
import { trpc } from '../../lib/trpcProvider';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';

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
  role: 'client' | 'manager' | 'admin';
  createdAt: string;
  updatedAt: string;
};

const AllUsersPage = () => {
  const navigate = useNavigate();
  const { data, error, isLoading, isError } = trpc.getAllUsers.useQuery();

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="text-5xl font-semibold capitalize">All users</div>
        <Button onClick={() => navigate(getCreateUserRoute())}>
          <PlusIcon className="mr-2 h-4 w-4" /> Create User
        </Button>
      </div>

      {isLoading && <div>Loading...</div>}
      {data?.users && (
        <>
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
                <TableRow key={user.id}>
                  <TableCell>
                    <Link
                      to={`/users/${user.id}`}
                    >{`${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName}`}</Link>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
      {isError && <div>Error: {error.message}</div>}
    </>
  );
};

export default AllUsersPage;
