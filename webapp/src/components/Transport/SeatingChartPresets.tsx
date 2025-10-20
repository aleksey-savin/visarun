import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bus, Car } from 'lucide-react';

interface SeatClass {
  id: string;
  name: string;
}

interface SeatingChartPresetsProps {
  seatClasses: SeatClass[];
  onSelectPreset: (preset: any) => void;
}

export default function SeatingChartPresets({
  seatClasses,
  onSelectPreset,
}: SeatingChartPresetsProps) {
  const getDefaultSeatClass = (name: string) => {
    return (
      seatClasses.find(sc => sc.name.toLowerCase().includes(name.toLowerCase())) || seatClasses[0]
    );
  };

  const presets = [
    {
      id: 'double-decker-bus',
      name: 'Double Decker Bus',
      description: 'Classic double-decker bus layout like in the image',
      icon: <Bus className="w-6 h-6" />,
      data: {
        floors: [
          {
            floorNumber: 1,
            name: 'Downstairs',
            rows: [
              {
                rowNumber: 1,
                rowLabel: '1',
                seats: [
                  {
                    seatLabel: 'DRIVER',
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: false,
                    isAisle: false,
                    isWindow: true,
                    isEmergency: false,
                    driverSeat: true,
                  },
                ],
              },
              {
                rowNumber: 2,
                rowLabel: '2',
                seats: [
                  {
                    seatLabel: '9B',
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: false,
                    isWindow: true,
                    isEmergency: false,
                    driverSeat: false,
                  },
                  {
                    seatLabel: '10B',
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: true,
                    isWindow: false,
                    isEmergency: false,
                    driverSeat: false,
                  },
                ],
              },
              {
                rowNumber: 3,
                rowLabel: '3',
                seats: [
                  {
                    seatLabel: '7B',
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: false,
                    isWindow: true,
                    isEmergency: false,
                    driverSeat: false,
                  },
                  {
                    seatLabel: '8B',
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: true,
                    isWindow: false,
                    isEmergency: false,
                    driverSeat: false,
                  },
                ],
              },
              {
                rowNumber: 4,
                rowLabel: '4',
                seats: [
                  {
                    seatLabel: '5B',
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: false,
                    isWindow: true,
                    isEmergency: false,
                    driverSeat: false,
                  },
                  {
                    seatLabel: '6B',
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: true,
                    isWindow: false,
                    isEmergency: false,
                    driverSeat: false,
                  },
                ],
              },
              {
                rowNumber: 5,
                rowLabel: '5',
                seats: [
                  {
                    seatLabel: '3B',
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: false,
                    isWindow: true,
                    isEmergency: false,
                    driverSeat: false,
                  },
                  {
                    seatLabel: '4B',
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: true,
                    isWindow: false,
                    isEmergency: false,
                    driverSeat: false,
                  },
                ],
              },
              {
                rowNumber: 6,
                rowLabel: '6',
                seats: [
                  {
                    seatLabel: '1B',
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: false,
                    isWindow: true,
                    isEmergency: false,
                    driverSeat: false,
                  },
                  {
                    seatLabel: '2B',
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: true,
                    isWindow: false,
                    isEmergency: false,
                    driverSeat: false,
                  },
                ],
              },
            ],
          },
          {
            floorNumber: 2,
            name: 'Upstairs',
            rows: [
              {
                rowNumber: 1,
                rowLabel: '1',
                seats: [
                  {
                    seatLabel: '22B',
                    seatClassId:
                      getDefaultSeatClass('business')?.id ||
                      getDefaultSeatClass('economy')?.id ||
                      '',
                    isAvailable: true,
                    isAisle: false,
                    isWindow: true,
                    isEmergency: false,
                    driverSeat: false,
                  },
                ],
              },
              {
                rowNumber: 2,
                rowLabel: '2',
                seats: [
                  {
                    seatLabel: '21B',
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: false,
                    isWindow: true,
                    isEmergency: false,
                    driverSeat: false,
                  },
                  {
                    seatLabel: '20B',
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: true,
                    isWindow: false,
                    isEmergency: false,
                    driverSeat: false,
                  },
                ],
              },
              {
                rowNumber: 3,
                rowLabel: '3',
                seats: [
                  {
                    seatLabel: '19B',
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: false,
                    isWindow: true,
                    isEmergency: false,
                    driverSeat: false,
                  },
                  {
                    seatLabel: '18B',
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: true,
                    isWindow: false,
                    isEmergency: false,
                    driverSeat: false,
                  },
                ],
              },
              {
                rowNumber: 4,
                rowLabel: '4',
                seats: [
                  {
                    seatLabel: '17B',
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: false,
                    isWindow: true,
                    isEmergency: false,
                    driverSeat: false,
                  },
                  {
                    seatLabel: '16B',
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: true,
                    isWindow: false,
                    isEmergency: false,
                    driverSeat: false,
                  },
                ],
              },
              {
                rowNumber: 5,
                rowLabel: '5',
                seats: [
                  {
                    seatLabel: '15B',
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: false,
                    isWindow: true,
                    isEmergency: false,
                    driverSeat: false,
                  },
                  {
                    seatLabel: '14B',
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: true,
                    isWindow: false,
                    isEmergency: false,
                    driverSeat: false,
                  },
                ],
              },
              {
                rowNumber: 6,
                rowLabel: '6',
                seats: [
                  {
                    seatLabel: '13B',
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: false,
                    isWindow: true,
                    isEmergency: false,
                    driverSeat: false,
                  },
                  {
                    seatLabel: '12B',
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: true,
                    isWindow: false,
                    isEmergency: false,
                    driverSeat: false,
                  },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      id: 'single-decker-bus',
      name: 'Single Decker Bus',
      description: '2+2 seating configuration',
      icon: <Bus className="w-6 h-6" />,
      data: {
        floors: [
          {
            floorNumber: 1,
            name: 'Main Floor',
            rows: [
              {
                rowNumber: 1,
                rowLabel: '1',
                seats: [
                  {
                    seatLabel: 'DRIVER',
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: false,
                    isAisle: false,
                    isWindow: true,
                    isEmergency: false,
                    driverSeat: true,
                  },
                ],
              },
              ...Array.from({ length: 10 }, (_, i) => ({
                rowNumber: i + 2,
                rowLabel: (i + 2).toString(),
                seats: [
                  {
                    seatLabel: `${i * 4 + 1}A`,
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: false,
                    isWindow: true,
                    isEmergency: false,
                    driverSeat: false,
                  },
                  {
                    seatLabel: `${i * 4 + 2}B`,
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: true,
                    isWindow: false,
                    isEmergency: false,
                    driverSeat: false,
                  },
                  {
                    seatLabel: `${i * 4 + 3}C`,
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: true,
                    isWindow: false,
                    isEmergency: false,
                    driverSeat: false,
                  },
                  {
                    seatLabel: `${i * 4 + 4}D`,
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: false,
                    isWindow: true,
                    isEmergency: false,
                    driverSeat: false,
                  },
                ],
              })),
            ],
          },
        ],
      },
    },
    {
      id: 'minibus',
      name: 'Minibus',
      description: 'Small bus with single aisle',
      icon: <Car className="w-6 h-6" />,
      data: {
        floors: [
          {
            floorNumber: 1,
            name: 'Main Floor',
            rows: [
              {
                rowNumber: 1,
                rowLabel: '1',
                seats: [
                  {
                    seatLabel: 'DRIVER',
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: false,
                    isAisle: false,
                    isWindow: true,
                    isEmergency: false,
                    driverSeat: true,
                  },
                ],
              },
              ...Array.from({ length: 6 }, (_, i) => ({
                rowNumber: i + 2,
                rowLabel: (i + 2).toString(),
                seats: [
                  {
                    seatLabel: `${i * 2 + 1}A`,
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: false,
                    isWindow: true,
                    isEmergency: false,
                    driverSeat: false,
                  },
                  {
                    seatLabel: `${i * 2 + 2}B`,
                    seatClassId: getDefaultSeatClass('economy')?.id || '',
                    isAvailable: true,
                    isAisle: true,
                    isWindow: false,
                    isEmergency: false,
                    driverSeat: false,
                  },
                ],
              })),
            ],
          },
        ],
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Quick Start Templates</h3>
        <p className="text-sm text-muted-foreground">
          Choose a preset layout to get started quickly, then customize as needed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets.map(preset => (
          <Card
            key={preset.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSelectPreset(preset.data)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-3">
                {preset.icon}
                <div>
                  <div>{preset.name}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {preset.description}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Floors: {preset.data.floors.length}</div>
                <div>
                  Total Seats:{' '}
                  {preset.data.floors.reduce(
                    (sum: number, floor: any) =>
                      sum +
                      floor.rows.reduce(
                        (rowSum: number, row: any) =>
                          rowSum + row.seats.filter((seat: any) => !seat.driverSeat).length,
                        0
                      ),
                    0
                  )}
                </div>
              </div>
              <Button className="w-full mt-3" size="sm">
                Use This Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
