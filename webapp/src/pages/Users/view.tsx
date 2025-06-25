import { useParams, useNavigate } from 'react-router-dom';
import { type ViewUserRouteParams, getAllUsersRoute, getEditUserRoute } from '../../lib/routes';
import { trpc } from '../../lib/trpcProvider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CalendarIcon,
  ArrowLeft,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  User,
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useState } from 'react';
import { ClientProfileForm } from '../../components/client/ClientProfileForm';
import { ClientInfo } from '../../components/client/ClientInfo';

const ViewUserPage = () => {
  const { id } = useParams() as ViewUserRouteParams;
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);

  // Query to get user details
  const { data, error, isLoading, isError } = trpc.user.getOne.useQuery({ id });

  // Query to get all client profiles for this user
  const { data: clientsData, refetch: refetchClients } = trpc.client.getAllByUserId.useQuery({
    userId: id,
  });

  // Mutation to delete user
  const deleteUserMutation = trpc.user.delete.useMutation({
    onSuccess: () => {
      toast.success('User deleted successfully', {
        description: 'The user has been permanently removed.',
      });
      navigate(getAllUsersRoute());
    },
    onError: error => {
      toast.error('Failed to delete user', {
        description: error.message,
      });
    },
  });

  // Function to handle user deletion
  const handleDeleteUser = () => {
    deleteUserMutation.mutate({ id });
    setIsDeleteDialogOpen(false);
  };

  // Function to format dates in a readable format
  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'PPP');
  };

  // Get role badge color based on role
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'manager':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      default:
        return 'bg-green-100 text-green-800 hover:bg-green-100';
    }
  };

  const handleClientProfileSuccess = () => {
    setIsClientDialogOpen(false);
    refetchClients();
    toast.success('Client profile created successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(getAllUsersRoute())}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">User Details</h1>
      </div>

      {isLoading && (
        <Card className="w-full max-w-3xl">
          <CardHeader className="pb-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/4 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {isError && (
        <Card className="w-full max-w-3xl border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error Loading User</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error.message}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => navigate(getAllUsersRoute())}>
              Back to All Users
            </Button>
          </CardFooter>
        </Card>
      )}

      {!isLoading && !isError && !data?.user && (
        <Card className="w-full max-w-3xl border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-700">User Not Found</CardTitle>
            <CardDescription>The user with ID {id} could not be found.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => navigate(getAllUsersRoute())}>
              Back to All Users
            </Button>
          </CardFooter>
        </Card>
      )}

      {data?.user && (
        <Card className="w-full max-w-3xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                {`${data.user.firstName} ${data.user.middleName ? data.user.middleName + ' ' : ''}${data.user.lastName}`}
              </CardTitle>
            </div>
            <div className="py-3">
              <div className="flex flex-wrap gap-2">
                {data.user.roleAssignments && data.user.roleAssignments.length > 0 ? (
                  data.user.roleAssignments.map(assignment => (
                    <Badge key={assignment.id} className={getRoleBadgeColor(assignment.role.name)}>
                      {assignment.role.name.charAt(0).toUpperCase() + assignment.role.name.slice(1)}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline">No roles assigned</Badge>
                )}
              </div>
            </div>

            <CardDescription className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {data.user.email}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-500">Created</h3>
                <p className="text-sm flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {formatDate(data.user.createdAt)}
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                <p className="text-sm flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {formatDate(data.user.updatedAt)}
                </p>
              </div>
            </div>

            {/* Contact Methods Section */}
            {data.user.contactMethods && data.user.contactMethods.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500">Contact Methods</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.user.contactMethods.map(contactMethod => (
                    <div
                      key={contactMethod.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        {contactMethod.method.name === 'email' && (
                          <Mail className="h-4 w-4 text-blue-600" />
                        )}
                        {contactMethod.method.name === 'phone' && (
                          <Phone className="h-4 w-4 text-green-600" />
                        )}
                        {['telegram', 'whatsapp', 'viber', 'line', 'wechat', 'skype'].includes(
                          contactMethod.method.name
                        ) && <MessageCircle className="h-4 w-4 text-purple-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {contactMethod.method.name}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {contactMethod.url ? (
                            <a
                              href={contactMethod.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                            >
                              {contactMethod.value}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            contactMethod.value
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-2 flex justify-between">
            <div className="space-x-4 space-y-2">
              <Button
                variant="outline"
                onClick={() => navigate(getEditUserRoute({ id: data.user.id }))}
              >
                Edit User
              </Button>

              {/* Client Profile Section */}
              <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default">
                    <User className="h-4 w-4 mr-2" />
                    Add Client Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Client Profile</DialogTitle>
                    <DialogDescription>
                      Add a new client profile for {data.user.firstName} {data.user.lastName}
                    </DialogDescription>
                  </DialogHeader>
                  <ClientProfileForm
                    userId={data.user.id}
                    onSuccess={handleClientProfileSuccess}
                    onCancel={() => setIsClientDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>

              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={deleteUserMutation.isPending}>
                    {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the user account
                      for {data.user.firstName} {data.user.lastName}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button variant="destructive" onClick={handleDeleteUser}>
                      Delete
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardFooter>
        </Card>
      )}

      {/* Client Profiles Section */}
      {clientsData?.clients && clientsData.clients.length > 0 && (
        <div className="mt-6 space-y-4">
          <h2 className="text-2xl font-bold">Client Profiles</h2>
          {clientsData.clients.map(client => (
            <ClientInfo
              key={client.id}
              clientId={client.id}
              onEdit={() => navigate(`/clients/edit/${client.id}`)}
              onDelete={() => {
                refetchClients();
              }}
            />
          ))}
        </div>
      )}

      {clientsData?.clients && clientsData.clients.length === 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>No Client Profiles</CardTitle>
            <CardDescription>
              This user doesn't have any client profiles yet. Click "Add Client Profile" to create
              one.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
};

export default ViewUserPage;
