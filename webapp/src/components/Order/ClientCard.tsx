import { useState, useEffect } from 'react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Client } from '@/types/Client.js';

import ClientBadge from './ClientBadge';
import ContactMethodIcon from '@/components/ContactMethod/ContactMethodIcon.js';

import { formatCurrency } from '@/utils/currency';

import useOrderStore from '@/stores/order/order-store';

import { Copy, Check, Mail, Pencil } from 'lucide-react';

const ClientCard = ({
  client,
  totalAmount,
  handleClientEditMode,
}: {
  client: Client;
  totalAmount: number;
  handleClientEditMode: () => void;
}) => {
  const { contactMethods, user } = useOrderStore();

  const [copiedContact, setCopiedContact] = useState<string | null>(null);
  const handleCopyToClipboard = (text: string, event: React.MouseEvent, contactId: string) => {
    event.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedContact(contactId);
  };

  useEffect(() => {
    if (copiedContact) {
      const timer = setTimeout(() => {
        setCopiedContact(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedContact]);
  return (
    <>
      <Card className="p-6">
        <div className="grid gap-6">
          <div className="flex items-center justify-between gap-2 text-lg">
            <ClientBadge client={client} showLinkedClients={false} />
            <span className="text-sm text-foreground">{formatCurrency(totalAmount, 'VND')}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {client.citizenship && (
              <Badge variant="secondary" className="bg-muted">
                {client.citizenship?.name} ({client.citizenship?.abbreviation})
              </Badge>
            )}

            {client.isPrimary &&
              contactMethods?.map(contact => (
                <Badge
                  key={contact.id}
                  variant="secondary"
                  className={`cursor-pointer transition-all duration-300 ${
                    copiedContact === contact.id
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                  onClick={e =>
                    contact.value &&
                    contact.id &&
                    handleCopyToClipboard(contact.value, e, contact.id)
                  }
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
            {client.isPrimary && user?.email && (
              <Badge
                variant="secondary"
                className={`cursor-pointer transition-all duration-300 ${
                  copiedContact === 'email'
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-muted hover:bg-muted/80'
                }`}
                onClick={e => user?.email && handleCopyToClipboard(user.email, e, 'email')}
              >
                <Mail className="w-3 h-3" />
                {user?.email}
                {copiedContact === 'email' ? (
                  <Check className="w-3 h-3 ml-1 animate-pulse" />
                ) : (
                  <Copy className="w-3 h-3 ml-1" />
                )}
              </Badge>
            )}
          </div>
          <hr />
          <div className="flex justify-end">
            <Button variant="secondary" onClick={handleClientEditMode}>
              Edit <Pencil />
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
};

export default ClientCard;
