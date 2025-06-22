import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import { getAllCitizenshipsRoute, getViewCitizenshipRoute } from '../../lib/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Save } from 'lucide-react';
import { toast } from 'sonner';

const EditCitizenshipPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    favourite: false,
  });

  const { data, isLoading, isError, error } = trpc.citizenship.getOne.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const editCitizenshipMutation = trpc.citizenship.edit.useMutation({
    onSuccess: () => {
      toast.success('Citizenship updated successfully');
      navigate(getViewCitizenshipRoute({ id: id! }));
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (data?.citizenship) {
      setFormData({
        name: data.citizenship.name,
        favourite: data.citizenship.favourite,
      });
    }
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Citizenship name is required');
      return;
    }
    editCitizenshipMutation.mutate({
      id: id!,
      ...formData,
    });
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !data?.citizenship) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <h3 className="font-medium text-lg mb-2">Error Loading Citizenship</h3>
        <p>{error?.message || 'Citizenship not found'}</p>
        <Button
          onClick={() => navigate(getAllCitizenshipsRoute())}
          className="mt-4"
          variant="outline"
        >
          Back to Citizenships
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(getViewCitizenshipRoute({ id: id! }))}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Citizenship
        </Button>
        <div className="text-3xl sm:text-5xl font-semibold capitalize">Edit Citizenship</div>
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
                placeholder="Enter citizenship name"
                required
              />
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
              <Button type="submit" disabled={editCitizenshipMutation.isPending} className="flex-1">
                {editCitizenshipMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Citizenship
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(getViewCitizenshipRoute({ id: id! }))}
                disabled={editCitizenshipMutation.isPending}
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

export default EditCitizenshipPage;
