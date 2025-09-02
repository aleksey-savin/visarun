import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import { getAllCitizenshipsRoute } from '../../lib/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Save } from 'lucide-react';
import { toast } from 'sonner';

const CreateCitizenshipPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    emoji: '',
    abbreviation: '',
    favourite: false,
  });

  const createCitizenshipMutation = trpc.citizenship.create.useMutation({
    onSuccess: () => {
      toast.success('Citizenship created successfully');
      navigate(getAllCitizenshipsRoute());
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Citizenship name is required');
      return;
    }
    if (!formData.emoji.trim()) {
      toast.error('Emoji is required');
      return;
    }
    if (!formData.abbreviation.trim()) {
      toast.error('Abbreviation is required');
      return;
    }
    createCitizenshipMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="secondary" size="sm" onClick={() => navigate(getAllCitizenshipsRoute())}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Citizenships
        </Button>
        <div className="text-3xl sm:text-5xl font-semibold capitalize">Create Citizenship</div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Citizenship Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Citizenship Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                placeholder="Enter citizenship name (e.g., United States)"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emoji">Flag Emoji *</Label>
                <Input
                  id="emoji"
                  type="text"
                  value={formData.emoji}
                  onChange={e => handleInputChange('emoji', e.target.value)}
                  placeholder="🇺🇸"
                  maxLength={10}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="abbreviation">Country Code *</Label>
                <Input
                  id="abbreviation"
                  type="text"
                  value={formData.abbreviation}
                  onChange={e => handleInputChange('abbreviation', e.target.value.toUpperCase())}
                  placeholder="US"
                  maxLength={3}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="favourite"
                  checked={formData.favourite}
                  onCheckedChange={checked => handleInputChange('favourite', checked as boolean)}
                />
                <Label htmlFor="favourite" className="text-sm font-medium">
                  Mark as Favourite
                </Label>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={createCitizenshipMutation.isPending}
                className="flex-1"
              >
                {createCitizenshipMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Citizenship
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(getAllCitizenshipsRoute())}
                disabled={createCitizenshipMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default CreateCitizenshipPage;
