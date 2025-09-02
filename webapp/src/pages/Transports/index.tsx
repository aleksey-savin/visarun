import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { FilterContainer, FilterFields, FilterField } from '@/components/Filters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { AlertTriangle, Edit, Search, Trash2, X, Plus, Bus, Users } from 'lucide-react';
import { getEditTransportRoute, getCreateTransportRoute } from '@/lib/routes';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function TransportsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [transportTypeFilter, setTransportTypeFilter] = useState<string>('ALL');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: transportTypesData } = trpc.transportType.getAll.useQuery({});
  const transportTypes = transportTypesData?.transportTypes || [];

  const {
    data: transportsData,
    isLoading,
    error,
    refetch,
  } = trpc.transport.getAll.useQuery({
    search: debouncedSearchTerm || undefined,
    transportTypeId: transportTypeFilter !== 'ALL' ? transportTypeFilter : undefined,
  });

  const transports = transportsData?.transports || [];

  const deleteTransportMutation = trpc.transport.delete.useMutation({
    onSuccess: () => {
      toast.success('Transport deleted successfully');
      refetch();
    },
    onError: error => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleDeleteTransport = (id: string) => {
    deleteTransportMutation.mutate({ id });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setTransportTypeFilter('ALL');
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <span>Error loading transports: {error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <CardTitle className="sticky top-0 z-10 border-b flex py-1.5 px-6 justify-between gap-2">
        <div className="flex gap-2 items-center">
          <Bus />
          <span className="font-semibold">Transports</span>
        </div>
        <Button size="sm" onClick={() => navigate(getCreateTransportRoute())} className="relative">
          Create Transport
          <Plus />
        </Button>
      </CardTitle>
      <div className="grid gap-6 p-6 pb-0">
        <FilterContainer onClearFilters={resetFilters}>
          <FilterFields>
            <FilterField label="Search Transports">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </FilterField>

            <FilterField label="Transport Type">
              <Select
                value={transportTypeFilter}
                onValueChange={value => setTransportTypeFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Transport Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Transport Types</SelectItem>
                  {transportTypes.map(transportType => (
                    <SelectItem key={transportType.id} value={transportType.id}>
                      {transportType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
          </FilterFields>
        </FilterContainer>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Transports ({transports.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : transports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transports found matching your criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Seat Count</TableHead>
                      <TableHead>Seat Distribution</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transports.map(transport => (
                      <TableRow key={transport.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Link
                            to={getEditTransportRoute({ id: transport.id })}
                            className="hover:underline font-medium"
                          >
                            {transport.name}
                          </Link>
                        </TableCell>
                        <TableCell>{transport.transportType?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {transport.description || 'No description'}
                          </div>
                        </TableCell>
                        <TableCell>{transport.seatCount || 'N/A'}</TableCell>
                        <TableCell>
                          {transport.seatCount ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="w-3 h-3" />
                                <span>
                                  {transport.seatDistributionSummary?.totalAllocatedSeats || 0} /{' '}
                                  {transport.seatDistributionSummary?.totalCapacity || 0}
                                </span>
                                {transport.seatDistributionSummary?.hasDistribution && (
                                  <Badge variant="secondary" className="text-xs">
                                    Configured
                                  </Badge>
                                )}
                              </div>
                              {transport.seatDistributionSummary?.remainingSeats !== undefined && (
                                <div className="text-xs text-muted-foreground">
                                  {transport.seatDistributionSummary.remainingSeats} remaining
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(getEditTransportRoute({ id: transport.id }))}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Transport</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{transport.name}"? This action
                                    cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteTransport(transport.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
