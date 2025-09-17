import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
import { AlertTriangle, Edit, Search, Trash2, X, Users, Truck, Settings } from 'lucide-react';
import { getEditTransportRoute } from '@/lib/routes';
import { IconDisplay } from '@/components/ui/icon-display';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SeatDistributionManager from '@/components/Transport/SeatDistributionManager';

export default function TransportsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [transportTypeFilter, setTransportTypeFilter] = useState<string>('ALL');
  const [selectedTransportForSeats, setSelectedTransportForSeats] = useState<string | null>(null);
  const [seatDialogOpen, setSeatDialogOpen] = useState(false);

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
      <div className="grid gap-3 sm:gap-4 lg:gap-6 p-4 sm:p-6 pb-0">
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

        {isLoading ? (
          <div className="flex justify-center items-center p-4 sm:p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : transports.length === 0 ? (
          <div className="text-center py-4 sm:py-8 text-muted-foreground">
            No transports found matching your criteria.
          </div>
        ) : (
          <>
            {/* Table view (hidden on mobile) */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto rounded-md border border-muted">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted hover:bg-gray-800/50">
                      <TableHead className="w-16">Icon</TableHead>
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
                        <TableCell className="w-16">
                          <IconDisplay
                            iconFilename={transport.transportType?.icon || undefined}
                            iconType="transport-type"
                            alt={transport.transportType?.name}
                            size="md"
                            fallback={<Truck className="h-6 w-6 text-muted-foreground" />}
                          />
                        </TableCell>
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
                            <div className="space-y-1">
                              {transport.seatDistribution &&
                              transport.seatDistribution.length > 0 ? (
                                <div className="space-y-1">
                                  {transport.seatDistribution.map(dist => (
                                    <div key={dist.id} className="flex items-center gap-1 text-sm">
                                      <IconDisplay
                                        iconFilename={dist.seatClass?.icon || undefined}
                                        iconType="transport-seat"
                                        className="w-3 h-3"
                                        fallback={<span className="w-3 h-3 text-xs">💺</span>}
                                      />
                                      <span className="text-xs">
                                        {dist.seatClass?.name}: {dist.seatCount}
                                      </span>
                                    </div>
                                  ))}
                                  <div className="flex items-center gap-2 text-sm pt-1 border-t">
                                    <Users className="w-3 h-3" />
                                    <span>
                                      {transport.seatDistributionSummary?.totalAllocatedSeats || 0}{' '}
                                      / {transport.seatDistributionSummary?.totalCapacity || 0}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">
                                  Not configured
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                setSelectedTransportForSeats(transport.id);
                                setSeatDialogOpen(true);
                              }}
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              Seats
                            </Button>
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
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {transports.map(transport => (
                <Card key={transport.id} className="border border-muted">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Link
                        to={getEditTransportRoute({ id: transport.id })}
                        className="hover:underline flex-1"
                      >
                        <CardTitle className="text-base">
                          <div className="flex items-center space-x-3">
                            <IconDisplay
                              iconFilename={transport.transportType?.icon || undefined}
                              iconType="transport-type"
                              alt={transport.transportType?.name}
                              size="md"
                              fallback={<Truck className="h-6 w-6 text-muted-foreground" />}
                            />
                            <span className="font-medium text-foreground">{transport.name}</span>
                          </div>
                        </CardTitle>
                      </Link>
                      <Badge variant="outline" className="text-xs">
                        {transport.transportType?.name || 'N/A'}
                      </Badge>
                    </div>
                    {transport.description && (
                      <p className="text-sm text-muted-foreground mt-1">{transport.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Seat Count:</span>
                        <span className="text-sm font-medium">{transport.seatCount || 'N/A'}</span>
                      </div>
                      {transport.seatCount && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-muted-foreground">Seat Distribution:</span>
                          <div className="text-right">
                            {transport.seatDistribution && transport.seatDistribution.length > 0 ? (
                              <div className="space-y-1">
                                {transport.seatDistribution.map(dist => (
                                  <div key={dist.id} className="flex items-center gap-1 text-sm">
                                    <IconDisplay
                                      iconFilename={dist.seatClass?.icon || undefined}
                                      iconType="transport-seat"
                                      className="w-3 h-3"
                                      fallback={<span className="w-3 h-3 text-xs">💺</span>}
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      {dist.seatClass?.name}: {dist.seatCount}
                                    </span>
                                  </div>
                                ))}
                                <div className="flex items-center gap-2 text-sm mt-2">
                                  <Users className="w-3 h-3" />
                                  <span>
                                    {transport.seatDistributionSummary?.totalAllocatedSeats || 0} /{' '}
                                    {transport.seatDistributionSummary?.totalCapacity || 0}
                                  </span>
                                </div>
                                {transport.seatDistributionSummary?.remainingSeats !==
                                  undefined && (
                                  <div className="text-xs text-muted-foreground">
                                    {transport.seatDistributionSummary.remainingSeats} remaining
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Not configured</span>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTransportForSeats(transport.id);
                            setSeatDialogOpen(true);
                          }}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Seats
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate(getEditTransportRoute({ id: transport.id }))}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Transport</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this transport? This action cannot
                                be undone.
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Seat Distribution Dialog */}
      <Dialog open={seatDialogOpen} onOpenChange={setSeatDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seat Distribution Management</DialogTitle>
            <DialogDescription>
              Configure how seats are distributed across different seat classes for this transport.
            </DialogDescription>
          </DialogHeader>
          {selectedTransportForSeats && (
            <SeatDistributionManager
              transportId={selectedTransportForSeats}
              totalCapacity={
                transportsData?.transports.find(t => t.id === selectedTransportForSeats)
                  ?.seatCount || 0
              }
              onDistributionUpdated={() => {
                refetch();
                setSeatDialogOpen(false);
                setSelectedTransportForSeats(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
