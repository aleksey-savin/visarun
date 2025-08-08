import { useState } from 'react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

import { OrderItem } from '@/types/OrderItem';

import { Trash2, AlertCircle } from 'lucide-react';

import useOrderStore from '@/stores/order/order-store';

import { trpc } from '@/lib/trpc';

const VisaCard = ({ item }: { item: OrderItem }) => {
  const { orderItems, setOrderItems, setSaveStatus } = useOrderStore();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const deleteOrderItemMutation = trpc.orderItem.delete.useMutation();

  const handleDeleteOrderItem = async () => {
    setSaveStatus('saving');
    setOrderItems(orderItems?.filter(i => i.id !== item.id));
    await deleteOrderItemMutation.mutateAsync({ id: item.id || '' });
    setSaveStatus('saved');
  };

  return (
    <Card className="p-3 bg-secondary">
      <div className="flex justify-between">
        <div className="flex items-start">
          <Badge variant="accent">Visa - {item.visaApplication?.country?.name}</Badge>
        </div>

        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <Dialog
        open={showDeleteModal}
        onOpenChange={open => {
          if (!open) {
            setShowDeleteModal(false);
          }
        }}
      >
        <DialogContent className="max-w-md bg-secondary">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              Delete Visa Application
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Are you sure you want to delete this visa application? This action cannot be undone
              and will also remove the associated order item from your order.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrderItem}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default VisaCard;
