import { Label } from '@/components/ui/label';
import { Timer } from 'lucide-react';
import Stopover, { StopoverData } from './Stopover';

type City = {
  id: string;
  name: string;
  country?: { name: string };
};

type PickupLocation = {
  id: string;
  name: string;
  address: string;
  cityId: string;
};

interface StopoverListProps {
  stopovers: StopoverData[];
  cities: City[];
  pickupLocations: PickupLocation[];
  onChange: (stopovers: StopoverData[]) => void;
  DurationInput: React.ComponentType<{
    value?: number;
    onChange: (value?: number) => void;
    className?: string;
  }>;
}

const StopoverList = ({
  stopovers,
  cities,
  pickupLocations,
  onChange,
  DurationInput,
}: StopoverListProps) => {
  const addStopover = () => {
    const newStopover: StopoverData = {
      cityId: '',
      stopType: 'intermediate',
      pickupMode: 'location',
      pickupLocationId: undefined,
      departureTime: '',
      arrivalNextDay: false,
    };

    // Insert before the last element (destination)
    const newStopovers = [...stopovers];
    newStopovers.splice(newStopovers.length - 1, 0, newStopover);

    // Ensure proper stop types
    if (newStopovers.length >= 2) {
      newStopovers[0].stopType = 'departure';
      newStopovers[newStopovers.length - 1].stopType = 'arrival';
    }

    onChange(newStopovers);
  };

  const removeStopover = (index: number) => {
    const newStopovers = stopovers.filter((_, i) => i !== index);

    // Ensure proper stop types after removal
    if (newStopovers.length >= 2) {
      newStopovers[0].stopType = 'departure';
      newStopovers[newStopovers.length - 1].stopType = 'arrival';
    }

    onChange(newStopovers);
  };

  const updateStopover = (index: number, data: StopoverData) => {
    const newStopovers = [...stopovers];
    newStopovers[index] = data;
    onChange(newStopovers);
  };

  const updateDestinationWaitingTime = (waitingDuration?: number) => {
    const destinationIndex = stopovers.length - 1;
    if (destinationIndex >= 0) {
      updateStopover(destinationIndex, {
        ...stopovers[destinationIndex],
        waitingDuration,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Render all stopovers */}
      {stopovers.map((stopover, index) => {
        const isFirst = index === 0;
        const isLast = index === stopovers.length - 1;
        const canRemove = !isFirst && !isLast;
        // Can add stopover only for the last non-destination stop (i.e., the stop before arrival)
        const canAddStopover = index === stopovers.length - 2 && stopovers.length >= 2;

        let type: 'departure' | 'destination' | 'intermediate';
        if (isFirst) {
          type = 'departure';
        } else if (isLast) {
          type = 'destination';
        } else {
          type = 'intermediate';
        }

        return (
          <div key={index} className="space-y-2">
            <Stopover
              data={stopover}
              cities={cities}
              pickupLocations={pickupLocations}
              type={type}
              canRemove={canRemove}
              canAddStopover={canAddStopover}
              onChange={data => updateStopover(index, data)}
              onRemove={canRemove ? () => removeStopover(index) : undefined}
              onAddStopover={canAddStopover ? addStopover : undefined}
            />
          </div>
        );
      })}

      {/* Waiting duration for destination */}
      {stopovers.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Timer className="text-pink-600 h-4 w-4" />
            <Label>Waiting at the border</Label>
          </div>
          <DurationInput
            value={stopovers[stopovers.length - 1]?.waitingDuration}
            onChange={updateDestinationWaitingTime}
            className="md:ms-6 max-w-[92px] bg-secondary"
          />
        </div>
      )}
    </div>
  );
};

export default StopoverList;
