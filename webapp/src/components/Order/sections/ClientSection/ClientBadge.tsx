//import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

import { Crown, User, AlertTriangle } from 'lucide-react';

import useOrderStore from '@/stores/order/order-store';

import { clientHasServicePuzzleErrors, clientHasPersonalDataErrors } from '@/utils/clientHasErrors';

//import { trpc } from '@/lib/trpc';

const ClientBadge = ({
  client,
  showLinkedClients,
  stepStatus,
}: {
  client: any;
  showLinkedClients: boolean;
  stepStatus?: string;
}) => {
  const { activeClientId, orderItems, visaApplications, clients, user } = useOrderStore();

  //const [user, setUser] = useState<any>(null);

  //const { data: userData } = trpc.user.getOne.useQuery(
  //  { id: client.userId! },
  //  { enabled: !!client.userId }
  //);

  //useEffect(() => {
  //  if (userData) {
  //    setUser(userData.user);
  //  }
  //}, [userData]);
  //

  // Get errors based on the current step
  const getClientErrors = () => {
    if (clients.length === 0) return [];

    const servicePuzzleErrors = clientHasServicePuzzleErrors(client, orderItems, visaApplications);
    const personalDataErrors = clientHasPersonalDataErrors(client, user);

    // Show appropriate errors based on step status
    if (stepStatus === 'personal_data_verification') {
      // In personal data step, show both service puzzle and personal data errors
      return new Set([...servicePuzzleErrors, ...personalDataErrors]);
    } else if (stepStatus === 'payment_pending') {
      // In payment step, show both types of errors
      return new Set([...servicePuzzleErrors, ...personalDataErrors]);
    } else {
      // In service puzzle step (draft) or default, show only service puzzle errors
      return servicePuzzleErrors;
    }
  };

  const clientErrors = getClientErrors();

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
                    {client.lastName || ''} {client.firstName || ''}
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
                  {client.lastName || ''} {client.firstName || ''}
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
                  {client.lastName || ''} {client.firstName || ''}
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
                {client.lastName || ''} {client.firstName || ''}
              </Badge>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default ClientBadge;
