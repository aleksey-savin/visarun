import { useParams, useNavigate } from 'react-router-dom';
import { type ViewTelegramChannelRouteParams, getTelegramChannelsRoute } from '../../lib/routes';
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
import { CalendarIcon, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useState } from 'react';

const ViewTelegramChannelPage = () => {
  const { id } = useParams() as ViewTelegramChannelRouteParams;
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isUnblockDialogOpen, setIsUnblockDialogOpen] = useState(false);

  const { data, error, isLoading, isError } = trpc.telegramChannel.getOne.useQuery({ id });

  const {
    createdAt,
    updatedAt,
    chatId,
    status,
    chatTitle,
    chatType,
    fromLastName,
    fromFirstName,
    fromUsername,
  } = data?.channel || {
    status: '',
    chatId: '',
    chatTitle: '',
    chatType: '',
    fromLastName: '',
    fromFirstName: '',
    fromUsername: '',
    createdAt: '',
    updatedAt: '',
  };

  const deleteTelegramChannelMutation = trpc.telegramChannel.channelDelete.useMutation({
    onSuccess: () => {
      toast.success('Telegram channel or group deleted successfully', {
        description: 'Telegram channel or group has been permanently removed.',
      });
      navigate(getTelegramChannelsRoute());
    },
    onError: error => {
      toast.error('Failed to delete telegram channel or group', {
        description: error.message,
      });
    },
  });

  const handleDeleteTelegramChannel = () => {
    deleteTelegramChannelMutation.mutate({ chatId });
    setIsDeleteDialogOpen(false);
  };

  const blockTelegramChannelMutation = trpc.telegramChannel.channelBlock.useMutation({
    onSuccess: () => {
      toast.success('Telegram channel or group blocked successfully', {
        description: 'Telegram channel or group has been blocked.',
      });
      navigate(getTelegramChannelsRoute());
    },
    onError: error => {
      toast.error('Failed to block telegram channel or group', {
        description: error.message,
      });
    },
  });

  const handleBlockTelegramChannel = () => {
    blockTelegramChannelMutation.mutate({ chatId });
    setIsBlockDialogOpen(false);
  };

  const unblockTelegramChannelMutation = trpc.telegramChannel.channelUnblock.useMutation({
    onSuccess: () => {
      toast.success('Telegram channel or group unblocked successfully', {
        description: 'Telegram channel or group has been unblocked.',
      });
      navigate(getTelegramChannelsRoute());
    },
    onError: error => {
      toast.error('Failed to unblock telegram channel or group', {
        description: error.message,
      });
    },
  });

  const handleUnblockTelegramChannel = () => {
    unblockTelegramChannelMutation.mutate({ chatId });
    setIsUnblockDialogOpen(false);
  };

  // Function to format dates in a readable format
  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'PPP');
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'kicked':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'blocked':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      default:
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(getTelegramChannelsRoute())}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{`Telegram ${chatType} details`}</h1>
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
            <CardTitle className="text-red-700">Error Loading Telegram Channel or Group</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error.message}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => navigate(getTelegramChannelsRoute())}>
              Back to All Users
            </Button>
          </CardFooter>
        </Card>
      )}

      {!isLoading && !isError && !data?.channel && (
        <Card className="w-full max-w-3xl border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-700">User Not Found</CardTitle>
            <CardDescription>The user with ID {id} could not be found.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => navigate(getTelegramChannelsRoute())}>
              Back to All Users
            </Button>
          </CardFooter>
        </Card>
      )}

      {data?.channel && (
        <Card className="w-full max-w-3xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{`${chatTitle}`}</CardTitle>
            </div>
            <div className="py-3">
              <Badge className={getStatusBadgeColor(status)}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </div>

            <CardDescription className="flex items-center gap-1">
              Added by {fromFirstName} {fromLastName} ({fromUsername})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-500">Created</h3>
                <p className="text-sm flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {formatDate(createdAt)}
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                <p className="text-sm flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {formatDate(updatedAt)}
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-2 flex justify-between">
            {status === 'kicked' && (
              <div className="space-x-4 space-y-2">
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={deleteTelegramChannelMutation.isPending}
                    >
                      {deleteTelegramChannelMutation.isPending
                        ? 'Deleting...'
                        : `Delete Telegram ${chatType}`}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete telegram channel
                        or group
                        {chatTitle}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteTelegramChannel}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
            {status === 'active' && (
              <div className="space-x-4 space-y-2">
                <AlertDialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={blockTelegramChannelMutation.isPending}>
                      {blockTelegramChannelMutation.isPending
                        ? 'Blocking...'
                        : `Block Telegram ${chatType}`}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will block telegram channel or group
                        {chatTitle} and prevent from sending messages.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBlockTelegramChannel}>
                        Block
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
            {status === 'blocked' && (
              <div className="space-x-4 space-y-2">
                <AlertDialog open={isUnblockDialogOpen} onOpenChange={setIsUnblockDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="default" disabled={unblockTelegramChannelMutation.isPending}>
                      {unblockTelegramChannelMutation.isPending
                        ? 'Unblocking...'
                        : `Unblock Telegram ${chatType}`}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will unblock telegram channel or group
                        {chatTitle} and allow it to recieve messages.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleUnblockTelegramChannel}>
                        Unblock
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default ViewTelegramChannelPage;
