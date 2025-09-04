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
  CircleCheck,
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
import { FilterContainer, FilterFields, FilterField } from '@/components/Filters';

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
    visasToApplyTimeFilter: 'today' as 'today' | 'later',
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
  const [visasToApplyTimeFilter, setVisasToApplyTimeFilter] = useState<'today' | 'later'>(
    initialState.visasToApplyTimeFilter
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
      visasToApplyTimeFilter,
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
    visasToApplyTimeFilter,
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
    setVisasToApplyTimeFilter(defaultFilters.visasToApplyTimeFilter);
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

  // Helper function to determine if a visa should be in "today" filter
  const isVisaForToday = (va: any) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // For visas with status ready, denied, cancelled - always in today
    if (['approved', 'denied', 'cancelled'].includes(va.status)) {
      return true;
    }

    // For awaiting_approval - check if needs attention (stamp required or check readiness)
    if (va.status === 'awaiting_approval') {
      // Stamp required - if stamp not received and exit date is in the past
      const stampRequired =
        !va.stampIsRecieved &&
        va.plannedCountryExitDate &&
        new Date(va.plannedCountryExitDate) < new Date();

      // Check readiness - if no fixed processing time and entry date is within 5 days
      const checkReadiness =
        !va.visaType?.processingValueFixed &&
        va.plannedCountryEntryDate &&
        new Date(va.plannedCountryEntryDate) <= new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

      const result = stampRequired || checkReadiness;
      return result;
    }

    // For other statuses, check processing logic
    if (!va.visaType) {
      return false;
    }

    // For approximate processing mode - same day as created
    if (va.visaType.processingMode === 'approximate' && va.createdAt) {
      const createdDate = new Date(va.createdAt);
      const createdDay = new Date(
        createdDate.getFullYear(),
        createdDate.getMonth(),
        createdDate.getDate()
      );
      const result = createdDay.getTime() === today.getTime();
      return result;
    }

    // For fixed processing mode
    if (va.visaType.processingMode === 'fixed' && va.plannedCompletionDate) {
      const plannedDate = new Date(va.plannedCompletionDate);
      const plannedDay = new Date(
        plannedDate.getFullYear(),
        plannedDate.getMonth(),
        plannedDate.getDate()
      );

      if (va.visaType.processingUnit === 'hours') {
        // For fixed hours - one day before plannedCompletionDate
        const dayBefore = new Date(plannedDay);
        dayBefore.setDate(dayBefore.getDate() - 1);
        const result = dayBefore.getTime() <= today.getTime();
        return result;
      } else if (va.visaType.processingUnit === 'days' && va.visaType.processingValueFixed) {
        // For fixed days - plannedCompletionDate minus processing days minus one more day
        const targetDate = new Date(plannedDay);
        targetDate.setDate(targetDate.getDate() - va.visaType.processingValueFixed - 1);
        const result = targetDate.getTime() <= today.getTime();
        return result;
      }
    }

    return false;
  };

  // Filter visa applications based on selected status group filter
  const visaApplications = useMemo(() => {
    let filtered = allVisaApplications;

    // First apply status group filter
    if (selectedStatusGroupFilter === 'visas-to-apply') {
      filtered = allVisaApplications.filter(
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
      filtered = allVisaApplications.filter(va => va.status === 'draft');
    } else if (selectedStatusGroupFilter === 'archived') {
      filtered = allVisaApplications.filter(va => va.isArchived === true);
    }

    // Then apply today/later filter to ALL visas (not just visas-to-apply)
    if (selectedStatusGroupFilter === 'visas-to-apply') {
      if (visasToApplyTimeFilter === 'today') {
        filtered = filtered.filter(isVisaForToday);
      } else {
        // For "later" - show ALL visas that don't fit today criteria
        filtered = filtered.filter(va => !isVisaForToday(va));
      }
    }

    return filtered;
  }, [allVisaApplications, selectedStatusGroupFilter, visasToApplyTimeFilter]);

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

  return (
    <div className="min-h-screen">
      <div className="grid gap-6 p-6">
        <FilterContainer onClearFilters={resetFilters}>
          <FilterFields>
            <FilterField label="Status">
              <Select
                value={selectedStatusGroupFilter}
                onValueChange={setSelectedStatusGroupFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visas-to-apply">Visas in work</SelectItem>
                  <SelectItem value="drafts">Drafts</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>

            {selectedStatusGroupFilter === 'visas-to-apply' && (
              <FilterField label="Time">
                <div className="flex items-center gap-2">
                  <Button
                    variant={visasToApplyTimeFilter === 'today' ? 'default' : 'ghost'}
                    onClick={() => setVisasToApplyTimeFilter('today')}
                  >
                    Today
                  </Button>
                  <Button
                    variant={visasToApplyTimeFilter === 'later' ? 'default' : 'ghost'}
                    onClick={() => setVisasToApplyTimeFilter('later')}
                  >
                    Later
                  </Button>
                </div>
              </FilterField>
            )}

            <FilterField label="Search">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </FilterField>

            <FilterField label="Country">
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
            </FilterField>

            <FilterField label="Visa Type">
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
            </FilterField>
            <div className="flex gap-2 items-end pb-1.5 pt-4 md:pt-0">
              <div className="flex items-center gap-2">
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
          </FilterFields>
        </FilterContainer>

        {/* Loading state */}
        {isLoading && (
          <Card className="rounded-md py-0">
            <CardContent className="p-0">
              <div className="flex justify-center items-center p-8 ">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error state */}
        {isError && (
          <Card className="rounded-md py-0">
            <CardContent className="p-0">
              <div className="p-6 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
                <h3 className="font-medium text-lg mb-2">Error Loading Visa Applications</h3>
                <p>{error.message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {visaApplications.length === 0 && !isLoading && !isError && (
          <Card className="rounded-md py-0">
            <CardContent className="p-0">
              <div className="text-center py-8 text-gray-400">No visa applications found</div>
            </CardContent>
          </Card>
        )}

        {/* Desktop Table View */}
        {visaApplications.length > 0 && !isLoading && !isError && (
          <>
            <Card className="rounded-md py-0 hidden md:block">
              <CardContent className="p-0">
                <div className="overflow-x-auto rounded-md border border-muted">
                  <Table className="text-gray-400">
                    <TableHeader>
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
                          const nameA =
                            `${clientA.firstName || ''} ${clientA.lastName || ''}`.trim();
                          const nameB =
                            `${clientB.firstName || ''} ${clientB.lastName || ''}`.trim();
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
                          const showClientBadge =
                            !previousClient || previousClient.id !== client.id;
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
                                  {application.isMultientry && (
                                    <Badge variant="accent">Multi</Badge>
                                  )}
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
                                      new Date() &&
                                    new Date(stampUntilDate) > new Date() &&
                                    !application.stampIsRecieved ? (
                                      <Badge className="bg-warning">
                                        {formatDate(stampUntilDate)} {formatTime(stampUntilDate)}{' '}
                                        <CircleAlert />
                                      </Badge>
                                    ) : new Date(stampUntilDate) < new Date() &&
                                      !application.stampIsRecieved ? (
                                      <Badge className="bg-destructive">
                                        {formatDate(stampUntilDate)} {formatTime(stampUntilDate)}
                                        <TriangleAlert />
                                      </Badge>
                                    ) : application.stampIsRecieved ? (
                                      <Badge className="bg-success">
                                        {formatDate(stampUntilDate)} {formatTime(stampUntilDate)}
                                        <CircleCheck />
                                      </Badge>
                                    ) : (
                                      <span>
                                        {formatDate(stampUntilDate)} {formatTime(stampUntilDate)}
                                      </span>
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
              </CardContent>
            </Card>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {groupedVisaApplications.map(({ orderId, applications }) => {
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

                return (
                  <div key={orderId} className="space-y-2">
                    {sortedApplications.map((application, index) => {
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

                      return (
                        <Card
                          key={application.id}
                          className={cn(
                            'p-4 relative',
                            hasMultipleInGroup && !isLastInGroup ? 'mb-2' : ''
                          )}
                        >
                          {/* Left border indicator for grouped items */}
                          {hasMultipleInGroup && (
                            <div
                              className={`absolute left-0 w-1 bg-purple-900 ${
                                isFirstInGroup
                                  ? 'top-4 bottom-0 rounded-t'
                                  : isLastInGroup
                                    ? 'top-0 bottom-4 rounded-b'
                                    : 'top-0 bottom-0'
                              }`}
                            />
                          )}

                          <CardContent className="p-0 space-y-3">
                            {/* Client Badge */}
                            {showClientBadge && (
                              <div className="flex justify-between items-start">
                                <ClientBadge
                                  client={client}
                                  showLinkedClients={false}
                                  stepStatus="submitted"
                                />
                              </div>
                            )}

                            {/* Country and Type */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="font-medium text-white">
                                    {application.country.name}
                                  </h3>
                                  <div className="flex items-center gap-2 text-sm text-gray-400">
                                    {application.visaType && application.visaType.name}
                                    {application.isMultientry && (
                                      <Badge variant="accent">Multi</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Dates */}
                            <div className="space-y-2 text-sm">
                              {readinessDate && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Readiness:</span>
                                  <span className="text-gray-300">
                                    {formatDate(readinessDate)} {formatTime(readinessDate)}
                                  </span>
                                </div>
                              )}

                              {startDate && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Start:</span>
                                  <span className="text-gray-300">
                                    {formatDate(startDate)} {formatTime(startDate)}
                                  </span>
                                </div>
                              )}

                              {stampUntilDate && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Stamp until:</span>
                                  <div>
                                    {new Date(application.plannedCountryExitDate || '') <
                                      new Date() &&
                                    new Date(stampUntilDate) > new Date() &&
                                    !application.stampIsRecieved ? (
                                      <Badge className="bg-warning text-xs">
                                        {formatDate(stampUntilDate)} {formatTime(stampUntilDate)}{' '}
                                        <CircleAlert className="w-3 h-3 ml-1" />
                                      </Badge>
                                    ) : new Date(stampUntilDate) < new Date() &&
                                      !application.stampIsRecieved ? (
                                      <Badge className="bg-destructive text-xs">
                                        {formatDate(stampUntilDate)} {formatTime(stampUntilDate)}
                                        <TriangleAlert className="w-3 h-3 ml-1" />
                                      </Badge>
                                    ) : application.stampIsRecieved ? (
                                      <Badge className="bg-success text-xs">
                                        {formatDate(stampUntilDate)} {formatTime(stampUntilDate)}
                                        <CircleCheck className="w-3 h-3 ml-1" />
                                      </Badge>
                                    ) : (
                                      <span className="text-gray-300">
                                        {formatDate(stampUntilDate)} {formatTime(stampUntilDate)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">{statusButton.component}</div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AllVisaApplicationsPage;
