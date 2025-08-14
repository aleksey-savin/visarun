import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Globe, Flag, Target, Info } from 'lucide-react';
import { useCountries } from '@/hooks/useCountries';
import { VisaTypeSelector } from './VisaTypeSelector';

export type ApplicationScope = 'specific' | 'country_all' | 'global';

interface ApplicationScopeSelectorProps {
  scope: ApplicationScope;
  onScopeChange: (scope: ApplicationScope) => void;
  countryId?: string;
  onCountryChange: (countryId?: string) => void;
  visaTypeIds?: string[];
  onVisaTypeIdsChange?: (ids: string[]) => void;
  disabled?: boolean;
}

export const ApplicationScopeSelector: React.FC<ApplicationScopeSelectorProps> = ({
  scope,
  onScopeChange,
  countryId,
  onCountryChange,
  visaTypeIds = [],
  onVisaTypeIdsChange,
  disabled = false,
}) => {
  const { data: countriesData, isLoading: isCountriesLoading } = useCountries();
  const countries = countriesData?.countries || [];

  const selectedCountry = countries.find(c => c.id === countryId);

  const scopeOptions = [
    {
      value: 'specific' as const,
      label: 'Specific Visa Types',
      description: 'Apply to manually selected visa types only',
      icon: Target,
      color: 'bg-blue-50 border-blue-200 text-blue-800',
    },
    {
      value: 'country_all' as const,
      label: 'All Visa Types in Country',
      description: 'Auto-apply to all visa types in selected country',
      icon: Flag,
      color: 'bg-green-50 border-green-200 text-green-800',
    },
    {
      value: 'global' as const,
      label: 'All Visa Types Globally',
      description: 'Apply to all visa types across all countries',
      icon: Globe,
      color: 'bg-purple-50 border-purple-200 text-purple-800',
    },
  ];

  const handleScopeChange = (newScope: ApplicationScope) => {
    onScopeChange(newScope);

    // Clear country when switching away from country_all
    if (newScope !== 'country_all') {
      onCountryChange(undefined);
    }

    // Clear visa types when switching away from specific
    if (newScope !== 'specific' && onVisaTypeIdsChange) {
      onVisaTypeIdsChange([]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Application Scope</h3>
      </div>

      {/* Scope Selection */}
      <div className="grid grid-cols-1 gap-3">
        {scopeOptions.map(option => {
          const Icon = option.icon;
          const isSelected = scope === option.value;

          return (
            <Card
              key={option.value}
              className={`
                cursor-pointer transition-all duration-200 hover:shadow-md
                ${
                  isSelected
                    ? 'ring-2 ring-primary border-primary shadow-sm'
                    : 'border-border hover:border-primary/50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={() => !disabled && handleScopeChange(option.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`
                    p-2 rounded-lg border-2 transition-colors
                    ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                    }
                  `}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Label className="font-semibold text-sm cursor-pointer">{option.label}</Label>
                      {isSelected && (
                        <Badge variant="default" className="text-xs px-2 py-0.5">
                          Selected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Country Selection for country_all scope */}
      {scope === 'country_all' && (
        <div className="space-y-3 pt-2">
          <Label className="text-sm font-medium">Select Country</Label>
          <Select
            value={countryId || ''}
            onValueChange={value => onCountryChange(value || undefined)}
            disabled={disabled || isCountriesLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={isCountriesLoading ? 'Loading countries...' : 'Choose a country'}
              />
            </SelectTrigger>
            <SelectContent>
              {countries.map(country => (
                <SelectItem key={country.id} value={country.id}>
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4" />
                    {country.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedCountry && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Flag className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Will apply to all visa types in {selectedCountry.name}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Visa Type Selection for specific scope */}
      {scope === 'specific' && onVisaTypeIdsChange && (
        <div className="space-y-3 pt-2">
          <Label className="text-sm font-medium">Select Specific Visa Types</Label>
          <VisaTypeSelector
            selectedIds={visaTypeIds}
            onSelectionChange={onVisaTypeIdsChange}
            disabled={disabled}
          />
        </div>
      )}

      {/* Info Section */}
      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium">How does this work?</p>

            {scope === 'specific' && (
              <p>
                You'll manually select which visa types this requirement applies to. New visa types
                won't automatically inherit this requirement.
              </p>
            )}

            {scope === 'country_all' && (
              <p>
                This requirement will automatically apply to all current and future visa types for
                the selected country. When new visa types are added for this country, they'll
                inherit this requirement automatically.
              </p>
            )}

            {scope === 'global' && (
              <p>
                This requirement will apply to all visa types across all countries. Any new visa
                types added to the system will automatically inherit this requirement.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
