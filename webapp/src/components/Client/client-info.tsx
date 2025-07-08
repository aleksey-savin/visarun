import { useState } from 'react';
import { trpc } from '../../lib/trpcProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Edit, FileText, Plus, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ClientPassportForm } from './client-passport-form.js';
import { FileViewer } from './file-viewer.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ClientInfoProps {
  clientId: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ClientInfo = ({ clientId, onEdit, onDelete }: ClientInfoProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPassportDialogOpen, setIsPassportDialogOpen] = useState(false);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ path: string; name: string } | null>(null);

  // Query to get client details
  const { data, error, isLoading, isError, refetch } = trpc.client.getOne.useQuery({
    id: clientId,
  });

  // Mutation to delete client
  const deleteClientMutation = trpc.client.delete.useMutation({
    onSuccess: () => {
      toast.success('Client profile deleted successfully');
      if (onDelete) {
        onDelete();
      }
    },
    onError: error => {
      toast.error('Failed to delete client profile', {
        description: error.message,
      });
    },
  });

  // Function to handle client deletion
  const handleDeleteClient = () => {
    deleteClientMutation.mutate({ id: clientId });
    setIsDeleteDialogOpen(false);
  };

  // Function to format dates
  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'PPP');
  };

  const handlePassportSuccess = () => {
    setIsPassportDialogOpen(false);
    refetch();
  };

  const handleViewFile = (filePath: string, fileName: string) => {
    setSelectedFile({ path: filePath, name: fileName });
    setFileViewerOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/4 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Error Loading Client</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data?.client) {
    return (
      <Card className="w-full border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-700">Client Not Found</CardTitle>
          <CardDescription>The client profile could not be found.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const client = data.client;

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {client.firstName} {client.lastName}
            </CardTitle>
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the client profile
                      and all associated passport records.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button variant="destructive" onClick={handleDeleteClient}>
                      Delete
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-500">Account Owner</h3>
              <p className="text-sm">
                {client.user?.firstName} {client.user?.lastName}
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-500">Citizenship</h3>
              <p className="text-sm">
                {client.citizenship ? client.citizenship.name : 'Not specified'}
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-500">Previous Violations</h3>
              <div className="flex items-center gap-2">
                <Badge variant={client.prevViolations ? 'destructive' : 'secondary'}>
                  {client.prevViolations ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>

            {client.prevViolations && client.prevViolationsDesc && (
              <div className="space-y-1 md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Violations Description</h3>
                <p className="text-sm bg-gray-50 p-3 rounded-md">{client.prevViolationsDesc}</p>
              </div>
            )}

            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-500">Currently Outside Country</h3>
              <div className="flex items-center gap-2">
                <Badge variant={client.isOutsideTheCountry ? 'default' : 'secondary'}>
                  {client.isOutsideTheCountry ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>

            {client.isOutsideTheCountry && client.isOutsideTheCountryAt && (
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-500">Left Country On</h3>
                <p className="text-sm flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {formatDate(client.isOutsideTheCountryAt)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Passports Section */}
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Passports</CardTitle>
            <Dialog open={isPassportDialogOpen} onOpenChange={setIsPassportDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Passport
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Passport</DialogTitle>
                  <DialogDescription>Add a new passport record for this client.</DialogDescription>
                </DialogHeader>
                <ClientPassportForm
                  clientId={clientId}
                  onSuccess={handlePassportSuccess}
                  onCancel={() => setIsPassportDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {client.passports && client.passports.length > 0 ? (
            <div className="space-y-4">
              {client.passports.map(
                (passport: { id: string; expirationDate: string; scanPath: string }) => (
                  <div
                    key={passport.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Expires: {formatDate(passport.expirationDate)}
                        </p>
                        <p className="text-xs text-gray-500">Scan: {passport.scanPath}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleViewFile(
                            passport.scanPath,
                            `Passport expires ${formatDate(passport.expirationDate)}`
                          )
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No passports added yet</p>
              <p className="text-xs">Click "Add Passport" to add the first passport record</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Viewer Modal */}
      {selectedFile && (
        <FileViewer
          filePath={selectedFile.path}
          fileName={selectedFile.name}
          isOpen={fileViewerOpen}
          onClose={() => {
            setFileViewerOpen(false);
            setSelectedFile(null);
          }}
        />
      )}
    </div>
  );
};
