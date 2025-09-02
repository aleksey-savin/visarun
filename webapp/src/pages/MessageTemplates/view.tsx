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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Edit,
  Trash2,
  MessageSquare,
  Hash,
  Users,
  FileText,
  Send,
  AlertCircle,
  Copy,
  Eye,
  BarChart3,
  CheckCircle,
} from 'lucide-react';
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
} from '@/components/ui/alert-dialog';

const ViewMessageTemplatePage = () => {
  const { id } = useParams() as ViewMessageTemplateRouteParams;
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Query to get message template details
  const { data, error, isLoading, isError } = trpc.messageTemplate.getOne.useQuery({ id });

  // Mutation to delete message template
  const deleteMessageTemplateMutation = trpc.messageTemplate.delete.useMutation({
    onSuccess: () => {
      toast.success('Message template deleted successfully', {
        description: 'Template has been permanently removed.',
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

  const handleCopyContent = () => {
    if (data?.messageTemplate?.body) {
      navigator.clipboard.writeText(data.messageTemplate.body);
      toast.success('Content copied to clipboard');
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Separator />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-16" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (isError || !data?.messageTemplate) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => navigate(getMessageTemplatesRoute())}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Template Details</h1>
            <p className="text-muted-foreground">View and manage message template</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error?.message || `Template with ID ${id} could not be found.`}
          </AlertDescription>
        </Alert>

        <div className="mt-6">
          <Button variant="secondary" onClick={() => navigate(getMessageTemplatesRoute())}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  const messageTemplate = data.messageTemplate;

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => navigate(getMessageTemplatesRoute())}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{messageTemplate.title}</h1>
          <p className="text-muted-foreground">Message template configuration and content</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Hash className="h-3 w-3" />
            ID: {messageTemplate.id.slice(0, 8)}
          </Badge>
          {messageTemplate.telegramChannels && messageTemplate.telegramChannels.length > 0 && (
            <Badge variant="default" className="gap-1">
              <Users className="h-3 w-3" />
              {messageTemplate.telegramChannels.length} channels
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-fit">
          <TabsTrigger value="overview" className="gap-2">
            <FileText className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="channels" className="gap-2">
            <Users className="h-4 w-4" />
            Channels
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Template Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Template Information
                  </CardTitle>
                  <CardDescription>Basic details and configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Title</label>
                      <p className="text-lg font-semibold">{messageTemplate.title}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Template ID
                      </label>
                      <code className="text-sm bg-muted p-2 rounded font-mono block">
                        {messageTemplate.id}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Message Content */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Message Content
                      </CardTitle>
                      <CardDescription>Template body and message content</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={handleCopyContent}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button variant="secondary" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg border">
                      <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                        {messageTemplate.body}
                      </pre>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{messageTemplate.body.length} characters</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Hash className="h-4 w-4" />
                        <span>{messageTemplate.body.split('\n').length} lines</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Usage Information
                  </CardTitle>
                  <CardDescription>How and where this template is used</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Attached Channels
                      </label>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">
                          {messageTemplate.telegramChannels?.length || 0} channels
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-600 font-medium">Active</span>
                      </div>
                    </div>
                  </div>

                  {messageTemplate.telegramChannels &&
                  messageTemplate.telegramChannels.length > 0 ? (
                    <div className="space-y-3">
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-3">Connected Channels</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {messageTemplate.telegramChannels.map(channel => (
                            <div
                              key={channel.id}
                              className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
                            >
                              <Hash className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-900 dark:text-blue-100">
                                {channel.chatTitle}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        This template is not currently attached to any Telegram channels.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="default"
                    className="w-full justify-start"
                    onClick={() =>
                      navigate(getEditMessageTemplateRoute({ id: messageTemplate.id }))
                    }
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Template
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    onClick={handleCopyContent}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Content
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    onClick={() => setSelectedTab('channels')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Channels
                  </Button>
                  <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="w-full justify-start"
                        disabled={deleteMessageTemplateMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deleteMessageTemplateMutation.isPending
                          ? 'Deleting...'
                          : 'Delete Template'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Template</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{messageTemplate.title}"? This action
                          cannot be undone and will remove the template from all connected channels.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button variant="destructive" onClick={handleDeleteMessageTemplate}>
                          Delete Template
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Content Length</span>
                    <Badge variant="secondary">{messageTemplate.body.length} chars</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Line Count</span>
                    <Badge variant="secondary">{messageTemplate.body.split('\n').length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Connected Channels</span>
                    <Badge variant="secondary">
                      {messageTemplate.telegramChannels?.length || 0}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Template Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Template Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Template ID</span>
                    <code className="block text-xs bg-muted p-2 rounded font-mono">
                      {messageTemplate.id}
                    </code>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="text-sm font-medium">Active</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="channels" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Connected Channels
                </CardTitle>
                <CardDescription>Telegram channels and groups using this template</CardDescription>
              </CardHeader>
              <CardContent>
                {messageTemplate.telegramChannels && messageTemplate.telegramChannels.length > 0 ? (
                  <div className="space-y-3">
                    {messageTemplate.telegramChannels.map(channel => (
                      <div
                        key={channel.id}
                        className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
                      >
                        <div className="flex items-center gap-3">
                          <Hash className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-medium text-blue-900 dark:text-blue-100">
                              {channel.chatTitle}
                            </div>
                            <div className="text-sm text-blue-700 dark:text-blue-200">
                              Channel ID: {channel.id}
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-blue-600 border-blue-300">
                          Connected
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Connected Channels</h3>
                    <p className="text-muted-foreground mb-4">
                      This template is not currently connected to any Telegram channels.
                    </p>
                    <Button variant="secondary">
                      <Users className="h-4 w-4 mr-2" />
                      Connect Channel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Channel Management</CardTitle>
                <CardDescription>Manage channel connections for this template</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Channel connections are managed through the Telegram integration. Use the
                    Telegram settings to connect or disconnect channels from this template.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Button variant="secondary" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Add Channel Connection
                  </Button>
                  <Button variant="secondary" className="w-full justify-start">
                    <Hash className="h-4 w-4 mr-2" />
                    View All Channels
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Content Length</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{messageTemplate.body.length}</div>
                <p className="text-xs text-muted-foreground">characters</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Line Count</CardTitle>
                <Hash className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{messageTemplate.body.split('\n').length}</div>
                <p className="text-xs text-muted-foreground">lines</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connected Channels</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {messageTemplate.telegramChannels?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">channels</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Template ID</CardTitle>
                <Hash className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold font-mono">{messageTemplate.id.slice(0, 8)}</div>
                <p className="text-xs text-muted-foreground">short ID</p>
              </CardContent>
            </Card>
          </div>

          {/* Content Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Content Analysis</CardTitle>
              <CardDescription>Detailed breakdown of template content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Character Count</span>
                    <span className="text-sm text-muted-foreground">
                      {messageTemplate.body.length} chars
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Word Count</span>
                    <span className="text-sm text-muted-foreground">
                      {messageTemplate.body.trim().split(/\s+/).length} words
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Line Count</span>
                    <span className="text-sm text-muted-foreground">
                      {messageTemplate.body.split('\n').length} lines
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Template Title</span>
                    <span className="text-sm text-muted-foreground">
                      {messageTemplate.title.length} chars
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Channel Connections</span>
                    <span className="text-sm text-muted-foreground">
                      {messageTemplate.telegramChannels?.length || 0} active
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Template Status</span>
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ViewMessageTemplatePage;
