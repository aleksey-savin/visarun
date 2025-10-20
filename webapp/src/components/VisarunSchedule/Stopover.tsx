import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

type StopType = 'departure' | 'arrival' | 'intermediate';
type PickupMode = 'location' | 'address';

export interface StopoverData {
  id?: string;
  cityId: string;
  stopType: StopType;
  pickupMode: PickupMode;
  pickupLocationId?: string;
  arrivalTime?: string;
  departureTime?: string;
  arrivalNextDay: boolean;
  waitingDuration?: number;
  stopOrder?: number;
}

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

interface StopoverProps {
  data: StopoverData;
  cities: City[];
  pickupLocations: PickupLocation[];
  type: 'departure' | 'destination' | 'intermediate';
  canRemove?: boolean;
  canAddStopover?: boolean;
  onChange: (data: StopoverData) => void;
  onRemove?: () => void;
  onAddStopover?: () => void;
}

const ColorIndication = ({ color }: { color: string }) => {
  const colorMap = {
    'emerald-600': '#059669',
    'sky-600': '#0284c7',
    'pink-600': '#db2777',
  };

  return (
    <>
      {color !== 'pink-600' && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7.62866 2.04511C8.63657 2.05331 9.62516 2.32269 10.498 2.82669C11.3778 3.33469 12.1097 4.06353 12.6212 4.94127C13.1327 5.81905 13.4059 6.81526 13.4141 7.83117C13.4223 8.84703 13.1651 9.8477 12.6679 10.7336C12.1706 11.6194 11.4509 12.3603 10.5795 12.8824C9.70802 13.4045 8.71503 13.6895 7.6993 13.7101C6.68359 13.7306 5.68022 13.4856 4.78833 12.9991C3.89643 12.5127 3.14663 11.802 2.61393 10.937C2.08123 10.0719 1.7838 9.08242 1.7509 8.06701L1.74805 7.87788L1.7509 7.68932C1.78356 6.6819 2.07692 5.6997 2.60197 4.8393C3.12701 3.979 3.86584 3.26912 4.74674 2.77941C5.62772 2.28966 6.62074 2.03692 7.62866 2.04511ZM7.58138 6.12788C6.61495 6.12788 5.83148 6.91147 5.83138 7.87788C5.83138 8.84438 6.61488 9.62788 7.58138 9.62788C8.54788 9.62788 9.33138 8.84438 9.33138 7.87788C9.33128 6.91147 8.54781 6.12788 7.58138 6.12788Z"
            fill={colorMap[color as keyof typeof colorMap]}
          />
        </svg>
      )}
      {color === 'pink-600' && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11.2944 3.58262C12.2583 4.54636 12.8095 5.84719 12.8316 7.21003C12.8537 8.57287 12.3449 9.89088 11.4128 10.8854L11.2944 11.0079L8.81931 13.4824C8.50526 13.7962 8.08366 13.979 7.6399 13.9936C7.19615 14.0082 6.76343 13.8536 6.4294 13.5611L6.3454 13.4824L3.86973 11.0073C2.88516 10.0227 2.33203 8.68735 2.33203 7.29495C2.33203 5.90256 2.88516 4.56719 3.86973 3.58262C4.8543 2.59805 6.18967 2.04492 7.58206 2.04492C8.97446 2.04492 10.3098 2.59805 11.2944 3.58262ZM7.58206 5.54495C7.35225 5.54495 7.12469 5.59022 6.91237 5.67816C6.70005 5.76611 6.50713 5.89501 6.34463 6.05752C6.18212 6.22002 6.05322 6.41294 5.96527 6.62526C5.87733 6.83758 5.83206 7.06514 5.83206 7.29495C5.83206 7.52477 5.87733 7.75233 5.96527 7.96465C6.05322 8.17697 6.18212 8.36989 6.34463 8.53239C6.50713 8.69489 6.70005 8.8238 6.91237 8.91174C7.12469 8.99969 7.35225 9.04495 7.58206 9.04495C8.04619 9.04495 8.49131 8.86058 8.8195 8.53239C9.14769 8.2042 9.33206 7.75908 9.33206 7.29495C9.33206 6.83083 9.14769 6.38571 8.8195 6.05752C8.49131 5.72933 8.04619 5.54495 7.58206 5.54495Z"
            fill={colorMap[color as keyof typeof colorMap]}
          />
        </svg>
      )}
    </>
  );
};

const Stopover = ({
  data,
  cities,
  pickupLocations,
  type,
  canRemove = false,
  canAddStopover = false,
  onChange,
  onRemove,
  onAddStopover,
}: StopoverProps) => {
  const updateData = (updates: Partial<StopoverData>) => {
    onChange({ ...data, ...updates });
  };

  const getPlaceholder = () => {
    switch (type) {
      case 'departure':
        return 'Departure';
      case 'destination':
        return 'Border';
      case 'intermediate':
        return 'Stopover';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'departure':
        return 'emerald-600';
      case 'destination':
        return 'pink-600';
      case 'intermediate':
        return 'sky-600';
    }
  };

  const cityPickupLocations = pickupLocations.filter(location => location.cityId === data.cityId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ColorIndication color={getColor()} />

        {/* City Selection */}
        <Select value={data.cityId} onValueChange={value => updateData({ cityId: value })}>
          <SelectTrigger className="min-w-52">
            <SelectValue placeholder={getPlaceholder()} />
          </SelectTrigger>
          <SelectContent>
            {cities.map(city => (
              <SelectItem key={city.id} value={city.id}>
                <div className="flex gap-2 items-center">
                  <span className="font-medium">{city.name}</span>
                  <span className="text-xs text-muted-foreground">{city.country?.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Pickup Mode - Hide for destination */}
        {type !== 'destination' && (
          <Select
            value={data.pickupMode}
            onValueChange={(value: PickupMode) => updateData({ pickupMode: value })}
          >
            <SelectTrigger className="min-w-32">
              <SelectValue placeholder="Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="location">Location</SelectItem>
              <SelectItem value="address">Address</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Pickup Location - Show only when pickup mode is 'location' and city is selected and not destination */}
        {data.pickupMode === 'location' && data.cityId && type !== 'destination' && (
          <Select
            value={data.pickupLocationId || ''}
            onValueChange={value => updateData({ pickupLocationId: value })}
          >
            <SelectTrigger className="min-w-52">
              <SelectValue placeholder="Select pickup location" />
            </SelectTrigger>
            <SelectContent>
              {cityPickupLocations.length > 0 ? (
                cityPickupLocations.map(location => (
                  <SelectItem key={location.id} value={location.id}>
                    <div className="flex flex-col">{location.name}</div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-locations" disabled>
                  No pickup locations available for this city
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )}

        {/* Departure Time - Show for departure and intermediate */}
        {type !== 'destination' && (
          <Input
            type="time"
            value={data.departureTime || ''}
            onChange={e => updateData({ departureTime: e.target.value })}
            className="w-auto bg-secondary appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          />
        )}

        {/* Arrival Time - Show only for destination */}
        {type === 'destination' && (
          <Input
            type="time"
            value={data.arrivalTime || ''}
            onChange={e => updateData({ arrivalTime: e.target.value })}
            className="w-auto bg-secondary appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          />
        )}

        <div className="flex items-center gap-2">
          {/* Remove button only for intermediate stops */}
          {canRemove && onRemove && (
            <Button type="button" variant="secondary" onClick={onRemove} title="Remove stopover">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Next day switch - Show only for non-departure stops */}
        {type !== 'departure' && (
          <div className="flex items-center gap-2">
            <Switch
              checked={data.arrivalNextDay}
              onCheckedChange={checked => updateData({ arrivalNextDay: checked })}
            />
            <Label>Next day</Label>
          </div>
        )}
      </div>
      {/* Add Stopover Button - Show for intermediate stops */}
      {canAddStopover && onAddStopover && (
        <div className="flex justify-start md:ps-6">
          <Button type="button" variant="secondary" size="sm" onClick={onAddStopover}>
            <Plus className="w-4 h-4" />
            Add Stopover
          </Button>
        </div>
      )}
    </div>
  );
};

export default Stopover;
