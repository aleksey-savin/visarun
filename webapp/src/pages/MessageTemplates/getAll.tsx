import { trpc } from '../../lib/trpcProvider';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PlusIcon, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getCreateMessageTemplateRoute, getViewMessageTemplateRoute } from '@/lib/routes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Define a type for the message template based on your Prisma schema
type MessageTemplate = {
  id: string;
  title: string;
  body: string;
  //   telegramChannels TelegramChannel[]
};

const AllMessageTemplatesPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  //   id               String            @id @default(uuid())
  //   title            String
  //   body             String
  const { data, error, isLoading, isError } = trpc.messageTemplate.getAll.useQuery();

  // Filter templates on the frontend
  const messageTemplates = data?.messageTemplates || [];
  const filteredMessageTemplates = messageTemplates.filter(messageTemplate => {
    const matchesSearch =
      searchTerm === '' || messageTemplate.title.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleTemplateClick = (id: string) => {
    navigate(getViewMessageTemplateRoute({ id: id }));
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Message Templates</h1>
          <p className="text-muted-foreground">
            Manage templates and attach them to telegram channels
          </p>
        </div>
        <Button onClick={() => navigate(getCreateMessageTemplateRoute())}>
          <PlusIcon className="mr-2 h-4 w-4" /> Create Message Template
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Message Templates ({filteredMessageTemplates.length})
              {filteredMessageTemplates.length !== messageTemplates.length && (
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  of {messageTemplates.length} total
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
              <h3 className="font-medium text-lg mb-2">Error Loading Message Templates</h3>
              <p>{error.message}</p>
            </div>
          )}

          {filteredMessageTemplates.length === 0 && !isLoading && !isError ? (
            <div className="text-center py-8 text-muted-foreground">
              {messageTemplates.length === 0
                ? 'No users found. Create one to get started.'
                : 'No users match your current filters.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Title</TableHead>
                  <TableHead>Body</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessageTemplates.map((messageTemplate: MessageTemplate) => (
                  <TableRow
                    key={messageTemplate.id}
                    className="cursor-pointer hover:bg-muted/50"
                    //   onClick={() => navigate(`/telegram-channels/${channel.id}`)}
                  >
                    <TableCell onClick={() => handleTemplateClick(messageTemplate.id)}>
                      {messageTemplate.title}
                    </TableCell>
                    <TableCell
                      className="whitespace-pre-wrap max-w-lg"
                      onClick={() => handleTemplateClick(messageTemplate.id)}
                    >
                      {messageTemplate.body}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AllMessageTemplatesPage;
