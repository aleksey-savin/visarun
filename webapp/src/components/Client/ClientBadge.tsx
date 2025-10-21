import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

import { Crown, User } from 'lucide-react';

const ClientBadge = ({
  client,
  showLinkedClients,
  fullWidth = false,
}: {
  client: any;
  showLinkedClients?: boolean;
  fullWidth?: boolean;
}) => {
  return (
    <>
      {client.isPrimary && (
        <div className="flex flex-wrap gap-1 w-full">
          <Badge variant="primary" className={cn(fullWidth ? 'w-full' : '')}>
            <Crown />
            <span>
              {client.lastName || ''} {client.firstName || ''}
            </span>
          </Badge>
          {showLinkedClients && (
            <Badge variant="secondary">
              <span>+ {client.relatedClients?.length}</span>
              <User />
            </Badge>
          )}
        </div>
      )}
      {!client.isPrimary && (
        <div className="flex gap-1 w-full">
          <Badge variant="primary">
            <Crown />
          </Badge>{' '}
          <div className="w-full">
            <Badge variant="secondary" className={cn(fullWidth ? 'w-full' : '', ' bg-emerald-900')}>
              <User />
              {client.lastName || ''} {client.firstName || ''}
            </Badge>
          </div>
        </div>
      )}
    </>
  );
};

export default ClientBadge;
