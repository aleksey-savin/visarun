import { getCreateCitizenshipRoute, getViewCitizenshipRoute } from '../../lib/routes';
import { trpc } from '../../lib/trpcProvider';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusIcon, Users, Star, StarOff } from 'lucide-react';
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

// Define a type for the citizenship based on your Prisma schema
type Citizenship = {
  id: string;
  name: string;
  favourite: boolean;
  _count: {
    visaFree: number;
    blacklisted: number;
    surcharges: number;
  };
};

const AllCitizenshipsPage = () => {
  const navigate = useNavigate();
  const { data, error, isLoading, isError } = trpc.citizenship.getAll.useQuery();

  return (
    <>
      <div className="flex sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="text-3xl sm:text-5xl font-semibold capitalize">All citizenships</div>
        <Button onClick={() => navigate(getCreateCitizenshipRoute())}>
          <PlusIcon className="mr-2 h-4 w-4" /> Create Citizenship
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {data?.citizenships && (
        <>
          {/* Table view (hidden on mobile) */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Citizenship Name</TableHead>
                  <TableHead className="w-[100px]">Favourite</TableHead>
                  <TableHead className="w-[100px]">Visa Free</TableHead>
                  <TableHead className="w-[100px]">Blacklisted</TableHead>
                  <TableHead className="w-[100px]">Surcharges</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.citizenships.map((citizenship: Citizenship) => (
                  <TableRow
                    key={citizenship.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(getViewCitizenshipRoute({ id: citizenship.id }))}
                  >
                    <TableCell>
                      <Link
                        to={getViewCitizenshipRoute({ id: citizenship.id })}
                        className="flex items-center space-x-2 font-medium"
                      >
                        <Users className="h-4 w-4 text-primary" />
                        <span>{citizenship.name}</span>
                      </Link>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Card view (visible only on mobile) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {data.citizenships.map((citizenship: Citizenship) => (
              <Card
                key={citizenship.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(getViewCitizenshipRoute({ id: citizenship.id }))}
              >
                <CardContent className="px-4 py-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{citizenship.name}</h3>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {citizenship.favourite && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between text-sm text-muted-foreground">
                    <span>Visa Free: {citizenship._count.visaFree}</span>
                    <span>Blacklisted: {citizenship._count.blacklisted}</span>
                    <span>Surcharges: {citizenship._count.surcharges}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {isError && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <h3 className="font-medium text-lg mb-2">Error Loading Citizenships</h3>
          <p>{error.message}</p>
        </div>
      )}

      {data?.citizenships && data.citizenships.length === 0 && (
        <div className="p-12 text-center border rounded-lg">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No citizenships found</h3>
          <p className="text-muted-foreground mb-4">Get started by creating a new citizenship.</p>
          <Button onClick={() => navigate(getCreateCitizenshipRoute())}>
            <PlusIcon className="mr-2 h-4 w-4" /> Create Citizenship
          </Button>
        </div>
      )}
    </>
  );
};

export default AllCitizenshipsPage;
