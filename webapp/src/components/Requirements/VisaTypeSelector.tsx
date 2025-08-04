import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { Search, Plus, X, Flag, Calendar, DollarSign, CheckCircle, Loader2 } from 'lucide-react';
import { useVisaTypes } from '../../hooks/useVisaTypes';
import { formatCurrency } from '../../utils/currency';

interface VisaTypeSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  disabled?: boolean;
  countryFilter?: string;
}

export const VisaTypeSelector: React.FC<VisaTypeSelectorProps> = ({
  selectedIds,
  onSelectionChange,
  disabled = false,
  countryFilter,
}) => {
  const [search, setSearch] = useState('');
  const [showSelector, setShowSelector] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  const { data, isLoading, error } = useVisaTypes({
    search: search || undefined,
    countryId: countryFilter || selectedCountry || undefined,
    limit: 100,
  });

  const visaTypes = data?.visaTypes || [];
  const selectedVisaTypes = visaTypes.filter(vt => selectedIds.includes(vt.id));

  // Get unique countries for filtering
  const countries = Array.from(
    new Map(visaTypes.map(vt => [vt.country.id, vt.country])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const handleToggleSelection = (visaTypeId: string) => {
    if (selectedIds.includes(visaTypeId)) {
      onSelectionChange(selectedIds.filter(id => id !== visaTypeId));
    } else {
      onSelectionChange([...selectedIds, visaTypeId]);
    }
  };

  const handleRemoveSelection = (visaTypeId: string) => {
    onSelectionChange(selectedIds.filter(id => id !== visaTypeId));
  };

  const formatProcessingTime = (visaType: any) => {
    const {
      processingMode,
      processingUnit,
      processingValueFixed,
      processingValueMin,
      processingValueMax,
    } = visaType;

    if (processingMode === 'fixed' && processingValueFixed) {
      return `${processingValueFixed} ${processingUnit}`;
    } else if (processingMode === 'approximate' && processingValueMin && processingValueMax) {
      return `~${processingValueMin}-${processingValueMax} ${processingUnit}`;
    }
    return 'Processing time TBD';
  };

  if (error) {
    const isPermissionError =
      error.message.includes('Not authenticated') || error.message.includes('permission');
    return (
      <div className="space-y-2">
        <Label>Visa Type Links</Label>
        {isPermissionError ? (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
            <div className="font-medium">Permission Required</div>
            <div>You need the "visaTypes.read" permission to link visa types to requirements.</div>
          </div>
        ) : (
          <div className="text-sm text-red-600">Error loading visa types: {error.message}</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Selected Visa Types ({selectedIds.length})</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowSelector(!showSelector)}
          disabled={disabled}
        >
          <Plus className="w-4 h-4 mr-2" />
          {showSelector ? 'Hide Selector' : 'Add Visa Types'}
        </Button>
      </div>

      {/* Selected visa types */}
      {selectedVisaTypes.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {selectedVisaTypes.map(visaType => (
              <Badge key={visaType.id} variant="secondary" className="pl-2 pr-1">
                <div className="flex items-center gap-2">
                  <Flag className="w-3 h-3" />
                  <span className="text-xs">
                    {visaType.country.name} - {visaType.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => handleRemoveSelection(visaType.id)}
                    disabled={disabled}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Visa type selector */}
      {showSelector && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Select Visa Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search visa types..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {!countryFilter && (
                <div className="space-y-2">
                  <select
                    value={selectedCountry}
                    onChange={e => setSelectedCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Countries</option>
                    {countries.map(country => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <Separator />

            {/* Visa types list */}
            <div className="h-64 overflow-y-auto border border-gray-200 rounded-md p-2">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2 text-sm">Loading visa types...</span>
                </div>
              ) : visaTypes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Flag className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No visa types found</p>
                  {search && (
                    <p className="text-xs text-gray-400 mt-1">
                      Try adjusting your search or filters
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {visaTypes.map(visaType => {
                    const isSelected = selectedIds.includes(visaType.id);
                    return (
                      <div
                        key={visaType.id}
                        className={`p-3 border rounded-lg transition-colors ${
                          isSelected
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleSelection(visaType.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Flag className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <span className="font-medium text-sm truncate">
                                {visaType.country.name} - {visaType.name}
                              </span>
                              {isSelected && (
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {visaType.isMultientry ? 'Multi-entry' : 'Single-entry'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatProcessingTime(visaType)}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <DollarSign className="w-3 h-3 mr-1" />
                                {formatCurrency(visaType.serviceCost)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selection summary */}
            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-gray-600">
                  {selectedIds.length} visa type{selectedIds.length !== 1 ? 's' : ''} selected
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSelector(false)}
                >
                  Done
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
