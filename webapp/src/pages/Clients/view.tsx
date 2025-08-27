import { useParams, useNavigate } from 'react-router-dom';
import { type ViewClientRouteParams, getAllUsersRoute } from '../../lib/routes';
import { trpc } from '../../lib/trpcProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ClientInfo } from '../../components/Client/client-info';

const ViewClientPage = () => {
  const { id } = useParams() as ViewClientRouteParams;
  const navigate = useNavigate();

  // Query to get client details
  const { data, error, isLoading, isError } = trpc.clientData.getOne.useQuery({ id });

  const handleEdit = () => {
    navigate(`/clients/edit/${id}`);
  };

  const handleDelete = () => {
    // Navigate back to users list after deletion
    navigate(getAllUsersRoute());
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Client Details</h1>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <p>Loading client details...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Client Details</h1>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading client: {error.message}</p>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.client) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Client Details</h1>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Client not found</p>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Client Details</h1>
            <p className="text-muted-foreground">
              {data.client.firstName} {data.client.lastName}
            </p>
          </div>
        </div>
      </div>

      <ClientInfo clientId={id} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
};

export default ViewClientPage;
