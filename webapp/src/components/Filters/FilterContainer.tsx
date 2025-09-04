import React from 'react';
import { Button } from '@/components/ui/button';

interface FilterContainerProps {
  children: React.ReactNode;
  onClearFilters: () => void;
  showClearButton?: boolean;
  title?: string;
}

export const FilterContainer: React.FC<FilterContainerProps> = ({
  children,
  onClearFilters,
  showClearButton = true,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 sm:items-end">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
        {children}
      </div>
      {showClearButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="self-end text-xs text-muted-foreground hover:text-foreground mt-1 sm:mt-0"
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
};
