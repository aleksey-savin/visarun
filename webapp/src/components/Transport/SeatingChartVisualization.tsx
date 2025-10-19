import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

import WheelIcon from '@/assets/trip-icons/WheelIcon';

interface SeatClass {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color?: string;
}

interface Seat {
  id: string;
  seatLabel: string;
  seatClassId: string;
  isAvailable: boolean;
  isAisle: boolean;
  isWindow: boolean;
  isEmergency: boolean;
  driverSeat: boolean;
  seatClass: SeatClass;
}

interface Row {
  id: string;
  rowNumber: number;
  rowLabel: string | null;
  seats: Seat[];
}

interface Floor {
  id: string;
  floorNumber: number;
  name: string | null;
  rows: Row[];
}

interface SeatingChart {
  id: string;
  transportId: string;
  floors: Floor[];
}

interface SeatingChartVisualizationProps {
  seatingChart: SeatingChart | null | undefined;
  onSeatClick?: (seat: Seat) => void;
  selectedSeatId?: string;
  className?: string;
}

export default function SeatingChartVisualization({
  seatingChart,
  onSeatClick,
  selectedSeatId,
  className,
}: SeatingChartVisualizationProps) {
  if (!seatingChart || seatingChart.floors.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No seating chart available</p>
        </CardContent>
      </Card>
    );
  }
  const getSeatColor = (seat: Seat) => {
    if (seat.driverSeat) {
      return 'bg-muted';
    }
    if (!seat.isAvailable) {
      return 'bg-muted text-muted';
    }

    return 'bg-secondary text-white';
  };

  const renderSeat = (seat: Seat) => {
    const isSelected = selectedSeatId === seat.id;

    return (
      <div
        key={seat.id}
        onClick={() => onSeatClick?.(seat)}
        className={cn(
          'relative w-16 h-9 border-2 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-200',
          getSeatColor(seat),
          onSeatClick && seat.isAvailable && !seat.driverSeat
            ? 'cursor-pointer hover:scale-105 hover:shadow-md'
            : seat.driverSeat
              ? 'cursor-default'
              : 'cursor-not-allowed opacity-60',
          isSelected && 'ring-2 ring-primary ring-offset-2',
          seat.isEmergency && 'border-dashed',
          className
        )}
        title={`${seat.seatLabel}${seat.driverSeat ? ' (Driver)' : ''} - ${seat.seatClass.name}`}
      >
        {seat.driverSeat ? <WheelIcon /> : <span className="font-bold">{seat.seatLabel}</span>}

        {/* Seat property indicators */}
        <div className="absolute -top-1 -right-1 flex gap-0.5">
          {seat.isWindow && (
            <div className="w-2 h-2 bg-blue-500 rounded-full" title="Window seat" />
          )}
          {seat.isAisle && <div className="w-2 h-2 bg-green-500 rounded-full" title="Aisle seat" />}
          {seat.isEmergency && (
            <div className="w-2 h-2 bg-red-500 rounded-full" title="Emergency exit" />
          )}
        </div>
      </div>
    );
  };

  const renderRow = (row: Row) => {
    // Group seats by position for better visualization
    // This is a simple layout - in reality you might want more sophisticated positioning
    return (
      <div key={row.id} className="flex items-center justify-center gap-1 mb-2">
        <div className="flex gap-4 flex-wrap justify-center">
          {row.seats.map(seat => (
            <React.Fragment key={seat.id}>{renderSeat(seat)}</React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderFloor = (floor: Floor) => {
    return (
      <Card key={floor.id} className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-center">
            {floor.name || `Floor ${floor.floorNumber}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-1">{floor.rows.map(row => renderRow(row))}</div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Seating Chart */}
      <div className="grid gap-4 lg:grid-cols-2">
        {seatingChart.floors.map(floor => renderFloor(floor))}
      </div>
      {/* Legend */}
      <Card>
        <CardContent className="flex flex-col gap-4 ">
          <div>Legend</div>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <WheelIcon />
              <span>Driver</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full" />
              <span>Window</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded-full" />
              <span>Aisle</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-500 rounded-full" />
              <span>Emergency</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6  bg-gray-400 rounded-full" />
              <span>Unavailable</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
