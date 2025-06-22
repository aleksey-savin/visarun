import { getCreateCountryRoute, getViewCountryRoute } from '../../lib/routes';
import { trpc } from '../../lib/trpcProvider';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusIcon, Globe, CheckCircle, XCircle } from 'lucide-react';
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

// Define a type for the country based on your Prisma schema
type Country = {
  id: string;
  name: string;
  eVisaAvailable: boolean;
  multivisaAvailable: boolean;
  _count: {
    cities: number;
    visaFree: number;
    blacklisted: number;
  };
};

const AllCountriesPage = () => {
  const navigate = useNavigate();
  const { data, error, isLoading, isError } = trpc.country.getAll.useQuery();

  return (
    <>
      <div className="flex sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="text-3xl sm:text-5xl font-semibold capitalize">All countries</div>
        <Button onClick={() => navigate(getCreateCountryRoute())}>
          <PlusIcon className="mr-2 h-4 w-4" /> Create Country
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {data?.countries && (
        <>
          {/* Table view (hidden on mobile) */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Country Name</TableHead>
                  <TableHead className="w-[120px]">eVisa Available</TableHead>
                  <TableHead className="w-[140px]">Multivisa Available</TableHead>
                  <TableHead className="w-[80px]">Cities</TableHead>
                  <TableHead className="w-[100px]">Visa Free</TableHead>
                  <TableHead className="w-[100px]">Blacklisted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.countries.map((country: Country) => (
                  <TableRow
                    key={country.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(getViewCountryRoute({ id: country.id }))}
                  >
                    <TableCell>
                      <Link
                        to={getViewCountryRoute({ id: country.id })}
                        className="flex items-center space-x-2 font-medium"
                      >
                        <Globe className="h-4 w-4 text-primary" />
                        <span>{country.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {country.eVisaAvailable ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </TableCell>
                    <TableCell>
                      {country.multivisaAvailable ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{country._count.cities}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {country._count.visaFree}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        {country._count.blacklisted}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Card view (visible only on mobile) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {data.countries.map((country: Country) => (
              <Card
                key={country.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(getViewCountryRoute({ id: country.id }))}
              >
                <CardContent className="px-4 py-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Globe className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{country.name}</h3>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <div className="flex gap-1">
                        {country.eVisaAvailable && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                            eVisa
                          </Badge>
                        )}
                        {country.multivisaAvailable && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                            Multivisa
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between text-sm text-muted-foreground">
                    <span>Cities: {country._count.cities}</span>
                    <span>Visa Free: {country._count.visaFree}</span>
                    <span>Blacklisted: {country._count.blacklisted}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {isError && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <h3 className="font-medium text-lg mb-2">Error Loading Countries</h3>
          <p>{error.message}</p>
        </div>
      )}

      {data?.countries && data.countries.length === 0 && (
        <div className="p-12 text-center border rounded-lg">
          <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No countries found</h3>
          <p className="text-muted-foreground mb-4">Get started by creating a new country.</p>
          <Button onClick={() => navigate(getCreateCountryRoute())}>
            <PlusIcon className="mr-2 h-4 w-4" /> Create Country
          </Button>
        </div>
      )}
    </>
  );
};

export default AllCountriesPage;
