import React from 'react';

interface FilterFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export const FilterField: React.FC<FilterFieldProps> = ({ label, children, className = '' }) => {
  return (
    <div className={`flex flex-col gap-2 min-w-[200px] ${className}`}>
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
};
