import React, { useMemo } from 'react';
import { trpc } from '../../lib/trpcProvider';
import { Search } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FilterContainer, FilterFields, FilterField } from '@/components/Filters';

export interface VisaApplicationFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCountryFilter: string;
  onCountryFilterChange: (value: string) => void;
  selectedVisaTypeFilter: string;
  onVisaTypeFilterChange: (value: string) => void;
  selectedApplicationTypeFilter: string;
  onApplicationTypeFilterChange: (value: string) => void;
  selectedStatusGroupFilter: string;
  onStatusGroupFilterChange: (value: string) => void;
  visasToApplyTimeFilter: 'today' | 'later' | 'all';
  onVisasToApplyTimeFilterChange: (value: 'today' | 'later' | 'all') => void;
  selectedStatusFilter: string;
  onStatusFilterChange: (value: string) => void;
  groupByOrder: boolean;
  onGroupByOrderChange: (value: boolean) => void;
  onResetFilters: () => void;
}

export const VisaApplicationFilters: React.FC<VisaApplicationFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedCountryFilter,
  onCountryFilterChange,
  selectedVisaTypeFilter,
  onVisaTypeFilterChange,
  selectedApplicationTypeFilter,
  onApplicationTypeFilterChange,
  selectedStatusGroupFilter,
  onStatusGroupFilterChange,
  visasToApplyTimeFilter,
  onVisasToApplyTimeFilterChange,
  selectedStatusFilter,
  onStatusFilterChange,
  groupByOrder,
  onGroupByOrderChange,
  onResetFilters,
}) => {
  // Fetch all countries and visa types for filter options using dedicated endpoints
  const { data: countriesData } = trpc.country.getAll.useQuery();
  const { data: visaTypesData } = trpc.visaType.getAll.useQuery({});

  // Get all unique countries from dedicated endpoint
  const uniqueCountries = useMemo(() => {
    return countriesData?.countries || [];
  }, [countriesData]);

  // Get all unique visa types from dedicated endpoint
  const uniqueVisaTypes = useMemo(() => {
    return visaTypesData?.visaTypes || [];
  }, [visaTypesData]);

  // Define status options for filtering
  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending_submit', label: 'Submit' },
    { value: 'awaiting_approval', label: 'In Process' },
    { value: 'approved', label: 'Ready' },
    { value: 'denied', label: 'Denied' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'pending_refund', label: 'Refund' },
    { value: 'refunded', label: 'Refunded' },
  ];

  // Define application type options for filtering
  const applicationTypeOptions = [
    { value: 'all', label: 'All types' },
    { value: 'visa', label: 'Visa' },
    { value: 'acceleration', label: 'Acceleration' },
  ];

  return (
    <FilterContainer onClearFilters={onResetFilters}>
      <FilterFields>
        <FilterField label="Status">
          <Select value={selectedStatusGroupFilter} onValueChange={onStatusGroupFilterChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="visas-to-apply">Visas in work</SelectItem>
              <SelectItem value="drafts">Drafts</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>

        {selectedStatusGroupFilter === 'visas-to-apply' && (
          <FilterField label="Time">
            <div className="flex items-center gap-2">
              <Button
                variant={visasToApplyTimeFilter === 'today' ? 'default' : 'ghost'}
                onClick={() => onVisasToApplyTimeFilterChange('today')}
              >
                Today
              </Button>
              <Button
                variant={visasToApplyTimeFilter === 'later' ? 'default' : 'ghost'}
                onClick={() => onVisasToApplyTimeFilterChange('later')}
              >
                Later
              </Button>
              <Button
                variant={visasToApplyTimeFilter === 'all' ? 'default' : 'ghost'}
                onClick={() => onVisasToApplyTimeFilterChange('all')}
              >
                All
              </Button>
            </div>
          </FilterField>
        )}

        <FilterField label="Search">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </FilterField>

        <FilterField label="Country">
          <Select value={selectedCountryFilter} onValueChange={onCountryFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="All countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              {uniqueCountries.map(country => (
                <SelectItem key={country.id} value={country.id}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Visa Type">
          <Select value={selectedVisaTypeFilter} onValueChange={onVisaTypeFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="All visa types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All visa types</SelectItem>
              {uniqueVisaTypes.map(visaType => (
                <SelectItem key={visaType.id} value={visaType.id}>
                  <div className="flex justify-between items-center w-full">
                    <span>{visaType.name}</span>
                    <span className="text-muted-foreground ml-2">{visaType.country?.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Service">
          <Select
            value={selectedApplicationTypeFilter}
            onValueChange={onApplicationTypeFilterChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              {applicationTypeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Visa Status">
          <Select value={selectedStatusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <div className="flex gap-2 items-end pb-1.5 pt-4 md:pt-0">
          <div className="flex items-center gap-2">
            <Switch
              id="group-by-order"
              checked={groupByOrder}
              onCheckedChange={onGroupByOrderChange}
            />
            <Label htmlFor="group-by-order" className="text-sm font-medium">
              Group by order
            </Label>
          </div>
        </div>
      </FilterFields>
    </FilterContainer>
  );
};
