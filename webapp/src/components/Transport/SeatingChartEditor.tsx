import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Save, Trash2, ShipWheel, Building, Rows2, Armchair } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface SeatData {
  seatLabel: string;
  seatClassId: string;
  isAvailable: boolean;
  isAisle: boolean;
  isWindow: boolean;
  isEmergency: boolean;
  driverSeat: boolean;
}

interface RowData {
  rowNumber: number;
  rowLabel: string;
  seats: SeatData[];
}

interface FloorData {
  floorNumber: number;
  name: string;
  rows: RowData[];
}

interface SeatingChartEditorProps {
  transportId: string;
  presetData?: any;
  onSave?: () => void;
  onCancel?: () => void;
}

export default function SeatingChartEditor({
  transportId,
  presetData,
  onSave,
  onCancel,
}: SeatingChartEditorProps) {
  const [floors, setFloors] = useState<FloorData[]>([]);
  const [selectedFloorIndex, setSelectedFloorIndex] = useState(0);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  const { data: seatClassesData } = trpc.seatClass.getAll.useQuery({});
  const seatClasses = seatClassesData?.seatClasses || [];

  const { data: transportData } = trpc.transport.getOne.useQuery({
    id: transportId,
  });

  const { data: existingChart, isLoading } = trpc.transport.getSeatingChart.useQuery({
    transportId,
  });

  // Get available seat classes from transport's seat distribution
  const availableSeatClasses = useMemo(() => {
    return transportData?.transport?.seatDistribution?.map(dist => dist.seatClass) || seatClasses;
  }, [transportData?.transport?.seatDistribution, seatClasses]);

  const createMutation = trpc.transport.createSeatingChart.useMutation({
    onSuccess: () => {
      toast.success('Seating chart created successfully');
      onSave?.();
    },
    onError: error => {
      toast.error(`Error creating seating chart: ${error.message}`);
    },
  });

  const updateMutation = trpc.transport.updateSeatingChart.useMutation({
    onSuccess: () => {
      toast.success('Seating chart updated successfully');
      onSave?.();
    },
    onError: error => {
      toast.error(`Error updating seating chart: ${error.message}`);
    },
  });

  const deleteMutation = trpc.transport.deleteSeatingChart.useMutation({
    onSuccess: () => {
      toast.success('Seating chart deleted successfully');
      onSave?.();
    },
    onError: error => {
      toast.error(`Error deleting seating chart: ${error.message}`);
    },
  });

  // Initialize with existing chart, preset data, or default structure
  useEffect(() => {
    // Wait for seat classes data to be loaded
    if (!availableSeatClasses.length) return;
    if (existingChart?.seatingChart) {
      const chartFloors = existingChart.seatingChart.floors.map(floor => ({
        floorNumber: floor.floorNumber,
        name: floor.name || '',
        rows: floor.rows.map(row => ({
          rowNumber: row.rowNumber,
          rowLabel: row.rowLabel || '',
          seats: row.seats.map(seat => ({
            seatLabel: seat.seatLabel,
            seatClassId: seat.seatClassId,
            isAvailable: seat.isAvailable,
            isAisle: seat.isAisle,
            isWindow: seat.isWindow,
            isEmergency: seat.isEmergency,
            driverSeat: seat.driverSeat,
          })),
        })),
      }));
      setFloors(chartFloors);
    } else if (presetData && presetData.floors) {
      // Use preset data if provided, but update seat class IDs to available ones
      const updatedFloors = presetData.floors.map((floor: any) => ({
        ...floor,
        rows: floor.rows.map((row: any) => ({
          ...row,
          seats: row.seats.map((seat: any) => ({
            ...seat,
            seatClassId: availableSeatClasses[0]?.id || seat.seatClassId,
          })),
        })),
      }));
      setFloors(updatedFloors);
    } else {
      // Initialize with default structure (like the image)
      setFloors([
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
                  seatClassId: availableSeatClasses[0]?.id || '',
                  isAvailable: false,
                  isAisle: false,
                  isWindow: true,
                  isEmergency: false,
                  driverSeat: true,
                },
              ],
            },
          ],
        },
        {
          floorNumber: 2,
          name: 'Upstairs',
          rows: [],
        },
      ]);
    }
  }, [existingChart, availableSeatClasses, presetData]);

  const addFloor = () => {
    const newFloorNumber = Math.max(...floors.map(f => f.floorNumber), 0) + 1;
    setFloors(prev => [
      ...prev,
      {
        floorNumber: newFloorNumber,
        name: `Floor ${newFloorNumber}`,
        rows: [],
      },
    ]);
  };

  const removeFloor = (floorIndex: number) => {
    setFloors(prev => prev.filter((_, i) => i !== floorIndex));
    if (selectedFloorIndex >= floors.length - 1) {
      setSelectedFloorIndex(Math.max(0, floors.length - 2));
    }
  };

  const updateFloor = (floorIndex: number, field: keyof FloorData, value: any) => {
    setFloors(prev =>
      prev.map((floor, i) => (i === floorIndex ? { ...floor, [field]: value } : floor))
    );
  };

  const addRow = (floorIndex: number) => {
    const floor = floors[floorIndex];
    const newRowNumber = Math.max(...floor.rows.map(r => r.rowNumber), 0) + 1;

    setFloors(prev =>
      prev.map((floor, i) =>
        i === floorIndex
          ? {
              ...floor,
              rows: [
                ...floor.rows,
                {
                  rowNumber: newRowNumber,
                  rowLabel: newRowNumber.toString(),
                  seats: [],
                },
              ],
            }
          : floor
      )
    );
  };

  const removeRow = (floorIndex: number, rowIndex: number) => {
    setFloors(prev =>
      prev.map((floor, i) =>
        i === floorIndex
          ? {
              ...floor,
              rows: floor.rows.filter((_, j) => j !== rowIndex),
            }
          : floor
      )
    );
    // Reset selected row if it was removed or is out of bounds
    if (
      selectedRowIndex === rowIndex ||
      (selectedRowIndex !== null && selectedRowIndex >= floors[floorIndex].rows.length - 1)
    ) {
      setSelectedRowIndex(null);
    } else if (selectedRowIndex !== null && selectedRowIndex > rowIndex) {
      setSelectedRowIndex(selectedRowIndex - 1);
    }
  };

  const updateRow = (floorIndex: number, rowIndex: number, field: keyof RowData, value: any) => {
    setFloors(prev =>
      prev.map((floor, i) =>
        i === floorIndex
          ? {
              ...floor,
              rows: floor.rows.map((row, j) => (j === rowIndex ? { ...row, [field]: value } : row)),
            }
          : floor
      )
    );
  };

  const addSeat = (floorIndex: number, rowIndex: number) => {
    const row = floors[floorIndex].rows[rowIndex];
    const seatCount = row.seats.length + 1;
    const defaultSeatClass =
      availableSeatClasses.length === 1
        ? availableSeatClasses[0]
        : availableSeatClasses.find(sc => sc.name.toLowerCase() === 'economy') ||
          availableSeatClasses[0];

    setFloors(prev =>
      prev.map((floor, i) =>
        i === floorIndex
          ? {
              ...floor,
              rows: floor.rows.map((row, j) =>
                j === rowIndex
                  ? {
                      ...row,
                      seats: [
                        ...row.seats,
                        {
                          seatLabel: `${seatCount}${row.rowLabel || 'A'}`,
                          seatClassId: defaultSeatClass?.id || '',
                          isAvailable: true,
                          isAisle: false,
                          isWindow: false,
                          isEmergency: false,
                          driverSeat: false,
                        },
                      ],
                    }
                  : row
              ),
            }
          : floor
      )
    );
  };

  const removeSeat = (floorIndex: number, rowIndex: number, seatIndex: number) => {
    setFloors(prev =>
      prev.map((floor, i) =>
        i === floorIndex
          ? {
              ...floor,
              rows: floor.rows.map((row, j) =>
                j === rowIndex
                  ? {
                      ...row,
                      seats: row.seats.filter((_, k) => k !== seatIndex),
                    }
                  : row
              ),
            }
          : floor
      )
    );
  };

  const updateSeat = (
    floorIndex: number,
    rowIndex: number,
    seatIndex: number,
    field: keyof SeatData,
    value: any
  ) => {
    setFloors(prev =>
      prev.map((floor, i) =>
        i === floorIndex
          ? {
              ...floor,
              rows: floor.rows.map((row, j) =>
                j === rowIndex
                  ? {
                      ...row,
                      seats: row.seats.map((seat, k) =>
                        k === seatIndex ? { ...seat, [field]: value } : seat
                      ),
                    }
                  : row
              ),
            }
          : floor
      )
    );
  };

  const handleSave = () => {
    const isUpdate = !!existingChart?.seatingChart;

    const mutation = isUpdate ? updateMutation : createMutation;

    mutation.mutate({
      transportId,
      floors,
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ transportId });
  };

  const getSeatPreview = (seat: SeatData) => {
    return (
      <div
        className={cn(
          'w-8 h-8 border-2 rounded flex items-center justify-center text-xs font-medium',
          seat.driverSeat
            ? 'bg-gray-700 text-white border-gray-600'
            : seat.isAvailable
              ? 'bg-blue-100 text-blue-800 border-blue-300'
              : 'bg-gray-400 text-gray-600 border-gray-300'
        )}
      >
        {seat.driverSeat ? <ShipWheel className="w-4 h-4" /> : seat.seatLabel}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const currentFloor = floors[selectedFloorIndex];
  const totalSeats = floors.reduce(
    (sum, floor) => sum + floor.rows.reduce((rowSum, row) => rowSum + row.seats.length, 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Seating Chart Editor</h3>
          <p className="text-sm text-muted-foreground">
            Design the seating layout for this transport
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {existingChart?.seatingChart && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Chart
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Seating Chart</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the seating chart. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={handleSave} disabled={floors.length === 0 || totalSeats === 0}>
            <Save className="w-4 h-4 mr-2" />
            Save Chart
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Floor Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Building className="w-4 h-4" />
              Floors ({floors.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {floors.map((floor, floorIndex) => (
              <div
                key={floorIndex}
                className={cn(
                  'p-3 border rounded-lg cursor-pointer transition-colors',
                  selectedFloorIndex === floorIndex
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted'
                )}
                onClick={() => {
                  setSelectedFloorIndex(floorIndex);
                  setSelectedRowIndex(null); // Reset row selection when floor changes
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{floor.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Floor {floor.floorNumber} • {floor.rows.length} rows
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      removeFloor(floorIndex);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={addFloor}>
              <Plus className="w-4 h-4 mr-2" />
              Add Floor
            </Button>
          </CardContent>
        </Card>

        {/* Floor Editor */}
        {currentFloor && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Edit Floor: {currentFloor.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Floor Number</Label>
                  <Input
                    type="number"
                    value={currentFloor.floorNumber}
                    onChange={e =>
                      updateFloor(selectedFloorIndex, 'floorNumber', Number(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Floor Name</Label>
                  <Input
                    value={currentFloor.name}
                    onChange={e => updateFloor(selectedFloorIndex, 'name', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="flex items-center gap-2">
                    <Rows2 className="w-4 h-4" />
                    Rows ({currentFloor.rows.length})
                  </Label>
                  <Button variant="outline" size="sm" onClick={() => addRow(selectedFloorIndex)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Row
                  </Button>
                </div>

                <div className="space-y-2  overflow-y-auto">
                  {currentFloor.rows.map((row, rowIndex) => (
                    <div
                      key={rowIndex}
                      className={cn(
                        'p-2 border rounded cursor-pointer',
                        selectedRowIndex === rowIndex
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted'
                      )}
                      onClick={() => setSelectedRowIndex(rowIndex)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          Row {row.rowNumber} ({row.seats.length} seats)
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            removeRow(selectedFloorIndex, rowIndex);
                          }}
                          className="text-red-600"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {row.seats.map((seat, seatIndex) => (
                          <div key={seatIndex}>{getSeatPreview(seat)}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Row/Seat Editor */}
        {currentFloor && selectedRowIndex !== null && currentFloor.rows[selectedRowIndex] && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Edit Row {currentFloor.rows[selectedRowIndex].rowNumber}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Row Number</Label>
                  <Input
                    type="number"
                    value={currentFloor.rows[selectedRowIndex].rowNumber}
                    onChange={e =>
                      updateRow(
                        selectedFloorIndex,
                        selectedRowIndex,
                        'rowNumber',
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Row Label</Label>
                  <Input
                    value={currentFloor.rows[selectedRowIndex].rowLabel}
                    onChange={e =>
                      updateRow(selectedFloorIndex, selectedRowIndex, 'rowLabel', e.target.value)
                    }
                  />
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="flex items-center gap-2">
                    <Armchair className="w-4 h-4" />
                    Seats ({currentFloor.rows[selectedRowIndex].seats.length})
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSeat(selectedFloorIndex, selectedRowIndex)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Seat
                  </Button>
                </div>

                <div className="space-y-3 overflow-y-auto">
                  {(currentFloor.rows[selectedRowIndex]?.seats || []).map((seat, seatIndex) => (
                    <div key={seatIndex} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getSeatPreview(seat)}
                          <span className="text-sm font-medium">{seat.seatLabel}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            removeSeat(selectedFloorIndex, selectedRowIndex, seatIndex)
                          }
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="space-y-1">
                          <Label className="text-xs">Seat Label</Label>
                          <Input
                            value={seat.seatLabel}
                            onChange={e =>
                              updateSeat(
                                selectedFloorIndex,
                                selectedRowIndex,
                                seatIndex,
                                'seatLabel',
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Seat Class</Label>
                          <Select
                            value={seat.seatClassId}
                            onValueChange={value =>
                              updateSeat(
                                selectedFloorIndex,
                                selectedRowIndex,
                                seatIndex,
                                'seatClassId',
                                value
                              )
                            }
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSeatClasses.map(sc => (
                                <SelectItem key={sc.id} value={sc.id}>
                                  {sc.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`available-${seatIndex}`}
                            checked={seat.isAvailable}
                            onCheckedChange={checked =>
                              updateSeat(
                                selectedFloorIndex,
                                selectedRowIndex,
                                seatIndex,
                                'isAvailable',
                                checked
                              )
                            }
                          />
                          <Label htmlFor={`available-${seatIndex}`} className="text-xs">
                            Available
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`driver-${seatIndex}`}
                            checked={seat.driverSeat}
                            onCheckedChange={checked =>
                              updateSeat(
                                selectedFloorIndex,
                                selectedRowIndex,
                                seatIndex,
                                'driverSeat',
                                checked
                              )
                            }
                          />
                          <Label htmlFor={`driver-${seatIndex}`} className="text-xs">
                            Driver Seat
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`window-${seatIndex}`}
                            checked={seat.isWindow}
                            onCheckedChange={checked =>
                              updateSeat(
                                selectedFloorIndex,
                                selectedRowIndex,
                                seatIndex,
                                'isWindow',
                                checked
                              )
                            }
                          />
                          <Label htmlFor={`window-${seatIndex}`} className="text-xs">
                            Window
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`aisle-${seatIndex}`}
                            checked={seat.isAisle}
                            onCheckedChange={checked =>
                              updateSeat(
                                selectedFloorIndex,
                                selectedRowIndex,
                                seatIndex,
                                'isAisle',
                                checked
                              )
                            }
                          />
                          <Label htmlFor={`aisle-${seatIndex}`} className="text-xs">
                            Aisle
                          </Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{floors.length}</div>
              <div className="text-sm text-muted-foreground">Floors</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {floors.reduce((sum, floor) => sum + floor.rows.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Rows</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{totalSeats}</div>
              <div className="text-sm text-muted-foreground">Total Seats</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {floors.reduce(
                  (sum, floor) =>
                    sum +
                    floor.rows.reduce(
                      (rowSum, row) => rowSum + row.seats.filter(seat => seat.driverSeat).length,
                      0
                    ),
                  0
                )}
              </div>
              <div className="text-sm text-muted-foreground">Driver Seats</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
