import { trpc } from '../../lib/trpcProvider';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { Search, Eye } from 'lucide-react';
import { FilterContainer, FilterFields, FilterField } from '@/components/Filters';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { getViewMessageTemplateRoute } from '@/lib/routes';
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
            ? 'No message templates found. Create one to get started.'
            : 'No message templates match your current filters.'}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto rounded-md border border-muted">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted hover:bg-gray-800/50">
                    <TableHead className="w-[200px]">Title</TableHead>
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
                      <TableCell className="max-w-md">
                        <div className="truncate">{messageTemplate.body}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {messageTemplate.telegramChannels.map(channel => (
                            <Badge key={channel.id} variant="secondary" className="text-xs">
                              {channel.chatTitle}
                            </Badge>
                          ))}
                        </div>
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
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {filteredMessageTemplates.map((messageTemplate: MessageTemplate) => (
              <Card key={messageTemplate.id} className="border border-muted">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Link
                      to={getViewMessageTemplateRoute({ id: messageTemplate.id })}
                      className="hover:underline flex-1"
                    >
                      <CardTitle className="text-base">
                        <span className="font-medium text-foreground">{messageTemplate.title}</span>
                      </CardTitle>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Body:</span>
                      <p className="text-sm line-clamp-3">{messageTemplate.body}</p>
                    </div>
                    {messageTemplate.telegramChannels.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">Telegram Channels:</span>
                        <div className="flex flex-wrap gap-1">
                          {messageTemplate.telegramChannels.map(channel => (
                            <Badge key={channel.id} variant="secondary" className="text-xs">
                              {channel.chatTitle}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(getViewMessageTemplateRoute({ id: messageTemplate.id }))
                        }
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AllMessageTemplatesPage;
