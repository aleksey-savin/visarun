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
import {
  AlertTriangle,
  Edit,
  Search,
  Trash2,
  X,
  Calendar,
  Clock,
  Route,
  Pause,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
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

const statusConfig = {
  active: {
    label: 'Active',
    color: 'bg-green-500',
    icon: CheckCircle,
    variant: 'default' as const,
  },
  inactive: {
    label: 'Inactive',
    color: 'bg-gray-500',
    icon: Pause,
    variant: 'secondary' as const,
  },
  expired: {
    label: 'Expired',
    color: 'bg-red-500',
    icon: XCircle,
    variant: 'destructive' as const,
  },
  scheduled: {
    label: 'Scheduled',
    color: 'bg-blue-500',
    icon: Clock,
    variant: 'outline' as const,
  },
  incomplete: {
    label: 'Incomplete',
    color: 'bg-yellow-500',
    icon: AlertCircle,
    variant: 'outline' as const,
  },
};

const getDayNames = (daysArray: number[]) => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return daysArray.map(day => dayNames[day]).join(', ');
};

export default function VisarunSchedulesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [routeFilter, setRouteFilter] = useState<string>('ALL');

  const [isActiveFilter, setIsActiveFilter] = useState<string>('ALL');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: routesData } = trpc.visarunRoute.getAll.useQuery({
    includeStops: false,
    includeTransports: false,
    includePrices: false,
    includeSchedules: false,
  });
  const routes: any[] = routesData?.routes || [];

  const {
    data: schedulesData,
    isLoading,
    error,
    refetch,
  } = trpc.visarunSchedule.getAll.useQuery({
    search: debouncedSearchTerm || undefined,
    routeId: routeFilter !== 'ALL' ? routeFilter : undefined,
    isActive: isActiveFilter === 'ALL' ? undefined : isActiveFilter === 'ACTIVE',
    includeTrips: true,
  });

  const schedules: any[] = schedulesData?.schedules || [];

  const deleteScheduleMutation = trpc.visarunSchedule.delete.useMutation({
    onSuccess: () => {
      toast.success('Schedule deleted successfully');
      refetch();
    },
    onError: error => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleDeleteSchedule = (id: string) => {
    deleteScheduleMutation.mutate({ id });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setRouteFilter('ALL');

    setIsActiveFilter('ALL');
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <span>Error loading schedules: {error.message}</span>
        </div>
      </div>
    );
  }

  const routeName = (schedule: any) => {
    return `${schedule.route.routeStops[0].city?.name} - ${schedule.route.routeStops[schedule.route.routeStops.length - 1].city?.name}`;
  };

  return (
    <>
      <div className="grid gap-3 sm:gap-4 lg:gap-6 p-4 sm:p-6 pb-0">
        <FilterContainer onClearFilters={resetFilters}>
          <FilterFields>
            <FilterField label="Search Schedules">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name or route..."
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

            <FilterField label="Route">
              <Select value={routeFilter} onValueChange={value => setRouteFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Routes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Routes</SelectItem>
                  {routes.map(route => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label="Status">
              <Select value={isActiveFilter} onValueChange={value => setIsActiveFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
          </FilterFields>
        </FilterContainer>

        {isLoading ? (
          <div className="flex justify-center items-center p-4 sm:p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-4 sm:py-8 text-muted-foreground">
            No schedules found matching your criteria.
          </div>
        ) : (
          <>
            {/* Table view (hidden on mobile) */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto rounded-md border border-muted">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted hover:bg-gray-800/50">
                      <TableHead>Route</TableHead>
                      <TableHead>Operating Days</TableHead>
                      <TableHead>Departure Time</TableHead>
                      <TableHead>Valid Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Upcoming Trips</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules.map(schedule => {
                      const status = schedule.summary.status;
                      const config = (() => {
                        switch (status) {
                          case 'active':
                            return statusConfig.active;
                          case 'inactive':
                            return statusConfig.inactive;
                          case 'expired':
                            return statusConfig.expired;
                          case 'scheduled':
                            return statusConfig.scheduled;
                          default:
                            return statusConfig.incomplete;
                        }
                      })();
                      const Icon = config.icon;
                      const daysArray = Array.isArray(schedule.daysOfWeek)
                        ? (schedule.daysOfWeek as number[])
                        : [];

                      return (
                        <TableRow key={schedule.id} className="hover:bg-muted/50">
                          <TableCell>
                            <Link
                              to={`/visarun-schedules/${schedule.id}/edit`}
                              className="hover:underline font-medium"
                            >
                              <div className="flex items-center gap-2">
                                <Route className="w-4 h-4 text-muted-foreground" />
                                {routeName(schedule) || 'N/A'}
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{getDayNames(daysArray)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              {schedule.departureTime}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{new Date(schedule.validFrom).toLocaleDateString()}</div>
                              {schedule.validTo && (
                                <div className="text-muted-foreground">
                                  to {new Date(schedule.validTo).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={config.variant} className="gap-1">
                              <Icon className="w-3 h-3" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>{schedule.summary.upcomingTrips}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/visarun-schedules/${schedule.id}/edit`)}
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
                                    <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{schedule.name}"? This action
                                      cannot be undone and will affect any upcoming trips.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteSchedule(schedule.id)}
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
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {schedules.map(schedule => {
                const daysArray = Array.isArray(schedule.daysOfWeek)
                  ? (schedule.daysOfWeek as number[])
                  : [];

                return (
                  <Card key={schedule.id} className="border border-muted">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <Link
                          to={`/visarun-schedules/${schedule.id}/edit`}
                          className="hover:underline flex-1"
                        >
                          <CardTitle className="text-base">
                            <span className="font-medium text-foreground">{schedule.name}</span>
                          </CardTitle>
                        </Link>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {schedule.route?.name || 'N/A'} • {getDayNames(daysArray)} •{' '}
                        {schedule.departureTime}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-end gap-2 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/visarun-schedules/${schedule.id}/edit`)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="flex items-center gap-1">
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{schedule.name}"? This action
                                cannot be undone and will affect any upcoming trips.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSchedule(schedule.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
