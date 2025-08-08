import { Client } from '@/types/Client.tsx';

import { Badge } from '../ui/badge';

import { Crown, User } from 'lucide-react';

const ClientBadge = ({
  client,
  showLinkedClients,
}: {
  client: Client;
  showLinkedClients: boolean;
}) => {
  return (
    <>
      {client.isPrimary && (
        <div className="flex gap-1">
          <Badge variant="primary">
            <Crown />
            <span>
              {client.firstName || ''} {client.lastName || ''}
            </span>
          </Badge>
          {showLinkedClients && (
            <Badge variant="secondary">
              <User />
            </Badge>
          )}
        </div>
      )}
      {!client.isPrimary && (
        <div className="flex gap-1">
          <Badge variant="primary">
            <Crown />
          </Badge>
          <Badge variant="secondary">
            <User />
            {client.firstName || ''} {client.lastName || ''}
          </Badge>
        </div>
      )}
    </>
  );
};

export default ClientBadge;
