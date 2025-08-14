import { useState } from 'react';
import { trpc } from '../../lib/trpcProvider';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageCircle, Search, Eye, Trash2, Shield, ShieldCheck } from 'lucide-react';
import { FilterContainer, FilterFields, FilterField } from '@/components/Filters';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

// Define a type for the user based on your Prisma schema
type TelegramChannel = {
  id: string;
  chatId: string;
  chatTitle: string;
  chatType: string;
  chatUsername: string;
  fromUsername: string;
  status: 'active' | 'kicked' | 'blocked' | 'insufficient_permissions';
  createdAt: string;
  updatedAt: string;
};

// Get role badge color based on role
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

const AllTelegramChannelsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [deleteChannelId, setDeleteChannelId] = useState<string | null>(null);
  const [blockChannelId, setBlockChannelId] = useState<string | null>(null);
  const [unblockChannelId, setUnblockChannelId] = useState<string | null>(null);

  const { data, error, isLoading, isError, refetch } = trpc.telegramChannel.getAll.useQuery();

  const deleteMutation = trpc.telegramChannel.channelDelete.useMutation({
    onSuccess: () => {
      toast.success('Telegram channel deleted successfully');
      refetch();
      setDeleteChannelId(null);
    },
    onError: error => {
      toast.error('Failed to delete telegram channel', {
        description: error.message,
      });
    },
  });

  const blockMutation = trpc.telegramChannel.channelBlock.useMutation({
    onSuccess: () => {
      toast.success('Telegram channel blocked successfully');
      refetch();
      setBlockChannelId(null);
    },
    onError: error => {
      toast.error('Failed to block telegram channel', {
        description: error.message,
      });
    },
  });

  const unblockMutation = trpc.telegramChannel.channelUnblock.useMutation({
    onSuccess: () => {
      toast.success('Telegram channel unblocked successfully');
      refetch();
      setUnblockChannelId(null);
    },
    onError: error => {
      toast.error('Failed to unblock telegram channel', {
        description: error.message,
      });
    },
  });

  const handleDelete = (chatId: string) => {
    deleteMutation.mutate({ chatId });
  };

  const handleBlock = (chatId: string) => {
    blockMutation.mutate({ chatId });
  };

  const handleUnblock = (chatId: string) => {
    unblockMutation.mutate({ chatId });
  };

  // Filter channels on the frontend
  const channels = data?.channels || [];
  const filteredChannels = channels.filter(channel => {
    const matchesSearch =
      searchTerm === '' ||
      channel.chatTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      channel.fromUsername.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatusFilter === 'all' || channel.status === selectedStatusFilter;

    const matchesType = selectedTypeFilter === 'all' || channel.chatType === selectedTypeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Get unique types for filter dropdown
  const uniqueTypes = [...new Set(channels.map(channel => channel.chatType))];

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStatusFilter('all');
    setSelectedTypeFilter('all');
  };

  return (
    <div className="grid gap-6 p-6 pb-0">
      <FilterContainer onClearFilters={resetFilters}>
        <FilterFields>
          <FilterField label="Search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by title or username..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </FilterField>

          <FilterField label="Status">
            <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="kicked">Kicked</SelectItem>
                <SelectItem value="insufficient_permissions">Insufficient permissions</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Type">
            <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {uniqueTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
        </FilterFields>
      </FilterContainer>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Telegram Channels ({filteredChannels.length})
              {filteredChannels.length !== channels.length && (
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  of {channels.length} total
                </span>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {isError && (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <h3 className="font-medium text-lg mb-2">Error Loading Telegram channels</h3>
              <p>{error.message}</p>
            </div>
          )}

          {filteredChannels.length === 0 && !isLoading && !isError ? (
            <div className="text-center py-8 text-muted-foreground">
              {channels.length === 0
                ? 'No telegram channels found. Channels will appear here when added via the bot.'
                : 'No channels match your current filters.'}
            </div>
          ) : (
            <>
              {/* Table view (hidden on mobile) */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Title</TableHead>
                        <TableHead className="w-[100px]">Type</TableHead>
                        <TableHead className="w-[120px]">Added By</TableHead>
                        <TableHead className="w-[140px]">Added At</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredChannels.map((channel: TelegramChannel) => (
                        <TableRow key={channel.id} className="hover:bg-muted/50">
                          <TableCell>
                            <Link
                              to={`/telegram-channels/${channel.id}`}
                              className="flex items-center space-x-2 font-medium hover:underline"
                            >
                              <span>{channel.chatTitle}</span>
                            </Link>
                          </TableCell>
                          <TableCell className="capitalize">{channel.chatType}</TableCell>
                          <TableCell>{channel.fromUsername}</TableCell>
                          <TableCell>{new Date(channel.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(channel.status)}>
                              {channel.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/telegram-channels/${channel.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {channel.status === 'active' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setBlockChannelId(channel.chatId)}
                                >
                                  <Shield className="h-4 w-4" />
                                </Button>
                              )}
                              {channel.status === 'blocked' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setUnblockChannelId(channel.chatId)}
                                >
                                  <ShieldCheck className="h-4 w-4" />
                                </Button>
                              )}
                              {channel.status === 'kicked' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteChannelId(channel.chatId)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Card view (visible only on mobile) */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredChannels.map((channel: TelegramChannel) => (
                  <Card key={channel.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="px-4 py-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <MessageCircle className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{channel.chatTitle}</h3>
                            <div className="text-sm text-muted-foreground">
                              {channel.chatType} • {channel.fromUsername}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/telegram-channels/${channel.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {channel.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setBlockChannelId(channel.chatId)}
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          )}
                          {channel.status === 'blocked' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setUnblockChannelId(channel.chatId)}
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </Button>
                          )}
                          {channel.status === 'kicked' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteChannelId(channel.chatId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-end pt-2">
                        <div className="text-sm text-muted-foreground">
                          Added {new Date(channel.createdAt).toLocaleDateString()}
                        </div>
                        <Badge className={getStatusBadgeColor(channel.status)}>
                          {channel.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteChannelId} onOpenChange={() => setDeleteChannelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Telegram Channel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this telegram channel? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteChannelId && handleDelete(deleteChannelId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block Confirmation Dialog */}
      <AlertDialog open={!!blockChannelId} onOpenChange={() => setBlockChannelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block Telegram Channel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block this telegram channel? The bot will stop responding to
              messages from this channel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => blockChannelId && handleBlock(blockChannelId)}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unblock Confirmation Dialog */}
      <AlertDialog open={!!unblockChannelId} onOpenChange={() => setUnblockChannelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock Telegram Channel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unblock this telegram channel? The bot will resume responding
              to messages from this channel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unblockChannelId && handleUnblock(unblockChannelId)}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Unblock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AllTelegramChannelsPage;
