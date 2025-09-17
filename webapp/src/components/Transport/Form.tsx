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
import { Save, Truck } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { IconDisplay } from '@/components/ui/icon-display';

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
}

export default function TransportForm({
  initialData,
  isEditing,
  onSubmit,
  onCancel,
  isSubmitting,
  title,
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
                        <IconDisplay
                          iconFilename={transportType.icon || undefined}
                          iconType="transport-type"
                          alt={transportType.name}
                          size="sm"
                          fallback={<Truck className="h-4 w-4 text-muted-foreground" />}
                        />
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
    </div>
  );
}
