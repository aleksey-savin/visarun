import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { Search, Plus, X, Flag, Globe, CheckCircle, Loader2 } from 'lucide-react';
import { useCountries } from '../../hooks/useCountries';
import { useVisaTypes } from '../../hooks/useVisaTypes';

interface CountryVisaTypeSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  disabled?: boolean;
}

export const CountryVisaTypeSelector: React.FC<CountryVisaTypeSelectorProps> = ({
  selectedIds,
  onSelectionChange,
  disabled = false,
}) => {
  const [search, setSearch] = useState('');
  const [showSelector, setShowSelector] = useState(false);

  const {
    data: countriesData,
    isLoading: isCountriesLoading,
    error: countriesError,
  } = useCountries();
  const { data: allVisaTypesData, isLoading: isVisaTypesLoading } = useVisaTypes({});

  const countries = countriesData?.countries || [];
  const allVisaTypes = allVisaTypesData?.visaTypes || [];

  // Filter countries based on search
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(search.toLowerCase())
  );

  // Get selected visa types for display
  const selectedVisaTypes = allVisaTypes.filter(vt => selectedIds.includes(vt.id));

  const handleAddAllVisaTypesForCountry = (countryId: string) => {
    const countryVisaTypes = visaTypesByCountry[countryId] || [];
    const countryVisaTypeIds = countryVisaTypes.map(vt => vt.id);
    const newSelectedIds = [...new Set([...selectedIds, ...countryVisaTypeIds])];
    onSelectionChange(newSelectedIds);
  };

  const handleRemoveAllVisaTypesForCountry = (countryId: string) => {
    const countryVisaTypes = visaTypesByCountry[countryId] || [];
    const countryVisaTypeIds = countryVisaTypes.map(vt => vt.id);
    const newSelectedIds = selectedIds.filter(id => !countryVisaTypeIds.includes(id));
    onSelectionChange(newSelectedIds);
  };

  const handleRemoveSelection = (visaTypeId: string) => {
    onSelectionChange(selectedIds.filter(id => id !== visaTypeId));
  };

  const isCountryFullySelected = (countryId: string) => {
    const countryVisaTypes = visaTypesByCountry[countryId] || [];
    if (countryVisaTypes.length === 0) return false;

    const countryVisaTypeIds = countryVisaTypes.map(vt => vt.id);
    return countryVisaTypeIds.every(id => selectedIds.includes(id));
  };

  const isCountryPartiallySelected = (countryId: string) => {
    const countryVisaTypes = visaTypesByCountry[countryId] || [];
    if (countryVisaTypes.length === 0) return false;

    const countryVisaTypeIds = countryVisaTypes.map(vt => vt.id);
    return (
      countryVisaTypeIds.some(id => selectedIds.includes(id)) &&
      !countryVisaTypeIds.every(id => selectedIds.includes(id))
    );
  };

  // Group visa types by country for easier access
  const visaTypesByCountry = allVisaTypes.reduce(
    (acc, visaType) => {
      const countryId = visaType.country.id;
      if (!acc[countryId]) {
        acc[countryId] = [];
      }
      acc[countryId].push(visaType);
      return acc;
    },
    {} as Record<string, typeof allVisaTypes>
  );

  if (countriesError) {
    const isPermissionError =
      countriesError.message.includes('Not authenticated') ||
      countriesError.message.includes('permission');

    return (
      <div className="space-y-2">
        <Label>Country-based Visa Type Selection</Label>
        {isPermissionError ? (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
            <div className="font-medium">Permission Required</div>
            <div>You need the appropriate permissions to access countries and visa types.</div>
          </div>
        ) : (
          <div className="text-sm text-red-600">
            Error loading countries: {countriesError.message}
          </div>
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
          variant="secondary"
          size="sm"
          onClick={() => setShowSelector(!showSelector)}
          disabled={disabled}
        >
          <Plus className="w-4 h-4 mr-2" />
          {showSelector ? 'Hide Selector' : 'Add by Country'}
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

      {/* Country selector */}
      {showSelector && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Select Countries</CardTitle>
            <p className="text-sm text-muted-foreground">
              Select countries to add all their visa types to this requirement
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search countries..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Separator />

            {/* Countries list */}
            <div className="h-64 overflow-y-auto border border-gray-200 rounded-md p-2">
              {isCountriesLoading || isVisaTypesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2 text-sm">Loading countries...</span>
                </div>
              ) : filteredCountries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Globe className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No countries found</p>
                  {search && (
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCountries.map(country => {
                    const isFullySelected = isCountryFullySelected(country.id);
                    const isPartiallySelected = isCountryPartiallySelected(country.id);
                    const countryVisaTypes = visaTypesByCountry[country.id] || [];
                    const visaTypeCount = countryVisaTypes.length;
                    const selectedCount = countryVisaTypes.filter(vt =>
                      selectedIds.includes(vt.id)
                    ).length;

                    return (
                      <div
                        key={country.id}
                        className={`
                          p-3 border rounded-lg transition-all cursor-pointer hover:bg-accent/50
                          ${
                            isFullySelected
                              ? 'border-primary bg-primary/5'
                              : isPartiallySelected
                                ? 'border-orange-300 bg-orange-50'
                                : 'border-border'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <Checkbox
                              checked={isFullySelected}
                              onCheckedChange={checked => {
                                if (checked) {
                                  handleAddAllVisaTypesForCountry(country.id);
                                } else {
                                  handleRemoveAllVisaTypesForCountry(country.id);
                                }
                              }}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Flag className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <span className="font-medium text-sm">{country.name}</span>
                                {isFullySelected && (
                                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {selectedCount > 0
                                  ? `${selectedCount}/${visaTypeCount} visa types selected`
                                  : `${visaTypeCount} visa types available`}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-1">
                            {!isFullySelected && visaTypeCount > 0 && (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleAddAllVisaTypesForCountry(country.id);
                                }}
                                className="h-6 text-xs px-2"
                              >
                                Add All
                              </Button>
                            )}
                            {(isFullySelected || isPartiallySelected) && (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleRemoveAllVisaTypesForCountry(country.id);
                                }}
                                className="h-6 text-xs px-2"
                              >
                                Remove All
                              </Button>
                            )}
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
                  variant="secondary"
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
