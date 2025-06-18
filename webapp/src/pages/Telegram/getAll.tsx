import { trpc } from '../../lib/trpcProvider';
import { Link, useNavigate } from 'react-router-dom';

import { MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  const { data, error, isLoading, isError } = trpc.telegramChannel.getAll.useQuery();

  return (
    <>
      <div className="flex sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="text-3xl sm:text-5xl font-semibold capitalize">Telegram</div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {data?.channels && (
        <>
          {/* Table view (hidden on mobile) */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Added By</TableHead>
                  <TableHead>Added At</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.channels.map((channel: TelegramChannel) => (
                  <TableRow
                    key={channel.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/telegram-channels/${channel.id}`)}
                  >
                    <TableCell>
                      <Link to={`/telegram-channels/${channel.id}`}>{channel.chatTitle}</Link>
                    </TableCell>
                    <TableCell>{channel.chatType}</TableCell>
                    <TableCell>{channel.fromUsername}</TableCell>
                    <TableCell>{new Date(channel.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="capitalize">
                      <Badge className={getStatusBadgeColor(channel.status)}>
                        {channel.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Card view (visible only on mobile) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {data.channels.map((channel: TelegramChannel) => (
              <Card
                key={channel.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/telegram-channels/${channel.id}`)}
              >
                <CardContent className="px-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <MessageCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{channel.chatTitle}</h3>
                        <div className="flex items-center text-sm text-muted-foreground"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Badge className={getStatusBadgeColor(channel.status)}>{channel.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {isError && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <h3 className="font-medium text-lg mb-2">Error Loading Telegram channels</h3>
          <p>{error.message}</p>
        </div>
      )}

      {data?.channels && data.channels.length === 0 && (
        <div className="p-12 text-center border rounded-lg">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No telegram channels or groups found</h3>
        </div>
      )}
    </>
  );
};

export default AllTelegramChannelsPage;
