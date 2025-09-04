import { cn } from '@/lib/utils';
import React from 'react';

interface FilterFieldProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
}

export const FilterField: React.FC<FilterFieldProps> = ({ label, children, className = '' }) => {
  return (
    <div
      className={cn(
        label ? 'flex flex-col' : 'flex items-end pb-1',
        'gap-1 sm:gap-2 min-w-0 w-full sm:w-auto sm:min-w-[120px]',
        className
      )}
    >
      {label && (
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">{label}</label>
      )}
      <div className="w-full">{children}</div>
    </div>
  );
};
