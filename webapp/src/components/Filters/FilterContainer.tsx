import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';

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
  title = 'Filters',
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
        {showClearButton && (
          <div className="flex justify-end mt-4">
            <Button variant="secondary" onClick={onClearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
