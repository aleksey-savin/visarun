import { useState, useEffect } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Plus, X, Users, Settings, Trash2 } from 'lucide-react';
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

interface SeatDistribution {
  seatClassId: string;
  seatCount: number;
}

interface SeatDistributionManagerProps {
  transportId: string;
  totalCapacity: number;
  onDistributionUpdated?: () => void;
}

export default function SeatDistributionManager({
  transportId,
  totalCapacity,
  onDistributionUpdated,
}: SeatDistributionManagerProps) {
  const [seatDistributions, setSeatDistributions] = useState<SeatDistribution[]>([]);

  const { data: seatClassesData } = trpc.seatClass.getAll.useQuery({});
  const seatClasses = seatClassesData?.seatClasses || [];

  const {
    data: seatDistributionData,
    isLoading: seatDistributionLoading,
    refetch,
  } = trpc.transportSeatDistribution.getByTransport.useQuery({ transportId });

  const updateSeatDistributionMutation = trpc.transportSeatDistribution.update.useMutation({
    onSuccess: () => {
      toast.success('Seat distribution updated successfully');
      refetch();
      onDistributionUpdated?.();
    },
    onError: error => {
      toast.error(`Error updating seat distribution: ${error.message}`);
    },
  });

  const deleteSeatDistributionMutation = trpc.transportSeatDistribution.delete.useMutation({
    onSuccess: () => {
      toast.success('Seat distribution cleared successfully');
      refetch();
      onDistributionUpdated?.();
    },
    onError: error => {
      toast.error(`Error clearing seat distribution: ${error.message}`);
    },
  });

  useEffect(() => {
    if (seatDistributionData?.seatDistribution) {
      setSeatDistributions(
        seatDistributionData.seatDistribution.map(dist => ({
          seatClassId: dist.seatClassId,
          seatCount: dist.seatCount,
        }))
      );
    }
  }, [seatDistributionData]);

  const handleSeatDistributionSubmit = () => {
    const totalAllocated = getTotalAllocatedSeats();

    if (totalAllocated > totalCapacity) {
      toast.error(
        `Total allocated seats (${totalAllocated}) cannot exceed transport capacity (${totalCapacity})`
      );
      return;
    }

    updateSeatDistributionMutation.mutate({
      transportId,
      distributions: seatDistributions,
    });
  };

  const addSeatDistribution = () => {
    const availableSeatClasses = seatClasses.filter(
      sc => !seatDistributions.some(dist => dist.seatClassId === sc.id)
    );

    if (availableSeatClasses.length === 0) {
      toast.error('All seat classes are already assigned');
      return;
    }

    setSeatDistributions(prev => [
      ...prev,
      { seatClassId: availableSeatClasses[0].id, seatCount: 0 },
    ]);
  };

  const removeSeatDistribution = (index: number) => {
    setSeatDistributions(prev => prev.filter((_, i) => i !== index));
  };

  const updateSeatDistribution = (
    index: number,
    field: keyof SeatDistribution,
    value: string | number
  ) => {
    setSeatDistributions(prev =>
      prev.map((dist, i) => (i === index ? { ...dist, [field]: value } : dist))
    );
  };

  const getTotalAllocatedSeats = () => {
    return seatDistributions.reduce((sum, dist) => sum + dist.seatCount, 0);
  };

  const getRemainingSeats = () => {
    return totalCapacity - getTotalAllocatedSeats();
  };

  const clearAllDistributions = () => {
    deleteSeatDistributionMutation.mutate({ transportId });
    setSeatDistributions([]);
  };

  const canSave = () => {
    return (
      seatDistributions.length > 0 &&
      getRemainingSeats() >= 0 &&
      seatDistributions.every(dist => dist.seatCount > 0)
    );
  };

  if (seatDistributionLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Seat Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Seat Distribution
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Distribute the total seat count across different seat classes
            </p>
          </div>
          {seatDistributions.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Seat Distribution</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all seat class distributions for this transport. Are you sure?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={clearAllDistributions}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold">{totalCapacity}</div>
            <div className="text-sm text-muted-foreground">Total Capacity</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{getTotalAllocatedSeats()}</div>
            <div className="text-sm text-muted-foreground">Allocated</div>
          </div>
          <div className="text-center">
            <div
              className={`text-2xl font-bold ${
                getRemainingSeats() < 0 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {getRemainingSeats()}
            </div>
            <div className="text-sm text-muted-foreground">Remaining</div>
          </div>
        </div>

        {/* Validation Messages */}
        {getRemainingSeats() < 0 && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-600">
              Total allocated seats exceed transport capacity by {Math.abs(getRemainingSeats())}{' '}
              seats
            </span>
          </div>
        )}

        {getRemainingSeats() > 0 && getTotalAllocatedSeats() > 0 && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-700">
              You have {getRemainingSeats()} unallocated seats
            </span>
          </div>
        )}

        {/* Seat Distributions */}
        {seatDistributions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No seat distributions configured</p>
            <p className="text-sm">Add seat classes to distribute the available seats</p>
          </div>
        ) : (
          <div className="space-y-3">
            {seatDistributions.map((distribution, index) => {
              const availableClasses = seatClasses.filter(
                sc =>
                  !seatDistributions.some((dist, i) => i !== index && dist.seatClassId === sc.id)
              );

              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 border rounded-lg bg-background"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Seat Class</Label>
                      <Select
                        value={distribution.seatClassId}
                        onValueChange={value => updateSeatDistribution(index, 'seatClassId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableClasses.map(seatClass => (
                            <SelectItem key={seatClass.id} value={seatClass.id}>
                              <div className="flex items-center gap-2">
                                {seatClass.icon && (
                                  <span className="text-lg">{seatClass.icon}</span>
                                )}
                                <span>{seatClass.name}</span>
                                {seatClass.description && (
                                  <span className="text-xs text-muted-foreground">
                                    ({seatClass.description})
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Seat Count</Label>
                      <Input
                        type="number"
                        min="0"
                        max={totalCapacity}
                        value={distribution.seatCount}
                        onChange={e =>
                          updateSeatDistribution(index, 'seatCount', Number(e.target.value) || 0)
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {((distribution.seatCount / totalCapacity) * 100).toFixed(1)}%
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSeatDistribution(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Distribution Button */}
        {seatDistributions.length < seatClasses.length && (
          <Button
            type="button"
            variant="secondary"
            onClick={addSeatDistribution}
            className="w-full"
            disabled={seatClasses.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Seat Class
          </Button>
        )}

        {seatClasses.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No seat classes available.</p>
            <p className="text-xs">Create seat classes first to configure distribution.</p>
          </div>
        )}

        {/* Save Distribution Button */}
        {seatDistributions.length > 0 && (
          <>
            <Separator />
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleSeatDistributionSubmit}
                disabled={
                  !canSave() ||
                  updateSeatDistributionMutation.isPending ||
                  deleteSeatDistributionMutation.isPending
                }
              >
                <Settings className="w-4 h-4 mr-2" />
                {updateSeatDistributionMutation.isPending ? 'Saving...' : 'Save Distribution'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
