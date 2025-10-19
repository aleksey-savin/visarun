import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { MapPin, Plus, Edit, Trash2, Navigation, Map, AlertCircle, Activity } from 'lucide-react';

import { trpc } from '@/lib/trpcProvider';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';

interface PickupLocationManagerProps {
  cityId: string;
  cityName: string;
}

interface PickupLocationFormData {
  name: string;
  address: string;
  landmark: string;
  coordinates: string;
  isActive: boolean;
}

interface PickupLocationData {
  id: string;
  cityId: string;
  name: string;
  address: string;
  landmark?: string | null;
  coordinates?: string | null;
  isActive: boolean;
  summary?: {
    totalRouteStops: number;
    activeRouteStops: number;
    isInUse: boolean;
  };
}

const PickupLocationManager = ({ cityId, cityName }: PickupLocationManagerProps) => {
  const { hasPermission } = useAuth();

  // Permission checks
  const canCreatePickupLocations = hasPermission('pickupLocations.create');
  const canUpdatePickupLocations = hasPermission('pickupLocations.update');
  const canDeletePickupLocations = hasPermission('pickupLocations.delete');
  const canReadPickupLocations = hasPermission('pickupLocations.read');

  // State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<PickupLocationData | null>(null);

  const [formData, setFormData] = useState<PickupLocationFormData>({
    name: '',
    address: '',
    landmark: '',
    coordinates: '',
    isActive: true,
  });

  // Queries and mutations
  const { data: pickupLocations, refetch } = trpc.pickupLocation.getAll.useQuery(
    {
      cityId,
      includeRouteStops: true,
    },
    {
      enabled: canReadPickupLocations,
    }
  );

  const createMutation = trpc.pickupLocation.create.useMutation({
    onSuccess: () => {
      toast.success('Pickup location created successfully');
      refetch();
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const editMutation = trpc.pickupLocation.edit.useMutation({
    onSuccess: () => {
      toast.success('Pickup location updated successfully');
      refetch();
      setEditDialogOpen(false);
      resetForm();
      setSelectedLocation(null);
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.pickupLocation.delete.useMutation({
    onSuccess: () => {
      toast.success('Pickup location deleted successfully');
      refetch();
      setDeleteDialogOpen(false);
      setSelectedLocation(null);
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  // Helper functions
  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      landmark: '',
      coordinates: '',
      isActive: true,
    });
  };

  const validateCoordinates = (coords: string): boolean => {
    if (!coords.trim()) return true; // Optional field
    const regex = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
    return regex.test(coords.trim());
  };

  const parseCoordinates = (coords: string) => {
    if (!coords) return null;
    const [lat, lng] = coords.split(',').map(c => parseFloat(c.trim()));
    if (isNaN(lat) || isNaN(lng)) return null;
    return { latitude: lat, longitude: lng };
  };

  const formatCoordinates = (coords: string) => {
    const parsed = parseCoordinates(coords);
    if (!parsed) return coords;
    return `${parsed.latitude.toFixed(6)}, ${parsed.longitude.toFixed(6)}`;
  };

  // Event handlers
  const handleCreate = () => {
    if (!formData.name.trim() || !formData.address.trim()) {
      toast.error('Name and address are required');
      return;
    }

    if (formData.coordinates && !validateCoordinates(formData.coordinates)) {
      toast.error('Coordinates must be in "latitude,longitude" format (e.g., "13.7563,100.5018")');
      return;
    }

    createMutation.mutate({
      cityId,
      name: formData.name.trim(),
      address: formData.address.trim(),
      landmark: formData.landmark.trim() || undefined,
      coordinates: formData.coordinates.trim() || undefined,
      isActive: formData.isActive,
    });
  };

  const handleEdit = () => {
    if (!selectedLocation) return;

    if (!formData.name.trim() || !formData.address.trim()) {
      toast.error('Name and address are required');
      return;
    }

    if (formData.coordinates && !validateCoordinates(formData.coordinates)) {
      toast.error('Coordinates must be in "latitude,longitude" format (e.g., "13.7563,100.5018")');
      return;
    }

    editMutation.mutate({
      id: selectedLocation.id,
      name: formData.name.trim(),
      address: formData.address.trim(),
      landmark: formData.landmark.trim() || undefined,
      coordinates: formData.coordinates.trim() || undefined,
      isActive: formData.isActive,
    });
  };

  const handleDelete = () => {
    if (!selectedLocation) return;
    deleteMutation.mutate({ id: selectedLocation.id });
  };

  const openEditDialog = (location: PickupLocationData) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name || '',
      address: location.address || '',
      landmark: location.landmark || '',
      coordinates: location.coordinates || '',
      isActive: location.isActive,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (location: PickupLocationData) => {
    setSelectedLocation(location);
    setDeleteDialogOpen(true);
  };

  if (!canReadPickupLocations) {
    return null;
  }

  const locations = pickupLocations?.pickupLocations?.filter(loc => loc.cityId === cityId) || [];

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Pickup Locations ({locations.length})
            </CardTitle>
          </div>
          {canCreatePickupLocations && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" onClick={resetForm}>
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Pickup Location</DialogTitle>
                  <DialogDescription>Create a new pickup point in {cityName}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Central Station"
                      />
                    </div>
                    <div className="space-y-2 flex flex-col">
                      <Label htmlFor="active">Status</Label>
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch
                          id="active"
                          checked={formData.isActive}
                          onCheckedChange={isActive => setFormData(prev => ({ ...prev, isActive }))}
                        />
                        <Label htmlFor="active">Active</Label>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Full address of the pickup location"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="landmark">Landmark</Label>
                    <Input
                      id="landmark"
                      value={formData.landmark}
                      onChange={e => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
                      placeholder="e.g., Near McDonald's"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coordinates">GPS Coordinates</Label>
                    <Input
                      id="coordinates"
                      value={formData.coordinates}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, coordinates: e.target.value }))
                      }
                      placeholder="latitude,longitude (e.g., 13.7563,100.5018)"
                    />
                    {formData.coordinates && !validateCoordinates(formData.coordinates) && (
                      <p className="text-sm text-destructive">
                        Please use the format: latitude,longitude
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Location'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {locations.length > 0 && (
          <div className="space-y-2">
            {locations.map(location => {
              return (
                <Card key={location.id} className="p-4 bg-secondary/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{location.name}</h4>
                        {location.summary?.isInUse && (
                          <Badge variant="outline" className="text-xs">
                            <Activity className="h-3 w-3 mr-1" />
                            {location.summary.activeRouteStops} routes
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{location.address}</span>
                        </div>

                        {location.landmark && (
                          <div className="flex items-center gap-2">
                            <Navigation className="h-4 w-4 flex-shrink-0" />
                            <span>{location.landmark}</span>
                          </div>
                        )}

                        {location.coordinates && (
                          <div className="flex items-center gap-2">
                            <Map className="h-4 w-4 flex-shrink-0" />
                            <span className="font-mono text-xs">
                              {formatCoordinates(location.coordinates)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-4">
                      {canUpdatePickupLocations && (
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(location)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDeletePickupLocations && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDeleteDialog(location)}
                          disabled={location.summary?.isInUse}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Pickup Location</DialogTitle>
            <DialogDescription>Update pickup location details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Central Station"
                />
              </div>
              <div className="space-y-2 flex flex-col">
                <Label htmlFor="edit-active">Status</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="edit-active"
                    checked={formData.isActive}
                    onCheckedChange={isActive => setFormData(prev => ({ ...prev, isActive }))}
                  />
                  <Label htmlFor="edit-active">Active</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address *</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Full address of the pickup location"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-landmark">Landmark</Label>
              <Input
                id="edit-landmark"
                value={formData.landmark}
                onChange={e => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
                placeholder="e.g., Near McDonald's"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-coordinates">GPS Coordinates</Label>
              <Input
                id="edit-coordinates"
                value={formData.coordinates}
                onChange={e => setFormData(prev => ({ ...prev, coordinates: e.target.value }))}
                placeholder="latitude,longitude (e.g., 13.7563,100.5018)"
              />
              {formData.coordinates && !validateCoordinates(formData.coordinates) && (
                <p className="text-sm text-destructive">
                  Please use the format: latitude,longitude
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={editMutation.isPending}>
              {editMutation.isPending ? 'Updating...' : 'Update Location'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pickup Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedLocation?.name}"? This action cannot be
              undone.
              {selectedLocation?.summary?.isInUse && (
                <div className="mt-2 p-2 bg-destructive/10 rounded border border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      This location is currently being used by{' '}
                      {selectedLocation.summary.activeRouteStops} active routes.
                    </span>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending || selectedLocation?.summary?.isInUse}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default PickupLocationManager;
