import { useState, useMemo, useRef, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { trpc } from '@/lib/trpc';
import { Check, ChevronDown, Search, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface CitizenshipSelectProps {
  value?: string;
  onValueChange: (citizenshipId: string) => void;
  currentCitizenship?: string;
  label?: string;
  placeholder?: string;
  className?: string;
}

const CitizenshipSelect = ({
  value,
  onValueChange,
  currentCitizenship,
  label = 'Citizenship',
  placeholder = 'Select citizenship',
  className = 'min-w-52',
}: CitizenshipSelectProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const {
    data: citizenshipsData,
    error: citizenshipsError,
    isLoading: citizenshipsLoading,
  } = trpc.citizenship.getAll.useQuery(
    {
      offset: 0,
      favourite: searchTerm ? undefined : true,
      search: debouncedSearchTerm,
      citizenshipId: value || currentCitizenship,
    },
    {
      enabled: isOpen || !!value,
    }
  );

  const citizenships = useMemo(() => citizenshipsData?.citizenships || [], [citizenshipsData]);

  // Find selected citizenship for display
  const selectedCitizenship = useMemo(() => {
    return citizenships.find(c => c.id === value);
  }, [citizenships, value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  const handleSelect = (citizenshipId: string) => {
    onValueChange(citizenshipId === value ? '' : citizenshipId);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <div className="relative" ref={containerRef}>
          <Button
            type="button"
            variant="secondary"
            role="combobox"
            aria-expanded={isOpen}
            className={cn('justify-between', className, !value && 'text-muted-foreground')}
            onClick={handleToggle}
          >
            <span className="truncate">
              {selectedCitizenship
                ? `${selectedCitizenship.name} (${selectedCitizenship.abbreviation})`
                : placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>

          {isOpen && (
            <div
              className={cn(
                'absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-md animate-in fade-in-0 zoom-in-95'
              )}
            >
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Search citizenships..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="h-8 pl-8"
                    onKeyDown={e => {
                      if (e.key === 'Escape') {
                        setIsOpen(false);
                      }
                    }}
                  />
                </div>
              </div>

              <ScrollArea>
                <div className="p-1">
                  {citizenshipsLoading ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading...</div>
                  ) : citizenshipsError ? (
                    <div className="px-2 py-1.5 text-sm text-destructive">
                      Error loading citizenships
                    </div>
                  ) : citizenships.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {searchTerm ? 'No results found' : 'No citizenships available'}
                    </div>
                  ) : (
                    citizenships.map(citizenship => (
                      <button
                        key={citizenship.id}
                        type="button"
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm transition-colors text-left',
                          'hover:bg-accent hover:text-accent-foreground',
                          'focus:bg-accent focus:text-accent-foreground focus:outline-none',
                          value === citizenship.id && 'bg-secondary'
                        )}
                        onClick={() => handleSelect(citizenship.id)}
                        onMouseDown={e => e.preventDefault()} // Prevent focus loss
                      >
                        <Check
                          className={cn(
                            'h-4 w-4 shrink-0',
                            value === citizenship.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="flex-1 truncate">
                          {citizenship.name} ({citizenship.abbreviation})
                        </span>
                        {citizenship.favourite && (
                          <Star className="h-4 w-4 fill-current shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>

              {!citizenshipsLoading && !citizenshipsError && (
                <div className="text-xs text-muted-foreground text-center border-t p-2">
                  Search to get more results
                </div>
              )}
            </div>
          )}
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

export default CitizenshipSelect;
