import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const Wheel = () => {
  return (
    <svg width="35" height="35" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5 17.166C5 18.8404 5.32979 20.4983 5.97054 22.0452C6.61128 23.5921 7.55044 24.9977 8.73439 26.1816C9.91834 27.3656 11.3239 28.3047 12.8708 28.9455C14.4177 29.5862 16.0756 29.916 17.75 29.916C19.4244 29.916 21.0823 29.5862 22.6292 28.9455C24.1761 28.3047 25.5817 27.3656 26.7656 26.1816C27.9496 24.9977 28.8887 23.5921 29.5295 22.0452C30.1702 20.4983 30.5 18.8404 30.5 17.166C30.5 15.4917 30.1702 13.8337 29.5295 12.2868C28.8887 10.7399 27.9496 9.33435 26.7656 8.1504C25.5817 6.96646 24.1761 6.0273 22.6292 5.38655C21.0823 4.7458 19.4244 4.41602 17.75 4.41602C16.0756 4.41602 14.4177 4.7458 12.8708 5.38655C11.3239 6.0273 9.91834 6.96646 8.73439 8.1504C7.55044 9.33435 6.61128 10.7399 5.97054 12.2868C5.32979 13.8337 5 15.4917 5 17.166Z"
        stroke="#FAFAFA"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.917 17.1654C14.917 17.9168 15.2155 18.6375 15.7469 19.1688C16.2782 19.7002 16.9989 19.9987 17.7503 19.9987C18.5018 19.9987 19.2224 19.7002 19.7538 19.1688C20.2851 18.6375 20.5837 17.9168 20.5837 17.1654C20.5837 16.4139 20.2851 15.6932 19.7538 15.1619C19.2224 14.6305 18.5018 14.332 17.7503 14.332C16.9989 14.332 16.2782 14.6305 15.7469 15.1619C15.2155 15.6932 14.917 16.4139 14.917 17.1654Z"
        stroke="#FAFAFA"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.75 20V29.9167"
        stroke="#FAFAFA"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.917 17.1654L5.35449 14.332"
        stroke="#FAFAFA"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.583 17.1654L30.1455 14.332"
        stroke="#FAFAFA"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

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
        {seat.driverSeat ? <Wheel /> : <span className="font-bold">{seat.seatLabel}</span>}

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
              <Wheel />
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
