import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  type ViewMessageTemplateRouteParams,
  getMessageTemplatesRoute,
  getEditMessageTemplateRoute,
} from '../../lib/routes';
import { trpc } from '../../lib/trpcProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog.tsx';

const ViewMessageTemplatePage = () => {
  const { id } = useParams() as ViewMessageTemplateRouteParams;
  const navigate = useNavigate();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Query to get message template details
  const { data, error, isLoading, isError } = trpc.messageTemplate.getOne.useQuery({ id });

  // Mutation to delete message template
  const deleteMessageTemplateMutation = trpc.messageTemplate.delete.useMutation({
    onSuccess: () => {
      toast.success('Message template deleted successfully', {
        description: 'Message template has been permanently removed.',
      });
      navigate(getMessageTemplatesRoute());
    },
    onError: error => {
      toast.error('Failed to delete message template', {
        description: error.message,
      });
    },
  });

  // Function to handle message template deletion
  const handleDeleteMessageTemplate = () => {
    deleteMessageTemplateMutation.mutate({ id });
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(getMessageTemplatesRoute())}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Message Template Details</h1>
        </div>
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
            <CardTitle className="text-red-700">Error Loading Message Template</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error.message}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => navigate(getMessageTemplatesRoute())}>
              Back to All Message Templates
            </Button>
          </CardFooter>
        </Card>
      )}

      {!isLoading && !isError && !data?.messageTemplate && (
        <Card className="w-full max-w-3xl border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-700">Message Template Not Found</CardTitle>
            <CardDescription>Message template with ID {id} could not be found.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => navigate(getMessageTemplatesRoute())}>
              Back to All Message Templates
            </Button>
          </CardFooter>
        </Card>
      )}

      {data?.messageTemplate && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Message Template Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">{data.messageTemplate.title}</CardTitle>
                </div>

                <CardDescription className="flex items-center gap-1 whitespace-pre-wrap overflow-x-auto">
                  {data.messageTemplate.body}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {/* Telegram channels section - display attached */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Attached Telegram Channels and Groups</h3>
                  <div className="flex flex-row gap-2">
                    {data.messageTemplate?.telegramChannels &&
                    data.messageTemplate.telegramChannels.length > 0 ? (
                      data.messageTemplate.telegramChannels.map(
                        (channel: { id: string; chatTitle: string }) => (
                          <Badge
                            key={channel.id}
                            variant="outline"
                            className="bg-slate-400 justify-start"
                          >
                            {channel.chatTitle}
                          </Badge>
                        )
                      )
                    ) : (
                      <p>No channels attached</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    navigate(getEditMessageTemplateRoute({ id: data.messageTemplate.id }))
                  }
                >
                  Edit Template
                </Button>

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                      disabled={deleteMessageTemplateMutation.isPending}
                    >
                      {deleteMessageTemplateMutation.isPending ? 'Deleting...' : 'Delete Template'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete message template{' '}
                        {data.messageTemplate.title}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <Button variant="destructive" onClick={handleDeleteMessageTemplate}>
                        Delete
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewMessageTemplatePage;
