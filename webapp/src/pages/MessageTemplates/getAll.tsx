import { trpc } from '../../lib/trpcProvider';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { Search, Eye } from 'lucide-react';
import { FilterContainer, FilterFields, FilterField } from '@/components/Filters';
import { Input } from '@/components/ui/input';

import { getViewMessageTemplateRoute } from '@/lib/routes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
  telegramChannels: {
    id: string;
    chatTitle: string;
  }[];
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

  const resetFilters = () => {
    setSearchTerm('');
  };

  return (
    <div className="grid gap-6 p-6 pb-0">
      <FilterContainer onClearFilters={resetFilters}>
        <FilterFields>
          <FilterField label="Search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by title..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </FilterField>
        </FilterFields>
      </FilterContainer>

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
                  <TableHead>Telegram Channels</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessageTemplates.map((messageTemplate: MessageTemplate) => (
                  <TableRow key={messageTemplate.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link
                        to={getViewMessageTemplateRoute({ id: messageTemplate.id })}
                        className="hover:underline font-medium"
                      >
                        {messageTemplate.title}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-pre-wrap max-w-lg">
                      {messageTemplate.body}
                    </TableCell>
                    <TableCell className="whitespace-pre-wrap max-w-lg">
                      {messageTemplate.telegramChannels
                        .map((channel: { id: string; chatTitle: string }) => channel.chatTitle)
                        .join(' ')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(getViewMessageTemplateRoute({ id: messageTemplate.id }))
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
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
