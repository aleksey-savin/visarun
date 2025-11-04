import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

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
  isOccupied?: boolean;
  isAisle: boolean;
  isWindow: boolean;
  isEmergency: boolean;
  driverSeat: boolean;
  seatClass: SeatClass;
  position: number;
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
          'w-full h-12 border-2 rounded-lg flex items-center justify-center text-lg font-medium transition-all duration-200',
          getSeatColor(seat),
          onSeatClick && seat.isAvailable && !seat.driverSeat
            ? 'cursor-pointer hover:scale-105 hover:shadow-md'
            : seat.driverSeat
              ? 'cursor-default'
              : 'cursor-not-allowed opacity-60',
          seat.isOccupied && 'bg-amber-600 cursor-not-allowed',
          isSelected && 'ring-2 ring-primary ring-offset-2',
          className
        )}
        title={`${seat.seatLabel}${seat.driverSeat ? ' (Driver)' : ''} - ${seat.seatClass.name}`}
      >
        {seat.driverSeat ? <WheelIcon /> : <span className="font-bold">{seat.seatLabel}</span>}
      </div>
    );
  };

  const renderRow = (row: Row) => {
    return (
      <div key={row.id} className="flex items-center justify-center mb-4">
        <div className="flex gap-4 justify-center w-full">
          {row.seats
            .sort((a, b) => a.position - b.position)
            .map(seat => (
              <React.Fragment key={seat.id}>{renderSeat(seat)}</React.Fragment>
            ))}
        </div>
      </div>
    );
  };

  const renderFloor = (floor: Floor) => {
    return (
      <Card key={floor.id} className="w-full p-2">
        <CardContent className="flex flex-col gap-4">
          <div className="text-center text-lg">{floor.name || `Floor ${floor.floorNumber}`}</div>
          <div>{floor.rows.map(row => renderRow(row))}</div>
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
    </div>
  );
}
