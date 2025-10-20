import { useState, useMemo, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const AllVisarunTripsPage = () => {
  const [fromDate, setFromDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [toDate, setToDate] = useState(() => {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return sevenDaysFromNow.toISOString().split('T')[0];
  });

  const [activeTab, setActiveTab] = useState('');

  // Query trips for the specific date range
  const { data: trips } = trpc.visarunTrip.getAll.useQuery({
    departureFrom: fromDate,
    departureTo: toDate,
    status: 'scheduled',
  });

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

  return (
    <div className="p-6">
      {/* Date Filters */}
      <div className="mb-6 flex gap-4 items-center">
        <div className="flex gap-2 items-center">
          <div className="space-y-2">
            <Label>From</Label>
            <Input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="space-y-2">
            <Label>To</Label>
            <Input
              id="toDate"
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {dateKeys.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="text-sm">
          <TabsList>
            {dateKeys.map(dateKey => (
              <TabsTrigger className="border-none" key={dateKey} value={dateKey}>
                {formatDateTab(dateKey)}
                <Badge variant="secondary" className="rounded-full text-xs bg-secondary">
                  {tripsByDate[dateKey].length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {dateKeys.map(dateKey => (
            <TabsContent key={dateKey} value={dateKey} className="mt-6">
              <div className="flex flex-col gap-4">
                {tripsByDate[dateKey].map((trip: any) => (
                  <div
                    key={trip.id}
                    className="p-4 border border-gray-200 rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="text-lg font-semibold text-gray-900">
                      {new Date(trip.departureDateTime).toLocaleString()}
                    </div>
                    {/* Add more trip details here as needed */}
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* No trips message */}
      {dateKeys.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No scheduled trips found for the selected date range.</p>
          <p className="text-sm mt-2">Try adjusting your date filters.</p>
        </div>
      )}
    </div>
  );
};

export default AllVisarunTripsPage;
