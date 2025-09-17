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
import { Save } from 'lucide-react';
import { TRANSPORT_TYPE_ICONS, getIconPath, getIconDisplayName } from '@/utils/icons';

export interface TransportTypeFormData {
  name: string;
  icon: string;
}

export interface TransportTypeFormProps {
  initialData?: Partial<TransportTypeFormData>;
  isEditing: boolean;
  onSubmit: (data: TransportTypeFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  title: string;
}

export default function TransportTypeForm({
  initialData,
  isEditing,
  onSubmit,
  onCancel,
  isSubmitting,
  title,
}: TransportTypeFormProps) {
  const [formData, setFormData] = useState<TransportTypeFormData>({
    name: '',
    icon: 'none',
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
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

  const handleInputChange = (field: keyof TransportTypeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              placeholder="Enter transport type name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icon</Label>
            <Select value={formData.icon} onValueChange={value => handleInputChange('icon', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select transport type icon (optional)">
                  {formData.icon && formData.icon !== 'none' ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center h-6 w-6">
                        <img
                          src={getIconPath('transport-type', formData.icon)}
                          alt={formData.icon}
                          className="h-5 w-5"
                        />
                      </div>
                      <span className="capitalize">{getIconDisplayName(formData.icon)}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      Select transport type icon (optional)
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-6 w-6 text-muted-foreground">
                      ✕
                    </div>
                    <span>No icon</span>
                  </div>
                </SelectItem>
                {TRANSPORT_TYPE_ICONS.map(icon => (
                  <SelectItem key={icon.value} value={icon.value}>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center h-6 w-6">
                        <img src={icon.path} alt={icon.value} className="h-5 w-5" />
                      </div>
                      <span className="capitalize">{getIconDisplayName(icon.value)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
  );
}
