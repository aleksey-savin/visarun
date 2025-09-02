import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import SeatDistributionManager from '@/components/Transport/SeatDistributionManager';

export interface TransportFormData {
  transportTypeId: string;
  name: string;
  description: string;
  seatCount: string;
}

export interface TransportFormProps {
  initialData?: Partial<TransportFormData>;
  transportId?: string;
  isEditing: boolean;
  onSubmit: (data: TransportFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  title: string;
  showSeatDistribution?: boolean;
  onSeatDistributionUpdated?: () => void;
}

export default function TransportForm({
  initialData,
  transportId,
  isEditing,
  onSubmit,
  onCancel,
  isSubmitting,
  title,
  showSeatDistribution = false,
  onSeatDistributionUpdated,
}: TransportFormProps) {
  const [formData, setFormData] = useState<TransportFormData>({
    transportTypeId: '',
    name: '',
    description: '',
    seatCount: '',
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: transportTypesData } = trpc.transportType.getAll.useQuery({});
  const transportTypes = transportTypesData?.transportTypes || [];

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.transportTypeId) {
      newErrors.transportTypeId = 'Transport type is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (
      formData.seatCount &&
      (isNaN(Number(formData.seatCount)) || Number(formData.seatCount) <= 0)
    ) {
      newErrors.seatCount = 'Seat count must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: keyof TransportFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const shouldShowSeatDistribution =
    showSeatDistribution && transportId && formData.seatCount && Number(formData.seatCount) > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transportTypeId">Transport Type *</Label>
              <Select
                value={formData.transportTypeId}
                onValueChange={value => handleInputChange('transportTypeId', value)}
              >
                <SelectTrigger className={errors.transportTypeId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select transport type" />
                </SelectTrigger>
                <SelectContent>
                  {transportTypes.map(transportType => (
                    <SelectItem key={transportType.id} value={transportType.id}>
                      <div className="flex items-center gap-2">
                        {transportType.icon && (
                          <img
                            src={`/src/assets/transport-type-icons/${transportType.icon}.svg`}
                            alt={transportType.name}
                            className="h-4 w-4"
                          />
                        )}
                        {transportType.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.transportTypeId && (
                <p className="text-sm text-red-600">{errors.transportTypeId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                placeholder="Enter transport name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                placeholder="Enter transport description (optional)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seatCount">Seat Count</Label>
              <Input
                id="seatCount"
                type="number"
                min="1"
                value={formData.seatCount}
                onChange={e => handleInputChange('seatCount', e.target.value)}
                placeholder="Enter seat count (optional)"
                className={errors.seatCount ? 'border-red-500' : ''}
              />
              {errors.seatCount && <p className="text-sm text-red-600">{errors.seatCount}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Seat Distribution Section */}
      {shouldShowSeatDistribution && (
        <SeatDistributionManager
          transportId={transportId}
          totalCapacity={Number(formData.seatCount) || 0}
          onDistributionUpdated={onSeatDistributionUpdated}
        />
      )}

      {/* Seat Distribution Placeholder for Create */}
      {showSeatDistribution &&
        !isEditing &&
        formData.seatCount &&
        Number(formData.seatCount) > 0 && (
          <div className="p-6 border-2 border-dashed border-muted rounded-lg text-center">
            <div className="text-muted-foreground">
              <p className="font-medium">Seat Distribution</p>
              <p className="text-sm mt-1">
                After creating the transport with {formData.seatCount} seats, you'll be able to
                distribute them across different seat classes.
              </p>
            </div>
          </div>
        )}
    </div>
  );
}
