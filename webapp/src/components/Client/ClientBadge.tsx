import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { useState } from 'react';

import { Crown, User } from 'lucide-react';

const ClientBadge = ({
  client,
  showLinkedClients,
  fullWidth = false,
  isDraggable = false,
  passenger,
  onDragStart,
  onDragEnd,
}: {
  client: any;
  showLinkedClients?: boolean;
  fullWidth?: boolean;
  isDraggable?: boolean;
  passenger?: any;
  onDragStart?: (passenger: any) => void;
  onDragEnd?: () => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    if (!isDraggable || !passenger) return;

    // Prevent event bubbling to parent draggable elements (like grouped cards)
    e.stopPropagation();

    setIsDragging(true);
    // Store passenger data in drag event
    e.dataTransfer.setData('application/json', JSON.stringify(passenger));
    e.dataTransfer.effectAllowed = 'move';
    // Add data attributes for validation
    if (passenger.seatClassId) {
      e.dataTransfer.setData('text/seat-class-id', passenger.seatClassId);
    }
    e.dataTransfer.setData('text/passenger-id', passenger.id);
    onDragStart?.(passenger);
  };

  const handleDragEnd = () => {
    if (!isDraggable) return;

    setIsDragging(false);
    onDragEnd?.();
  };
  const wrapperProps = isDraggable
    ? {
        draggable: true,
        onDragStart: handleDragStart,
        onDragEnd: handleDragEnd,
        'data-passenger-id': passenger?.id || '',
        'data-seat-class-id': passenger?.seatClassId || '',
      }
    : {};

  const wrapperClassName = isDraggable
    ? cn(
        'cursor-move transition-all duration-200',
        isDragging ? 'opacity-50 scale-95' : 'hover:scale-100',
        'select-none',
        fullWidth ? 'w-full' : ''
      )
    : '';

  return (
    <div {...wrapperProps} className={wrapperClassName}>
      {client.isPrimary && (
        <div className="flex flex-wrap gap-1 w-full">
          <Badge
            variant="primary"
            className={cn(
              fullWidth ? 'w-full justify-start' : '',
              isDraggable && isDragging ? 'ring-2 ring-primary ring-opacity-50' : ''
            )}
          >
            <Crown />
            <span>
              {client.lastName || ''} {client.firstName || ''}
            </span>
          </Badge>
          {showLinkedClients && (
            <Badge variant="secondary">
              <span>+ {client.relatedClients?.length}</span>
              <User />
            </Badge>
          )}
        </div>
      )}
      {!client.isPrimary && (
        <div className="flex gap-1 w-full">
          <Badge variant="primary">
            <Crown />
          </Badge>{' '}
          <div className="w-full">
            <Badge
              variant="secondary"
              className={cn(
                fullWidth ? 'w-full justify-start' : '',
                'bg-emerald-900',
                isDraggable && isDragging ? 'ring-2 ring-primary ring-opacity-50' : ''
              )}
            >
              <User />
              {client.lastName || ''} {client.firstName || ''}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientBadge;
