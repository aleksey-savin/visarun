import { useParams, useNavigate } from 'react-router-dom';
import { type ViewUserRouteParams, getAllUsersRoute, getEditUserRoute } from '../../lib/routes';
import { trpc } from '../../lib/trpcProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, User, Crown } from 'lucide-react';
import { ContactMethodManager } from '@/components/ContactMethod';
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
import { ClientProfileForm } from '../../components/Client';
import { toast } from 'sonner';
import { useState } from 'react';

interface Client {
  id: string;
  firstName: string | null;
  lastName: string | null;
  isPrimary: boolean;
  userId: string | null;
  citizenshipId: string | null;
  passportExpirationDate: string | null;
  prevViolations: boolean;
  prevViolationsDesc: string | null;
  isOutsideTheCountry: boolean;
  isOutsideTheCountryAt: string | null;
  citizenship?: {
    id: string;
    name: string;
    visaFree?: any[];
    blacklisted?: any[];
    favourite?: boolean;
    surcharges?: any[];
    emoji?: string;
    abbreviation?: string;
    RequirementCitizenship?: any[];
  } | null;
}

const ViewUserPage = () => {
  const { id } = useParams() as ViewUserRouteParams;
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  // Query to get user details
  const { data, error, isLoading, isError } = trpc.user.getOne.useQuery({ id });

  // Query to get all client profiles for this user
  const { data: clientsData, refetch: refetchClients } = trpc.clientData.getAllByUserId.useQuery({
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
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'N/A';
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

  const handleClientSuccess = () => {
    setIsCreatingClient(false);
    setEditingClientId(null);
    refetchClients();
    toast.success(
      editingClientId
        ? 'Client profile updated successfully'
        : 'Client profile created successfully'
    );
  };

  const handleEditClient = (clientId: string) => {
    setEditingClientId(clientId);
  };

  const handleCancelEdit = () => {
    setEditingClientId(null);
    setIsCreatingClient(false);
  };

  const handleCreateClient = () => {
    setIsCreatingClient(true);
  };

  if (isLoading) {
    return (
      <>
        <div className="sticky top-0 z-10 bg-background border-b flex px-6 justify-between gap-2 items-center h-[45px]">
          <div className="flex gap-3 items-center text-sm min-h-[45px]">
            <User />
            <span className="text-muted-foreground">Loading user...</span>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-9">
              <Card className="bg-secondary mr-2.5 p-0 mb-2.5">
                <CardHeader className="pb-4">
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-4 w-1/4 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4 px-0">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isError || !data?.user) {
    return (
      <>
        <div className="sticky top-0 z-10 bg-background border-b flex px-6 justify-between gap-2 items-center h-[45px]">
          <div className="flex gap-3 items-center text-sm min-h-[45px]">
            <User />
            <span className="text-destructive">Error loading user</span>
          </div>
        </div>
        <div className="p-6">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">
                {isError ? 'Error Loading User' : 'User Not Found'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">
                {isError ? error.message : `The user with ID ${id} could not be found.`}
              </p>
            </CardContent>
            <div className="p-6">
              <Button variant="outline" onClick={() => navigate(getAllUsersRoute())}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to All Users
              </Button>
            </div>
          </Card>
        </div>
      </>
    );
  }

  if (!data?.user) {
    return (
      <>
        <div className="sticky top-0 z-10 bg-background border-b flex px-6 justify-between gap-2 items-center h-[45px]">
          <div className="flex gap-3 items-center text-sm min-h-[45px]">
            <User />
            <span className="text-destructive">User not found</span>
          </div>
        </div>
      </>
    );
  }

  const user = data.user;
  const sortedClients: Client[] =
    clientsData?.clients?.sort((a: Client, b: Client) => {
      // Primary client first
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return 0;
    }) || [];

  return (
    <>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-9">
            {/* User Information Card */}
            <Card className="bg-secondary mr-2.5 p-6 mb-2.5">
              <CardHeader className="pb-4 px-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {user.firstName} {user.middleName && `${user.middleName} `}
                      {user.lastName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {user.roleAssignments && user.roleAssignments.length > 0 ? (
                      user.roleAssignments.map(assignment => (
                        <Badge
                          key={assignment.id}
                          className={getRoleBadgeColor(assignment.role.name)}
                          variant="secondary"
                        >
                          {assignment.role.name.charAt(0).toUpperCase() +
                            assignment.role.name.slice(1)}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">No roles</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-0 pt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-2">{formatDate(user.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Updated:</span>
                    <span className="ml-2">{formatDate(user.updatedAt)}</span>
                  </div>
                </div>

                {/* Contact Methods Section */}
                <ContactMethodManager userId={id} />
              </CardContent>
            </Card>

            {/* Client Profiles */}
            {sortedClients.length > 0 || isCreatingClient ? (
              <>
                <div className="flex pt-6 pb-3">
                  <h3 className="text-lg font-semibold">
                    Client Profiles ({sortedClients.length})
                  </h3>
                </div>

                {/* Create Client Form */}
                {isCreatingClient && (
                  <Card className="bg-secondary mr-2.5 p-6 mb-2.5">
                    <CardHeader className="px-0">
                      <CardTitle className="text-lg">Add New Client Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pt-0">
                      <ClientProfileForm
                        userId={user.id}
                        mode="create"
                        onSuccess={handleClientSuccess}
                        onCancel={handleCancelEdit}
                      />
                    </CardContent>
                  </Card>
                )}

                {sortedClients.map(client => (
                  <Card className="bg-secondary mr-2.5 p-6 mb-2.5" key={client.id}>
                    <CardHeader className="px-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">
                            {client.firstName || ''} {client.lastName || ''}
                          </CardTitle>
                          {client.isPrimary && (
                            <Badge
                              variant="default"
                              className="bg-amber-100 text-amber-800 hover:bg-amber-100"
                            >
                              <Crown className="w-3 h-3 mr-1" />
                              Primary
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="px-0 pt-0 space-y-3">
                      {editingClientId === client.id ? (
                        <ClientProfileForm
                          clientId={client.id}
                          mode="edit"
                          initialData={{
                            firstName: client.firstName || '',
                            lastName: client.lastName || '',
                            citizenshipId: client.citizenship?.id,
                            prevViolations: client.prevViolations || false,
                            prevViolationsDesc: client.prevViolationsDesc || '',
                            isOutsideTheCountry: client.isOutsideTheCountry || false,
                            isOutsideTheCountryAt: client.isOutsideTheCountryAt
                              ? format(new Date(client.isOutsideTheCountryAt), 'yyyy-MM-dd')
                              : '',
                            passportExpirationDate: client.passportExpirationDate
                              ? format(new Date(client.passportExpirationDate), 'yyyy-MM-dd')
                              : '',
                          }}
                          onSuccess={handleClientSuccess}
                          onCancel={handleCancelEdit}
                        />
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {client.citizenship && (
                              <div>
                                <span className="text-muted-foreground">Citizenship:</span>
                                <span className="ml-2">{client.citizenship.name}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">Passport Expires:</span>
                              <span className="ml-2">
                                {formatDate(client.passportExpirationDate)}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Outside Country:</span>
                              <span className="ml-2">
                                {formatDate(client.isOutsideTheCountryAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => handleEditClient(client.id)}>
                              Edit
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <Card className="bg-secondary mr-2.5 p-0 mb-2.5">
                <CardHeader>
                  <CardTitle className="text-lg">No Client Profiles</CardTitle>
                  <CardDescription>This user doesn't have any client profiles yet.</CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>

          {/* Actions Sidebar */}
          <div className="grid space-y-2 sticky top-[45px] self-start lg:col-span-3 text-sm">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">User Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="secondary"
                  className="w-full justify-start text-sm"
                  onClick={() => navigate(getEditUserRoute({ id: user.id }))}
                >
                  <User className="h-4 w-4 mr-2" />
                  Edit User Details
                </Button>

                <Button
                  variant="default"
                  className="w-full justify-start text-sm"
                  onClick={handleCreateClient}
                  disabled={isCreatingClient || editingClientId !== null}
                >
                  <User className="h-4 w-4 mr-2" />
                  {isCreatingClient ? 'Adding Client...' : 'Add Client Profile'}
                </Button>
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full justify-start text-sm"
                      disabled={deleteUserMutation.isPending}
                    >
                      {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the user account
                        for {user.firstName} {user.lastName} and all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <Button variant="destructive" onClick={handleDeleteUser}>
                        Delete User
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewUserPage;
