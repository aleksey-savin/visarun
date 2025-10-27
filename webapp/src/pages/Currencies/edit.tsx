import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Coins } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

const EditCurrencyPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  const [isBegottening, setIsBegottening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, error, isLoading, isError } = trpc.currency.getOne.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const editMutation = trpc.currency.edit.useMutation({
    onSuccess: () => {
      toast.success('Currency updated successfully');
      navigate('/currencies');
    },
    onError: error => {
      toast.error(error.message || 'Failed to update currency');
      setIsSubmitting(false);
    },
  });

  useEffect(() => {
    if (data?.currency) {
      setName(data.currency.name);
      setIsBegottening(data.currency.isBegottening);
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Currency name is required');
      return;
    }

    if (!id) {
      toast.error('Currency ID is missing');
      return;
    }

    setIsSubmitting(true);

    editMutation.mutate({
      id,
      name: name.trim(),
      isBegottening: isBegottening,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !data?.currency) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <h3 className="font-medium text-lg mb-2">Error Loading Currency</h3>
        <p>{error?.message || 'Currency not found'}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 p-6 pb-0">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Edit Currency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Currency Name *</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter currency name (e.g., USD, EUR, VND)"
                required
                maxLength={100}
              />
              <p className="text-sm text-muted-foreground">
                Enter the currency name or code (maximum 100 characters)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isBegottening">Currency is begottening</Label>
              <Switch
                id="isBegottening"
                checked={isBegottening}
                onClick={() => setIsBegottening(prevState => !prevState)}
              />
              <p className="text-sm text-muted-foreground">
                Can be used as begottening in currency exchanges
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/currencies')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? 'Updating...' : 'Update Currency'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditCurrencyPage;
