import { useState, useMemo, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TripsList from '@/components/Trip/TripsList';

const AllVisarunTripsPage = () => {
  const [fromDate, setFromDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [toDate, setToDate] = useState(() => {
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 7);
    const year = tenDaysFromNow.getFullYear();
    const month = String(tenDaysFromNow.getMonth() + 1).padStart(2, '0');
    const day = String(tenDaysFromNow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [activeTab, setActiveTab] = useState('');

  // Query trips for the specific date range
  const { data: trips } = trpc.visarunTrip.getAll.useQuery(
    {
      departureFrom: fromDate,
      departureTo: toDate,
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds (30000ms)
    }
  );

  // Group trips by date
  const tripsByDate = useMemo(() => {
    if (!trips) return {};

    const grouped = trips.reduce(
      (acc, trip) => {
        const dateKey = new Date(trip.departureDateTime).toDateString();
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(trip);
        return acc;
      },
      {} as Record<string, any[]>
    );

    return grouped;
  }, [trips]);

  const dateKeys = Object.keys(tripsByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  // Set default active tab to first date or empty if no trips
  useEffect(() => {
    if (dateKeys.length > 0 && !activeTab) {
      setActiveTab(dateKeys[0]);
    } else if (dateKeys.length === 0) {
      setActiveTab('');
    }
  }, [dateKeys, activeTab]);

  const formatDateTab = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const daysToAdd = direction === 'next' ? 7 : -7;

    const newFromDate = new Date(fromDate);
    newFromDate.setDate(newFromDate.getDate() + daysToAdd);

    const newToDate = new Date(toDate);
    newToDate.setDate(newToDate.getDate() + daysToAdd);

    const fromYear = newFromDate.getFullYear();
    const fromMonth = String(newFromDate.getMonth() + 1).padStart(2, '0');
    const fromDay = String(newFromDate.getDate()).padStart(2, '0');
    setFromDate(`${fromYear}-${fromMonth}-${fromDay}`);

    const toYear = newToDate.getFullYear();
    const toMonth = String(newToDate.getMonth() + 1).padStart(2, '0');
    const toDay = String(newToDate.getDate()).padStart(2, '0');
    setToDate(`${toYear}-${toMonth}-${toDay}`);
    setActiveTab(''); // Reset active tab to allow auto-selection of first date
  };

  return (
    <div className="flex flex-wrap gap-4 p-6 items-center">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="icon"
              onClick={() => navigateWeek('prev')}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {dateKeys.length > 0 ? (
              <TabsList className="flex-1">
                {dateKeys.map(dateKey => (
                  <TabsTrigger className="border-none" key={dateKey} value={dateKey}>
                    {formatDateTab(dateKey)}
                    <Badge variant="secondary" className="rounded-full text-xs bg-secondary">
                      {tripsByDate[dateKey].length}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            ) : (
              <div className="flex-1 text-center py-2 text-muted-foreground">
                No trips for this period
              </div>
            )}

            <Button
              variant="primary"
              size="icon"
              onClick={() => navigateWeek('next')}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {/* Date Filters */}
          <div className="flex gap-1 items-center">
            <div className="space-y-2">
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center">
              <div className="space-y-2">
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        {dateKeys.length > 0 && (
          <>
            {dateKeys.map(dateKey => (
              <TabsContent key={dateKey} value={dateKey} className="mt-4">
                <TripsList trips={tripsByDate[dateKey]} />
              </TabsContent>
            ))}
          </>
        )}
      </Tabs>
    </div>
  );
};

export default AllVisarunTripsPage;
