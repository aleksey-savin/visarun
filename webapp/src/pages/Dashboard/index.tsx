import { Button } from '@/components/ui/button';
import { CardContent, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientSearchModal } from '@/components/Client/client-search-modal.js';
import { useState } from 'react';

import { Gauge, UserPlus } from 'lucide-react';

export default function DashboardPage() {
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);

  const handleClientClick = () => {
    setIsClientSearchOpen(true);
  };

  return (
    <>
      <CardTitle className="border-b flex py-1.5 px-6 justify-between gap-2">
        <div className="flex gap-2 items-center">
          <Gauge />
          <span className="font-semibold">Dashboard</span>
        </div>
        <Button size="sm" onClick={handleClientClick} className="relative">
          Client <UserPlus />
        </Button>
      </CardTitle>
      <CardContent className="p-6">
        <div className="flex gap-5">
          <div className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-[360px] rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[360px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
          <div className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-[360px] rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[360px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
          <div className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-[360px] rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[360px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
          <div className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-[360px] rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[360px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </div>
      </CardContent>

      <ClientSearchModal isOpen={isClientSearchOpen} onOpenChange={setIsClientSearchOpen} />
    </>
  );
}
