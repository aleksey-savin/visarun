import { useState, useRef, useMemo, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { trpc } from '@/lib/trpc';
import { Search, Star } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSelectOpenChange = (open: boolean) => {
    setIsSelectOpen(open);
    if (open) {
      // Multiple strategies to ensure focus
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    } else {
      setSearchTerm('');
    }
  };

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
      citizenshipId: currentCitizenship,
    },
    {
      enabled: isSelectOpen || !!value,
    }
  );

  const citizenships = useMemo(() => citizenshipsData?.citizenships || [], [citizenshipsData]);

  // Maintain focus on search input when options update
  useEffect(() => {
    if (isSelectOpen && searchInputRef.current) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [citizenships, isSelectOpen]);

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <Select value={value} onValueChange={onValueChange} onOpenChange={handleSelectOpenChange}>
          <SelectTrigger className={className}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  key="citizenship-search"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value);
                    // Maintain focus after state update
                    requestAnimationFrame(() => {
                      searchInputRef.current?.focus();
                    });
                  }}
                  className="h-8 pl-8 max-w-52"
                  autoFocus
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => e.stopPropagation()}
                />
              </div>
            </div>

            {citizenshipsLoading ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading...</div>
            ) : citizenshipsError ? (
              <div className="px-2 py-1.5 text-sm text-destructive">Error loading citizenships</div>
            ) : citizenships.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                {searchTerm ? 'No results found' : 'No citizenships available'}
              </div>
            ) : (
              citizenships.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    {c.name} ({c.abbreviation}){' '}
                    {c.favourite && <Star className="h-4 w-4 fill-current" />}
                  </div>
                </SelectItem>
              ))
            )}
            <div className="text-sm text-muted-foreground text-center m-2">
              Search to get more results{' '}
            </div>
          </SelectContent>
        </Select>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

export default CitizenshipSelect;
