import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import { User, Crown, Mail, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { getViewClientRoute } from '@/lib/routes';
import { Card } from '../ui/card';
import { ContactMethodIcon } from '../ContactMethod';

import { trpc } from '@/lib/trpc';

interface RelatedClient {
  id: string;
  firstName: string | null;
  lastName: string | null;
  isPrimary: boolean;
}

interface ContactMethod {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  value: string;
  url: string | null;
  contactMethodId: string;
  method: {
    id: string;
    name: string;
    icon: string | null;
  };
}

interface User {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string | null;
  contactMethods?: ContactMethod[];
}

interface Citizenship {
  id: string;
  name: string;
  abbreviation: string;
}

interface Client {
  id: string;
  firstName: string | null;
  lastName: string | null;
  isPrimary: boolean;
  user: User | null;
  citizenship: Citizenship | null;
  relatedClients?: RelatedClient[];
}

interface ClientCardProps {
  client: Client;
  isFirstResult?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (clientId: string, isSelected: boolean) => void;
  isSelectable?: boolean;
  showLinkedClients?: boolean;
  showLatestOrderItems?: boolean;
}

const ClientCard = ({
  client,
  isFirstResult = false,
  isSelected = false,
  onSelectionChange,
  isSelectable = true,
  showLinkedClients = false,
  showLatestOrderItems = false,
}: ClientCardProps) => {
  const navigate = useNavigate();

  const { data: orderItemsData } = trpc.orderItem.getLatestByClientId.useQuery({
    clientId: client.id,
  });

  if (showLatestOrderItems) {
    console.log(orderItemsData);
  }

  const [copiedContact, setCopiedContact] = useState<string | null>(null);

  const handleClientNameClick = (event: React.MouseEvent, clientId: string) => {
    event.stopPropagation();
    navigate(getViewClientRoute({ id: clientId }));
  };

  const handleCopyToClipboard = (text: string, event: React.MouseEvent, contactId: string) => {
    event.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedContact(contactId);
  };

  const handleCheckboxChange = (checked: boolean) => {
    if (isSelectable) {
      onSelectionChange?.(client.id, checked);
    }
  };

  useEffect(() => {
    if (copiedContact) {
      const timer = setTimeout(() => {
        setCopiedContact(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedContact]);

  //

  return (
    <Card
      key={client.id}
      className={`p-6 bg-secondary ${isFirstResult ? 'shadow-[inset_0px_0px_20px_3px_#FAFAFA59] transition-colors' : ''} ${!isSelectable ? 'opacity-50' : ''}`}
      tabIndex={0}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-2 flex-wrap">
            {client.isPrimary && (
              <div className="flex gap-1">
                <Badge
                  variant="primary"
                  className="cursor-pointer"
                  onClick={e => handleClientNameClick(e, client.id)}
                >
                  <Crown />
                  <span>
                    {client.firstName || ''} {client.lastName || ''}
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
              <div className="flex gap-1">
                <Badge variant="primary">
                  <Crown />
                </Badge>
                <Badge
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={e => handleClientNameClick(e, client.id)}
                >
                  <User />
                  {client.firstName || ''} {client.lastName || ''}
                </Badge>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {client.citizenship && (
              <Badge variant="secondary" className="bg-muted">
                {client.citizenship?.name} ({client.citizenship?.abbreviation})
              </Badge>
            )}

            {client.isPrimary &&
              client.user?.contactMethods?.map(contact => (
                <Badge
                  key={contact.id}
                  variant="secondary"
                  className={`cursor-pointer transition-all duration-300 ${
                    copiedContact === contact.id
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                  onClick={e => handleCopyToClipboard(contact.value, e, contact.id)}
                >
                  <ContactMethodIcon method={contact.method} className="w-3 h-3" />
                  {` ${contact.value}`}
                  {copiedContact === contact.id ? (
                    <Check className="w-3 h-3 ml-1 animate-pulse" />
                  ) : (
                    <Copy className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            {client.isPrimary && client.user?.email && (
              <Badge
                variant="secondary"
                className={`cursor-pointer transition-all duration-300 ${
                  copiedContact === 'email'
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-muted hover:bg-muted/80'
                }`}
                onClick={e =>
                  client.user?.email && handleCopyToClipboard(client.user.email, e, 'email')
                }
              >
                <Mail className="w-3 h-3" />
                {client.user.email}
                {copiedContact === 'email' ? (
                  <Check className="w-3 h-3 ml-1 animate-pulse" />
                ) : (
                  <Copy className="w-3 h-3 ml-1" />
                )}
              </Badge>
            )}
          </div>
        </div>

        {/* Checkbox in top right corner */}
        {onSelectionChange && (
          <div className="ml-4">
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleCheckboxChange}
              disabled={!isSelectable}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default ClientCard;
