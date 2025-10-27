import { cn } from '@/lib/utils';
import { Badge } from './badge';
import React from 'react';

const Summ = ({ children, className }: { className?: string; children?: React.ReactNode }) => {
  return (
    <Badge variant="default" className={cn('px-1 py-0 border-y-0 text-gray-200', className)}>
      {children}
    </Badge>
  );
};

export default Summ;
