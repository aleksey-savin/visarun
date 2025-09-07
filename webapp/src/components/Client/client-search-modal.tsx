import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { Search, UserPlus, CheckSquare, Square } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { getEditOrderRoute } from '@/lib/routes';
import ClientCard from './ClientCard';

interface ClientSearchModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientSearchModal({ isOpen, onOpenChange }: ClientSearchModalProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [addClientIsActive, setAddClientIsActive] = useState(false);
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Clear search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setDebouncedQuery('');
      setClientIds([]);
      setSelectedUserId(null);
    }
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onOpenChange(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onOpenChange]);

  // Search clients query
  const {
    data: searchResults,
    isLoading,
    error,
  } = trpc.clientData.search.useQuery(
    { query: debouncedQuery },
    {
      enabled: debouncedQuery.length >= 2 && isOpen,
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    if (searchResults?.clients.length === 0) {
      setAddClientIsActive(true);
    } else {
      setAddClientIsActive(false);
    }
  }, [searchResults]);

  // Process search results to ensure both primary and related clients are shown:
  // - If only non-primary clients found: add their primary clients
  // - If only primary clients found: add their related non-primary clients
  const processedClients = useMemo(() => {
    if (!searchResults?.clients) return [];

    const clients = [...searchResults.clients];

    // Check if all clients are non-primary
    const hasOnlyNonPrimaryClients =
      clients.length > 0 && clients.every(client => !client.isPrimary);

    // Check if all clients are primary
    const hasOnlyPrimaryClients = clients.length > 0 && clients.every(client => client.isPrimary);

    if (hasOnlyNonPrimaryClients) {
      // Get unique user IDs from non-primary clients
      const userIds = new Set(clients.map(client => client.user?.id).filter(Boolean));

      // For each user, find their primary client and add it if not already in results
      userIds.forEach(userId => {
        const user = clients.find(client => client.user?.id === userId)?.user;
        if (user) {
          // Create a primary client representation for this user
          const primaryClient = {
            id: `primary-${userId}`,
            firstName: user.firstName,
            lastName: user.lastName,
            isPrimary: true,
            userId: userId as string | null,
            citizenshipId: null,
            passportExpirationDate: null,
            prevViolations: false,
            prevViolationsDesc: null,
            isOutsideTheCountry: false,
            isOutsideTheCountryAt: null,
            user: user,
            citizenship: null,
            documents: [],
            relatedClients: clients.filter(
              client => client.user?.id === userId && !client.isPrimary
            ),
          };

          // Add primary client if not already in results
          const alreadyExists = clients.some(
            client => client.isPrimary && client.user?.id === userId
          );

          if (!alreadyExists) {
            clients.push(primaryClient);
          }
        }
      });
    } else if (hasOnlyPrimaryClients) {
      // When only primary clients are found, also show their related non-primary clients
      // This ensures users can see all available clients for the same user
      const relatedClientsToAdd: (typeof clients)[0][] = [];

      clients.forEach(primaryClient => {
        if (primaryClient.relatedClients && primaryClient.relatedClients.length > 0) {
          primaryClient.relatedClients.forEach(relatedClient => {
            // Create a full client object for each related non-primary client
            const fullRelatedClient = {
              id: relatedClient.id,
              firstName: relatedClient.firstName,
              lastName: relatedClient.lastName,
              isPrimary: relatedClient.isPrimary,
              userId: primaryClient.userId,
              citizenshipId: null,
              passportExpirationDate: null,
              prevViolations: false,
              prevViolationsDesc: null,
              isOutsideTheCountry: false,
              isOutsideTheCountryAt: null,
              user: primaryClient.user,
              citizenship: primaryClient.citizenship,
              documents: [],
              relatedClients: [
                {
                  id: primaryClient.id,
                  firstName: primaryClient.firstName,
                  lastName: primaryClient.lastName,
                  isPrimary: primaryClient.isPrimary,
                },
              ],
            };

            // Only add if this related client isn't already in the results
            const alreadyExists = clients.some(client => client.id === relatedClient.id);
            if (!alreadyExists) {
              relatedClientsToAdd.push(fullRelatedClient);
            }
          });
        }
      });

      clients.push(...relatedClientsToAdd);
    }

    return clients;
  }, [searchResults]);

  // Get clients that can be selected (same userId as currently selected, or all if none selected)
  const selectableClients = useMemo(() => {
    if (!selectedUserId) return processedClients;

    return processedClients.filter(client => {
      const clientUserId = client.user?.id || client.userId;
      return clientUserId === selectedUserId;
    });
  }, [processedClients, selectedUserId]);

  // Check if all selectable clients are selected
  const allSelectableSelected = useMemo(() => {
    if (selectableClients.length === 0) return false;
    return selectableClients.every(client => clientIds.includes(client.id));
  }, [selectableClients, clientIds]);

  const createClientMutation = trpc.clientData.create.useMutation();
  const createOrderMutation = trpc.order.create.useMutation();

  // Handle client selection change
  const handleClientSelectionChange = (clientId: string, isSelected: boolean) => {
    const client = processedClients.find(c => c.id === clientId);
    if (!client) return;

    const clientUserId = client.user?.id || client.userId;

    if (isSelected) {
      // If this is the first selection or same userId, allow selection
      if (!selectedUserId || clientUserId === selectedUserId) {
        setClientIds(prev => (prev.includes(clientId) ? prev : [...prev, clientId]));
        if (!selectedUserId && clientUserId) {
          setSelectedUserId(clientUserId);
        }
      } else {
        // Different userId - clear previous selections and start fresh
        setClientIds([clientId]);
        setSelectedUserId(clientUserId);
      }
    } else {
      // Remove client ID
      setClientIds(prev => {
        const newIds = prev.filter(id => id !== clientId);
        // If no clients left, clear selected userId
        if (newIds.length === 0) {
          setSelectedUserId(null);
        }
        return newIds;
      });
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (allSelectableSelected) {
      // Deselect all
      setClientIds([]);
      setSelectedUserId(null);
    } else {
      // Select all selectable clients
      if (selectableClients.length > 0) {
        const allIds = selectableClients.map(client => client.id);
        setClientIds(allIds);

        // Set userId if not already set
        if (!selectedUserId) {
          const firstClient = selectableClients[0];
          const firstClientUserId = firstClient.user?.id || firstClient.userId;
          if (firstClientUserId) {
            setSelectedUserId(firstClientUserId);
          }
        }
      }
    }
  };

  // Check if a client can be selected
  const isClientSelectable = (client: (typeof processedClients)[0]) => {
    if (!selectedUserId) return true;
    const clientUserId = client.user?.id || client.userId;
    return clientUserId === selectedUserId;
  };

  const handleAddNewOrder = async () => {
    onOpenChange(false);

    const clients: string[] = [...clientIds];
    let userId: string | undefined;

    if (clientIds.length === 0) {
      const clientResult = await createClientMutation.mutateAsync({
        firstName: '',
        lastName: '',
        userData: {
          firstName: '',
          lastName: '',
        },
      });

      if (clientResult?.client?.id) {
        clients.push(clientResult.client.id);
        userId = clientResult.client.userId || undefined;
      }
    } else {
      // Get userId from the selected clients (they all have the same userId)
      userId = selectedUserId || undefined;
    }

    const newOrderData = await createOrderMutation.mutateAsync({
      userId: userId || '',
      clients: clients,
      status: 'draft',
    });

    navigate(getEditOrderRoute({ id: newOrderData?.order?.id }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="md:min-w-2xl flex flex-col bg-secondary [&>button]:hidden max-h-[90svh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 text-foreground text-lg">
            <div className="flex gap-2 items-center">
              <span className="font-semibold">Client</span> <UserPlus />
              {clientIds.length > 0 && (
                <span className="text-sm text-muted-foreground">({clientIds.length} selected)</span>
              )}
            </div>
            <Button
              variant={addClientIsActive || clientIds.length > 0 ? 'default' : 'secondary'}
              disabled={!addClientIsActive && clientIds.length === 0}
              className="border"
              onClick={handleAddNewOrder}
            >
              {clientIds.length > 0 ? 'Create Order' : 'Add new'}
            </Button>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Search for clients by name, email, or contact information
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 flex-1 min-h-0">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 display-none md:display-block" />
              <Input
                type="text"
                placeholder="Search by name or contact ..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="md:pl-10 border-border"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Escape') {
                    onOpenChange(false);
                  }
                }}
              />
            </div>

            {processedClients.length > 0 && selectableClients.length > 0 && (
              <div className="flex justify-end items-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSelectAll}
                  className="flex items-center gap-2"
                >
                  {allSelectableSelected ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  {allSelectableSelected ? 'Deselect All' : 'Select All'}
                  {selectableClients.length < processedClients.length && selectedUserId && (
                    <span className="text-xs text-muted-foreground">
                      ({selectableClients.length} available)
                    </span>
                  )}
                </Button>
                {selectedUserId && selectableClients.length < processedClients.length && (
                  <span className="text-xs text-muted-foreground">
                    Only clients from the same user can be selected together
                  </span>
                )}
              </div>
            )}
          </div>

          {!debouncedQuery || debouncedQuery.length < 2 ? (
            <div className="text-center text-muted-foreground py-6">
              Type at least 2 characters to search for clients...
            </div>
          ) : isLoading ? (
            <div className="flex flex-col space-y-6">
              {/* Loading skeleton */}
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
                <div className="h-4 bg-muted rounded animate-pulse w-2/3"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded animate-pulse w-4/5"></div>
                <div className="h-4 bg-muted rounded animate-pulse w-3/5"></div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center text-destructive py-6">
              Error searching clients. Please try again.
            </div>
          ) : searchResults?.clients.length === 0 ? (
            <div className="text-center text-muted-foreground py-6">
              No clients found for "{debouncedQuery}"
            </div>
          ) : (
            <div className="space-y-6 flex-1 overflow-y-auto scrollbar-hide min-h-0">
              {processedClients
                .sort((a, b) => {
                  // Primary client first
                  if (a.isPrimary && !b.isPrimary) return -1;
                  if (!a.isPrimary && b.isPrimary) return 1;
                  return 1;
                })
                .map((client, index) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    showLinkedClients
                    isFirstResult={index === 0}
                    isSelected={clientIds.includes(client.id)}
                    onSelectionChange={handleClientSelectionChange}
                    isSelectable={isClientSelectable(client)}
                  />
                ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
