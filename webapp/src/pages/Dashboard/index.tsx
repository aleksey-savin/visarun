import { Skeleton } from '@/components/ui/skeleton';
import { ClientSearchModal } from '@/components/Client/client-search-modal.js';
import { CurrencyExchangeWidget } from '@/components/Dashboard';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Gauge, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function DashboardPage() {
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);
  const { hasPermission } = useAuth();

  const handleClientClick = () => {
    setIsClientSearchOpen(true);
  };

  const canCreateOrders = hasPermission('orders.create');

  return (
    <>
      <div className="sticky top-0 z-10 border-b flex py-1.5 px-6 justify-between gap-2">
        <div className="flex gap-2 items-center">
          <Gauge />
          <span className="font-semibold">Dashboard</span>
        </div>
        {canCreateOrders && (
          <Button size="sm" onClick={handleClientClick} className="relative">
            Create Order
            <Plus />
          </Button>
        )}
      </div>
      <div className="md:p-6 p-0 mx-2 mb-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
          <CurrencyExchangeWidget />
          <div className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          </div>
          <div className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          </div>
        </div>
      </div>

      <ClientSearchModal isOpen={isClientSearchOpen} onOpenChange={setIsClientSearchOpen} />
    </>
  );
}
