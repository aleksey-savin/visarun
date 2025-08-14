import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Globe, Target, Info } from 'lucide-react';
import { CitizenshipSelector } from './CitizenshipSelector';

interface CitizenshipScopeSelectorProps {
  appliesToAllCitizenships: boolean;
  onAppliesToAllChange: (appliesToAll: boolean) => void;
  selectedCitizenshipIds: string[];
  onCitizenshipIdsChange: (ids: string[]) => void;
  disabled?: boolean;
}

export const CitizenshipScopeSelector: React.FC<CitizenshipScopeSelectorProps> = ({
  appliesToAllCitizenships,
  onAppliesToAllChange,
  selectedCitizenshipIds,
  onCitizenshipIdsChange,
  disabled = false,
}) => {
  const scopeOptions = [
    {
      value: true,
      label: 'All Citizenships',
      description: 'Apply to users of all citizenships globally',
      icon: Globe,
      color: 'bg-purple-50 border-purple-200 text-purple-800',
    },
    {
      value: false,
      label: 'Specific Citizenships',
      description: 'Apply only to users with selected citizenships',
      icon: Target,
      color: 'bg-blue-50 border-blue-200 text-blue-800',
    },
  ];

  const handleScopeChange = (appliesToAll: boolean) => {
    onAppliesToAllChange(appliesToAll);

    // Clear specific citizenships when switching to "all"
    if (appliesToAll) {
      onCitizenshipIdsChange([]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Citizenship Scope</h3>
      </div>

      {/* Scope Selection */}
      <div className="grid grid-cols-1 gap-3">
        {scopeOptions.map(option => {
          const Icon = option.icon;
          const isSelected = appliesToAllCitizenships === option.value;

          return (
            <Card
              key={option.value.toString()}
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

      {/* Citizenship Selection for specific scope */}
      {!appliesToAllCitizenships && (
        <div className="space-y-3 pt-2">
          <CitizenshipSelector
            selectedIds={selectedCitizenshipIds}
            onSelectionChange={onCitizenshipIdsChange}
            disabled={disabled}
          />
        </div>
      )}

      {/* Summary for all citizenships scope */}
      {appliesToAllCitizenships && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <Globe className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-medium text-purple-800 text-sm">Global Citizenship Scope</p>
              <p className="text-purple-700 text-xs">
                Applies to users of all citizenships worldwide
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium">How does this work?</p>

            {appliesToAllCitizenships ? (
              <p>
                This requirement will apply to all users regardless of their citizenship. This is
                the most inclusive option and covers everyone in the system.
              </p>
            ) : (
              <p>
                This requirement will only apply to users with the specific citizenships you select.
                Users with other citizenships will not see this requirement.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
