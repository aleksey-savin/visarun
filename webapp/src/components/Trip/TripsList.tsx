import { useState } from 'react';
import TripCard from './TripCard';
import { Trip } from '@/types/trip';

interface TripsListProps {
  trips: Trip[];
}

const TripsList = ({ trips }: TripsListProps) => {
  const [activeTab, setActiveTab] = useState(trips[0]?.route.routeStops[0]?.id || '');

  if (trips.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-lg">No trips available for this date</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      {trips.map(trip => (
        <TripCard key={trip.id} trip={trip} activeTab={activeTab} setActiveTab={setActiveTab} />
      ))}
    </div>
  );
};

export default TripsList;
