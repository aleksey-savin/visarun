import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

import { trpc } from '@/lib/trpc';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { StoreClient } from '@/stores/order/order-store';

import ClientBadge from './ClientBadge';
import ContactMethodIcon from '@/components/ContactMethod/ContactMethodIcon.js';

import { formatCurrency } from '@/utils/currency';

import useOrderStore from '@/stores/order/order-store';

import { Copy, Check, Mail, Pencil, Plus } from 'lucide-react';

const ClientCard = ({
  client,
  totalAmount,
  handleClientEditMode,
}: {
  client: StoreClient;
  totalAmount: number;
  handleClientEditMode: () => void;
}) => {
  const {
    order,
    contactMethods,
    user,
    clients,
    setClients,
    activeClientId,
    setActiveClientId,
    setSaveStatus,
    orderItems,
    visaApplications,
  } = useOrderStore();

  const clientOrderItemsWithPrice = orderItems.filter(
    item => item.clientId === client.id && item.finalPrice !== 0
  );

  const clientVisaApplications =
    visaApplications?.filter(va =>
      clientOrderItemsWithPrice.some(item => item.id === va.orderItemId)
    ) || [];

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

  /** const DateIcon = memo(({ className, ...props }: React.SVGProps<SVGSVGElement>) => {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2 8H10"
          stroke="#FAFAFA"
          stroke-width="1.25"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M7.33398 5.3335L10.0007 8.00016L7.33398 10.6668"
          stroke="#FAFAFA"
          stroke-width="1.25"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M8 14C9.5913 14 11.1174 13.3679 12.2426 12.2426C13.3679 11.1174 14 9.5913 14 8C14 6.4087 13.3679 4.88258 12.2426 3.75736C11.1174 2.63214 9.5913 2 8 2"
          stroke="#FAFAFA"
          stroke-width="1.25"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    );
    }); **/

  const clientIsIncluded = clients.filter(c => c.id === client.id).length > 0;

  const editOrderMutation = trpc.order.edit.useMutation();

  const handleAddToOrder = async () => {
    if (!clientIsIncluded) {
      setSaveStatus('saving');

      await editOrderMutation.mutateAsync({
        id: order.id,
        clients: [...clients.map(c => c.id), client.id],
      });

      setClients([...clients, client]);
      setActiveClientId(client.id);
      setSaveStatus('saved');
    }
  };

  return (
    <>
      <Card className={cn(' p-6 border-t-0 border-x-0', clientIsIncluded ? 'bg-secondary' : '')}>
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
                  <ContactMethodIcon
                    method={
                      contact.method
                        ? { name: contact.method.name, icon: contact.method.icon }
                        : { name: 'unknown', icon: null }
                    }
                    className="w-3 h-3"
                  />
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
            {clientOrderItemsWithPrice.length > 0 && (
              <>
                {clientVisaApplications.map(application => (
                  <div key={`${application.id}-visa-data`} className="flex items-center">
                    <Badge variant="accent" className="rounded-r-none">
                      Visa - {application.country.name} - {application.visaType.name}
                    </Badge>
                    <Badge variant="secondary" className="rounded-l-none">
                      {application.plannedCountryEntryDate?.toLocaleDateString()} -{' '}
                      {application.plannedCountryEntryDate?.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Badge>
                  </div>
                ))}
              </>
            )}
          </div>
          <hr />
          <div className="flex justify-end gap-2">
            {clientIsIncluded && (
              <Button variant="secondary" onClick={handleClientEditMode}>
                {activeClientId === client.id ? 'Edit Client' : 'Edit'} <Pencil />
              </Button>
            )}
            {!clientIsIncluded && (
              <Button variant="primary" onClick={handleAddToOrder}>
                Add to order <Plus />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </>
  );
};

export default ClientCard;
