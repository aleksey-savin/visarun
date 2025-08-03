import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { Search, UserPlus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import ClientCard from './client-card';

interface ClientSearchModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientSearchModal({ isOpen, onOpenChange }: ClientSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [addClientIsActive, setAddClientIsActive] = useState(false);

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
  } = trpc.client.search.useQuery(
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-2xl flex flex-col bg-secondary [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 text-foreground text-lg">
            <div className="flex gap-2 items-center">
              <span className="font-semibold">Client</span> <UserPlus />
            </div>
            <Button
              variant={addClientIsActive ? 'default' : 'secondary'}
              disabled={!addClientIsActive}
              className="border"
            >
              Add new
            </Button>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Search for clients by name, email, or contact information
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Telegram / E-mail / WhatsApp / Zalo / Facebook"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 border-border"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  onOpenChange(false);
                }
              }}
            />
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
            <div className="space-y-6">
              {searchResults?.clients.map(client => <ClientCard key={client.id} client={client} />)}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
