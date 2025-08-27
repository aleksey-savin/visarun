import { useState, useMemo, useEffect } from 'react';
import { trpc } from '../../lib/trpcProvider';

import {
  CircleX,
  CircleAlert,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  TriangleAlert,
  RotateCcw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import { Card, CardContent } from '@/components/ui/card';
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

import ClientBadge from '@/components/Order/sections/ClientSection/ClientBadge';
import { SubmitStatusDialog } from '@/components/VisaApplication/StatusesDialogs/Submit';
import { InProcessStatusDialog } from '@/components/VisaApplication/StatusesDialogs/InProcess';
import { ReadyStatusDialog } from '@/components/VisaApplication/StatusesDialogs/Ready';
import { DraftStatusDialog } from '@/components/VisaApplication/StatusesDialogs/Draft';
import { DeniedStatusDialog } from '@/components/VisaApplication/StatusesDialogs/Denied';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CancelledStatusDialog } from '@/components/VisaApplication/StatusesDialogs/Cancelled';
import { RefundStatusDialog } from '@/components/VisaApplication/StatusesDialogs/Refund';

// Get status badge styling
const getStatusButton = (application: any) => {
  const status = application.status;
  switch (status) {
    case 'draft':
      return {
        component: <DraftStatusDialog application={application} />,
      };
    case 'pending_submit':
      return {
        component: <SubmitStatusDialog application={application} />,
      };
    case 'awaiting_approval':
      return {
        component: <InProcessStatusDialog application={application} />,
      };
    case 'approved':
      return {
        component: <ReadyStatusDialog application={application} />,
      };
    case 'pending_refund':
      return {
        component: <RefundStatusDialog application={application} />,
      };
    case 'refunded':
      return {
        variant: 'default' as const,
        className: 'bg-transparent text-[#FAFAFA] border-transparent w-32  hover:bg-gray-800',
        text: 'Refunded',
        icon: <CircleX className="text-destructive" />,
      };
    case 'cancelled':
      return {
        component: <CancelledStatusDialog application={application} />,
      };
    case 'denied':
      return {
        component: <DeniedStatusDialog application={application} />,
      };

    default:
      return { variant: 'secondary' as const, className: 'w-32', text: 'Submit', icon: null };
  }
};

const AllVisaApplicationsPage = () => {
  // Local storage key for persisting filters and sorting
  const STORAGE_KEY = 'visaApplicationsFilters';

  // Default filter state
  const defaultFilters = {
    searchTerm: '',
    selectedCountryFilter: 'all',
    selectedVisaTypeFilter: 'all',
    selectedStatusGroupFilter: 'visas-to-apply',
    sortField: null as string | null,
    sortDirection: 'asc' as 'asc' | 'desc',
    groupByOrder: true,
  };

  // Load initial state from localStorage
  const getInitialState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultFilters, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load filters from localStorage:', error);
    }
    return defaultFilters;
  };

  const initialState = getInitialState();

  const [searchTerm, setSearchTerm] = useState(initialState.searchTerm);
  const [selectedCountryFilter, setSelectedCountryFilter] = useState(
    initialState.selectedCountryFilter
  );
  const [selectedVisaTypeFilter, setSelectedVisaTypeFilter] = useState(
    initialState.selectedVisaTypeFilter
  );
  const [selectedStatusGroupFilter, setSelectedStatusGroupFilter] = useState(
    initialState.selectedStatusGroupFilter
  );
  const [sortField, setSortField] = useState<string | null>(initialState.sortField);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialState.sortDirection);
  const [groupByOrder, setGroupByOrder] = useState(initialState.groupByOrder);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    const filtersToSave = {
      searchTerm,
      selectedCountryFilter,
      selectedVisaTypeFilter,
      selectedStatusGroupFilter,
      sortField,
      sortDirection,
      groupByOrder,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtersToSave));
    } catch (error) {
      console.warn('Failed to save filters to localStorage:', error);
    }
  }, [
    searchTerm,
    selectedCountryFilter,
    selectedVisaTypeFilter,
    selectedStatusGroupFilter,
    sortField,
    sortDirection,
    groupByOrder,
  ]);

  // Reset all filters to default values
  const resetFilters = () => {
    setSearchTerm(defaultFilters.searchTerm);
    setSelectedCountryFilter(defaultFilters.selectedCountryFilter);
    setSelectedVisaTypeFilter(defaultFilters.selectedVisaTypeFilter);
    setSelectedStatusGroupFilter(defaultFilters.selectedStatusGroupFilter);
    setSortField(defaultFilters.sortField);
    setSortDirection(defaultFilters.sortDirection);
    setGroupByOrder(defaultFilters.groupByOrder);
  };

  const { data, error, isLoading, isError } = trpc.visaApplication.getAll.useQuery({
    search: searchTerm || undefined,
    countryId: selectedCountryFilter !== 'all' ? selectedCountryFilter : undefined,
    visaTypeId: selectedVisaTypeFilter !== 'all' ? selectedVisaTypeFilter : undefined,
  });

  // Get unique values for filters
  const allVisaApplications = useMemo(() => data?.visaApplications || [], [data?.visaApplications]);

  // Filter visa applications based on selected status group filter
  const visaApplications = useMemo(() => {
    if (selectedStatusGroupFilter === 'visas-to-apply') {
      return allVisaApplications.filter(
        va =>
          [
            'pending_submit',
            'awaiting_approval',
            'approved',
            'denied',
            'cancelled',
            'pending_refund',
          ].includes(va.status) && !va.isArchived
      );
    } else if (selectedStatusGroupFilter === 'drafts') {
      return allVisaApplications.filter(va => va.status === 'draft');
    } else if (selectedStatusGroupFilter === 'archived') {
      return allVisaApplications.filter(va => va.isArchived === true);
    }
    return allVisaApplications;
  }, [allVisaApplications, selectedStatusGroupFilter]);

  // Sort visa applications
  const sortedVisaApplications = useMemo(() => {
    if (!sortField) return visaApplications;

    return [...visaApplications].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'client':
          aValue =
            `${a.orderItem.client.firstName || ''} ${a.orderItem.client.lastName || ''}`.trim();
          bValue =
            `${b.orderItem.client.firstName || ''} ${b.orderItem.client.lastName || ''}`.trim();
          break;
        case 'country':
          aValue = a.country.name;
          bValue = b.country.name;
          break;
        case 'type':
          aValue = a.visaType?.name || '';
          bValue = b.visaType?.name || '';
          break;
        case 'readinessDate':
          aValue = a.plannedCompletionDate ? new Date(a.plannedCompletionDate) : new Date(0);
          bValue = b.plannedCompletionDate ? new Date(b.plannedCompletionDate) : new Date(0);
          break;
        case 'startDate':
          aValue = a.plannedCountryEntryDate ? new Date(a.plannedCountryEntryDate) : new Date(0);
          bValue = b.plannedCountryEntryDate ? new Date(b.plannedCountryEntryDate) : new Date(0);
          break;
        case 'stampUntil':
          aValue = a.stampUntilDate ? new Date(a.stampUntilDate) : new Date(0);
          bValue = b.stampUntilDate ? new Date(b.stampUntilDate) : new Date(0);
          break;
        case 'status': {
          // Define status hierarchy for sorting
          const statusOrder = {
            draft: 1,
            pending_submit: 2,
            awaiting_approval: 3,
            approved: 4,
            denied: 5,
            pending_refund: 6,
            refunded: 7,
            cancelled: 8,
          };
          aValue = statusOrder[a.status as keyof typeof statusOrder] || 999;
          bValue = statusOrder[b.status as keyof typeof statusOrder] || 999;
          break;
        }
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [visaApplications, sortField, sortDirection]);

  // Group visa applications by orderId or return flat list
  const groupedVisaApplications = useMemo(() => {
    if (!groupByOrder) {
      // Return flat list for ungrouped view
      return sortedVisaApplications.map(application => ({
        orderId: application.orderItem.order.id,
        applications: [application],
      }));
    }

    const groups = new Map<string, typeof sortedVisaApplications>();

    sortedVisaApplications.forEach(application => {
      const orderId = application.orderItem.order.id;
      if (!groups.has(orderId)) {
        groups.set(orderId, []);
      }
      groups.get(orderId)!.push(application);
    });

    return Array.from(groups.entries()).map(([orderId, applications]) => ({
      orderId,
      applications,
    }));
  }, [sortedVisaApplications, groupByOrder]);
  const uniqueCountries = useMemo(() => {
    const countries = allVisaApplications.map(va => va.country);
    return [...new Map(countries.map(c => [c.id, c])).values()];
  }, [allVisaApplications]);

  const uniqueVisaTypes = useMemo(() => {
    const visaTypes = allVisaApplications.map(va => va.visaType).filter(vt => vt !== null);
    return [...new Map(visaTypes.map(vt => [vt!.id, vt!])).values()];
  }, [allVisaApplications]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-blue-400" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-400" />
    );
  };

  // Status count badges
  {
    /* const statusCounts = useMemo(() => {
    const counts = { pending: 0, approved: 0, cancelled: 0, denied: 0, total: 0 };
    allVisaApplications.forEach(va => {
      counts[va.status]++;
      counts.total++;
    });
    return counts;
  }, [allVisaApplications]); */
  }

  return (
    <div className="min-h-screen">
      <div className="grid gap-6 p-6">
        {/* Header with time badges and status counts */}
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Select value={selectedStatusGroupFilter} onValueChange={setSelectedStatusGroupFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visas-to-apply">Visas to apply</SelectItem>
                <SelectItem value="drafts">Drafts</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-between gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCountryFilter} onValueChange={setSelectedCountryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {uniqueCountries.map(country => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedVisaTypeFilter} onValueChange={setSelectedVisaTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All visa types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All visa types</SelectItem>
                {uniqueVisaTypes.map(visaType => (
                  <SelectItem key={visaType.id} value={visaType.id}>
                    {visaType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Switch
                id="group-by-order"
                checked={groupByOrder}
                onCheckedChange={setGroupByOrder}
              />
              <Label htmlFor="group-by-order" className="text-sm font-medium">
                Group by order
              </Label>
            </div>
          </div>
          <Button variant="secondary" onClick={resetFilters} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>

          {/* <Badge className="flex items-center gap-4 bg-muted rounded-lg font-medium text-[#FAFAFA]">
            <span className="text-sm  font-medium">Status</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-2 bg-gray-700 px-3 py-1 rounded-lg">
                <Checkbox
                  id="header-total"
                  checked={Object.values(selectedStatusFilters).every(Boolean)}
                  onCheckedChange={checked =>
                    setSelectedStatusFilters({
                      pending_submit: !!checked,
                      awaiting_approval: !!checked,
                      approved: !!checked,
                      pending_refund: !!checked,
                    })
                  }
                />
                <label
                  htmlFor="header-total"
                  className="text-sm text-white font-medium cursor-pointer"
                >
                  {statusCounts.total}
                </label>
              </div>

              <div className="flex items-center space-x-2 bg-yellow-500 px-3 py-1 rounded-lg">
                <Checkbox
                  id="header-pending"
                  checked={selectedStatusFilters.pending}
                  onCheckedChange={checked =>
                    setSelectedStatusFilters(prev => ({ ...prev, pending: !!checked }))
                  }
                  className="data-[state=checked]:bg-yellow-600 data-[state=checked]:border-yellow-600"
                />
                <label
                  htmlFor="header-pending"
                  className="text-sm text-black font-medium cursor-pointer"
                >
                  {statusCounts.pending}
                </label>
              </div>

              <div className="flex items-center space-x-2 bg-green-500 px-3 py-1 rounded-lg">
                <Checkbox
                  id="header-approved"
                  checked={selectedStatusFilters.approved}
                  onCheckedChange={checked =>
                    setSelectedStatusFilters(prev => ({ ...prev, approved: !!checked }))
                  }
                  className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                />
                <label
                  htmlFor="header-approved"
                  className="text-sm text-white font-medium cursor-pointer"
                >
                  {statusCounts.approved}
                </label>
              </div>

              <div className="flex items-center space-x-2 bg-red-500 px-3 py-1 rounded-lg">
                <Checkbox
                  id="header-denied"
                  checked={selectedStatusFilters.denied}
                  onCheckedChange={checked =>
                    setSelectedStatusFilters(prev => ({ ...prev, denied: !!checked }))
                  }
                  className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                />
                <label
                  htmlFor="header-denied"
                  className="text-sm text-white font-medium cursor-pointer"
                >
                  {statusCounts.denied}
                </label>
              </div>

              <div className="flex items-center space-x-2 bg-red-600 px-3 py-1 rounded-lg">
                <Checkbox
                  id="header-cancelled"
                  checked={selectedStatusFilters.cancelled}
                  onCheckedChange={checked =>
                    setSelectedStatusFilters(prev => ({ ...prev, cancelled: !!checked }))
                  }
                  className="data-[state=checked]:bg-red-700 data-[state=checked]:border-red-700"
                />
                <label
                  htmlFor="header-cancelled"
                  className="text-sm text-white font-medium cursor-pointer"
                >
                  {statusCounts.cancelled}
                </label>
              </div>
            </div>
          </Badge> */}
        </div>
        {/* Main Table */}
        <Card className="rounded-md py-0">
          <CardContent className="p-0">
            {isLoading && (
              <div className="flex justify-center items-center p-8 ">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            )}

            {isError && (
              <div className="p-6 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
                <h3 className="font-medium text-lg mb-2">Error Loading Visa Applications</h3>
                <p>{error.message}</p>
              </div>
            )}

            {visaApplications.length === 0 && !isLoading && !isError ? (
              <div className="text-center py-8 text-gray-400">No visa applications found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="text-gray-400">
                  <TableHeader className=" ">
                    <TableRow className="bg-muted hover:bg-gray-800/50">
                      <TableHead
                        className="text-gray-300 cursor-pointer rounded-tl-sm hover:text-white select-none"
                        onClick={() => handleSort('client')}
                      >
                        <div className="flex items-center gap-2">
                          Client
                          {getSortIcon('client')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-gray-300 cursor-pointer hover:text-white select-none"
                        onClick={() => handleSort('country')}
                      >
                        <div className="flex items-center gap-2">
                          Country
                          {getSortIcon('country')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-gray-300 cursor-pointer hover:text-white select-none"
                        onClick={() => handleSort('type')}
                      >
                        <div className="flex items-center gap-2">
                          Type
                          {getSortIcon('type')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-gray-300 cursor-pointer hover:text-white select-none"
                        onClick={() => handleSort('readinessDate')}
                      >
                        <div className="flex items-center gap-2">
                          Readiness date
                          {getSortIcon('readinessDate')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-gray-300 cursor-pointer hover:text-white select-none"
                        onClick={() => handleSort('startDate')}
                      >
                        <div className="flex items-center gap-2">
                          Start date
                          {getSortIcon('startDate')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-gray-300 cursor-pointer hover:text-white select-none"
                        onClick={() => handleSort('stampUntil')}
                      >
                        <div className="flex items-center gap-2">
                          Stamp until
                          {getSortIcon('stampUntil')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-gray-300 cursor-pointer hover:text-white select-none rounded-tr-sm"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-2 justify-end">
                          Status
                          {getSortIcon('status')}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedVisaApplications.flatMap(({ applications }) => {
                      const rows: any[] = [];
                      let previousClient: any = null;

                      // Sort applications by primary clients first, then by client name within each group
                      const sortedApplications = applications.sort((a, b) => {
                        const clientA = a.orderItem.client;
                        const clientB = b.orderItem.client;

                        // Primary clients go first
                        if (clientA.isPrimary && !clientB.isPrimary) return -1;
                        if (!clientA.isPrimary && clientB.isPrimary) return 1;

                        // If both are primary or both are not primary, sort by name
                        const nameA = `${clientA.firstName || ''} ${clientA.lastName || ''}`.trim();
                        const nameB = `${clientB.firstName || ''} ${clientB.lastName || ''}`.trim();
                        return nameA.localeCompare(nameB);
                      });

                      // Add application rows
                      sortedApplications.forEach((application, index) => {
                        const statusButton = getStatusButton(application);
                        const readinessDate = application.plannedCompletionDate;
                        const startDate = application.plannedCountryEntryDate;
                        const stampUntilDate = application.stampUntilDate;
                        const client = application.orderItem.client;
                        const isFirstInGroup = index === 0;
                        const isLastInGroup = index === sortedApplications.length - 1;
                        const hasMultipleInGroup = sortedApplications.length > 1 && groupByOrder;

                        // Check if current client is the same as previous client
                        const showClientBadge = !previousClient || previousClient.id !== client.id;
                        previousClient = client;

                        rows.push(
                          <TableRow
                            key={application.id}
                            className={cn(
                              'border-gray-700 hover:bg-gray-800/50 relative',
                              hasMultipleInGroup ? 'border-dashed' : '',
                              isLastInGroup ? 'border-solid' : ''
                            )}
                          >
                            {/* Left vertical line indicator */}
                            <TableCell className="relative pl-6">
                              {hasMultipleInGroup && (
                                <div
                                  className={`absolute left-0 w-1 bg-purple-900 ${
                                    isFirstInGroup
                                      ? 'top-1/6 bottom-0'
                                      : isLastInGroup
                                        ? 'top-0 bottom-1/6'
                                        : 'top-0 bottom-0'
                                  }`}
                                />
                              )}
                              {showClientBadge && (
                                <ClientBadge
                                  client={client}
                                  showLinkedClients={false}
                                  stepStatus="submitted"
                                />
                              )}
                            </TableCell>
                            <TableCell>{application.country.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {application.visaType && application.visaType.name}
                                {application.isMultientry && <Badge variant="accent">Multi</Badge>}
                              </div>
                            </TableCell>
                            <TableCell>
                              {readinessDate && (
                                <>
                                  {formatDate(readinessDate)} {formatTime(readinessDate)}
                                </>
                              )}
                            </TableCell>
                            <TableCell>
                              {startDate && (
                                <>
                                  {formatDate(startDate)} {formatTime(startDate)}
                                </>
                              )}
                            </TableCell>
                            <TableCell>
                              {stampUntilDate && (
                                <>
                                  {new Date(application.plannedCountryExitDate || '') <
                                    new Date() && new Date(stampUntilDate) > new Date() ? (
                                    <Badge className="bg-warning">
                                      {formatDate(stampUntilDate)} {formatTime(stampUntilDate)}{' '}
                                      <CircleAlert />
                                    </Badge>
                                  ) : (
                                    new Date(stampUntilDate) < new Date() && (
                                      <Badge className="bg-destructive">
                                        {formatDate(stampUntilDate)} {formatTime(stampUntilDate)}{' '}
                                        <TriangleAlert />
                                      </Badge>
                                    )
                                  )}
                                </>
                              )}
                            </TableCell>
                            <TableCell className="text-right relative pr-6">
                              {/* Right vertical line indicator */}
                              {hasMultipleInGroup && (
                                <div
                                  className={`absolute right-0 w-1 bg-purple-900 ${
                                    isFirstInGroup
                                      ? 'top-1/6 bottom-0'
                                      : isLastInGroup
                                        ? 'top-0 bottom-1/6'
                                        : 'top-0 bottom-0'
                                  }`}
                                />
                              )}
                              <div className="flex items-center justify-end gap-2">
                                {statusButton.component}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      });

                      return rows;
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AllVisaApplicationsPage;
