import React from 'react';

interface FilterFieldsProps {
  children: React.ReactNode;
}

export const FilterFields: React.FC<FilterFieldsProps> = ({ children }) => {
  return <div className="flex flex-wrap justify-start gap-4">{children}</div>;
};
