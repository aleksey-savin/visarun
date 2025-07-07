import { trpc } from '../../lib/trpcProvider';
import { useNavigate } from 'react-router-dom';

import { MessageCircle, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCreateMessageTemplateRoute, getViewMessageTemplateRoute } from '@/lib/routes';

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

  //   id               String            @id @default(uuid())
  //   title            String
  //   body             String
  const { data, error, isLoading, isError } = trpc.messageTemplate.getAll.useQuery();

  const handleTemplateClick = (id: string) => {
    navigate(getViewMessageTemplateRoute({ id: id }));
  };

  return (
    <>
      <div className="flex sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="text-3xl sm:text-5xl font-semibold capitalize">Message Templates</div>
        <Button onClick={() => navigate(getCreateMessageTemplateRoute())}>
          <PlusIcon className="mr-2 h-4 w-4" /> Create Message Template
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Title</TableHead>
            <TableHead>Body</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.messageTemplates.map((messageTemplate: MessageTemplate) => (
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

      {isError && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <h3 className="font-medium text-lg mb-2">Error Loading Message Templates</h3>
          <p>{error.message}</p>
        </div>
      )}

      {data?.messageTemplates && data.messageTemplates.length === 0 && (
        <div className="p-12 text-center border rounded-lg">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No message templates found</h3>
        </div>
      )}
    </>
  );
};

export default AllMessageTemplatesPage;
