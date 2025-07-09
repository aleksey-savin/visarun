import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { Search, Plus, X, Globe, CheckCircle, Loader2, Star } from 'lucide-react';
import { useCitizenships } from '../../hooks/useCitizenships';

interface CitizenshipSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  disabled?: boolean;
}

export const CitizenshipSelector: React.FC<CitizenshipSelectorProps> = ({
  selectedIds,
  onSelectionChange,
  disabled = false,
}) => {
  const [search, setSearch] = useState('');
  const [showSelector, setShowSelector] = useState(false);
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false);

  const { data, isLoading, error } = useCitizenships({
    search: search || undefined,
    favourite: showFavouritesOnly || undefined,
    limit: 100,
  });

  const citizenships = data?.citizenships || [];
  const selectedCitizenships = citizenships.filter(c => selectedIds.includes(c.id));

  const handleToggleSelection = (citizenshipId: string) => {
    if (selectedIds.includes(citizenshipId)) {
      onSelectionChange(selectedIds.filter(id => id !== citizenshipId));
    } else {
      onSelectionChange([...selectedIds, citizenshipId]);
    }
  };

  const handleRemoveSelection = (citizenshipId: string) => {
    onSelectionChange(selectedIds.filter(id => id !== citizenshipId));
  };

  if (error) {
    const isPermissionError =
      error.message.includes('Not authenticated') || error.message.includes('permission');
    return (
      <div className="space-y-2">
        <Label>Citizenship Selection</Label>
        {isPermissionError ? (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
            <div className="font-medium">Permission Required</div>
            <div>You need the "citizenships.read" permission to select citizenships.</div>
          </div>
        ) : (
          <div className="text-sm text-red-600">Error loading citizenships: {error.message}</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Selected Citizenships ({selectedIds.length})</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowSelector(!showSelector)}
          disabled={disabled}
        >
          <Plus className="w-4 h-4 mr-2" />
          {showSelector ? 'Hide Selector' : 'Add Citizenships'}
        </Button>
      </div>

      {/* Selected citizenships */}
      {selectedCitizenships.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {selectedCitizenships.map(citizenship => (
              <Badge key={citizenship.id} variant="secondary" className="pl-2 pr-1">
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3" />
                  {citizenship.favourite && (
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  )}
                  <span className="text-xs">{citizenship.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => handleRemoveSelection(citizenship.id)}
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

      {/* Citizenship selector */}
      {showSelector && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Select Citizenships</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search citizenships..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="favourites-only"
                  checked={showFavouritesOnly}
                  onCheckedChange={checked => setShowFavouritesOnly(checked === true)}
                />
                <Label htmlFor="favourites-only" className="text-sm">
                  Show favourites only
                </Label>
              </div>
            </div>

            <Separator />

            {/* Citizenships list */}
            <div className="h-64 overflow-y-auto border border-gray-200 rounded-md p-2">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2 text-sm">Loading citizenships...</span>
                </div>
              ) : citizenships.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Globe className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No citizenships found</p>
                  {search && (
                    <p className="text-xs text-gray-400 mt-1">
                      Try adjusting your search or filters
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {citizenships.map(citizenship => {
                    const isSelected = selectedIds.includes(citizenship.id);
                    return (
                      <div
                        key={citizenship.id}
                        className={`p-3 border rounded-lg transition-colors ${
                          isSelected
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleSelection(citizenship.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Globe className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              {citizenship.favourite && (
                                <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                              )}
                              <span className="font-medium text-sm truncate">
                                {citizenship.name}
                              </span>
                              {isSelected && (
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                              <span>Visa-free: {citizenship._count.visaFree}</span>
                              <span>Blacklisted: {citizenship._count.blacklisted}</span>
                              <span>Surcharges: {citizenship._count.surcharges}</span>
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
                  {selectedIds.length} citizenship{selectedIds.length !== 1 ? 's' : ''} selected
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
