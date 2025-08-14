import { StoreClient } from '@/stores/order/order-store';

import { Badge } from '../ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';

import { Crown, User, AlertTriangle } from 'lucide-react';

import useOrderStore from '@/stores/order/order-store';

import { clientHasErrors } from '@/utils/clientHasErrors';

const ClientBadge = ({
  client,
  showLinkedClients,
}: {
  client: StoreClient;
  showLinkedClients: boolean;
}) => {
  const { activeClientId, orderItems, visaApplications, clients } = useOrderStore();

  const clientErrors = clientHasErrors(client, orderItems, visaApplications);

  const clientIsIncluded = clients.filter(c => c.id === client.id).length > 0;

  return (
    <>
      {client.isPrimary && (
        <>
          {/* Primary client with errors*/}
          {Array.from(clientErrors || []).length > 0 &&
            activeClientId !== client.id &&
            clientIsIncluded && (
              <div className="flex gap-1">
                <Badge variant="destructive">
                  <Crown />
                  <span>
                    {client.firstName || ''} {client.lastName || ''}
                  </span>
                </Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertTriangle className="text-destructive" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-destructive">
                    <ul>
                      {Array.from(clientErrors || []).map(error => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>

                {showLinkedClients && (
                  <Badge variant="secondary" className="bg-emerald-900">
                    <User />
                  </Badge>
                )}
              </div>
            )}
          {/* Primary client with NO errors*/}
          {(Array.from(clientErrors || []).length === 0 || activeClientId === client.id) && (
            <div className="flex gap-1">
              <Badge variant="primary">
                <Crown />
                <span>
                  {client.firstName || ''} {client.lastName || ''}
                </span>
              </Badge>
              {showLinkedClients && (
                <Badge variant="secondary" className="bg-emerald-900">
                  <User />
                </Badge>
              )}
            </div>
          )}
        </>
      )}
      {!client.isPrimary && (
        <>
          {/* Primary linked client with errors*/}
          {Array.from(clientErrors || []).length > 0 &&
            activeClientId !== client.id &&
            clientIsIncluded && (
              <div className="flex gap-1">
                <Badge variant="primary">
                  <Crown />
                </Badge>
                <Badge variant="destructive">
                  <User />
                  {client.firstName || ''} {client.lastName || ''}
                </Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertTriangle className="text-destructive" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-destructive">
                    <ul>
                      {Array.from(clientErrors || []).map(error => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          {/* Primary client with NO errors*/}
          {(Array.from(clientErrors || []).length === 0 ||
            activeClientId === client.id ||
            !clientIsIncluded) && (
            <div className="flex gap-1">
              <Badge variant="primary">
                <Crown />
              </Badge>
              <Badge variant="secondary" className="bg-emerald-900">
                <User />
                {client.firstName || ''} {client.lastName || ''}
              </Badge>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default ClientBadge;
