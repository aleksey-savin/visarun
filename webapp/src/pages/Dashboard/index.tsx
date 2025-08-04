import { CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientSearchModal } from '@/components/Client/client-search-modal.js';
import { useState } from 'react';
import { CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gauge, UserPlus } from 'lucide-react';

export default function DashboardPage() {
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);

  const handleClientClick = () => {
    setIsClientSearchOpen(true);
  };

  return (
    <>
      <CardTitle className="sticky top-0 z-10 border-b flex py-1.5 px-6 justify-between gap-2">
        <div className="flex gap-2 items-center">
          <Gauge />
          <span className="font-semibold">Dashboard</span>
        </div>
        <Button size="sm" onClick={handleClientClick} className="relative">
          Client
          <UserPlus className="ml-1 h-4 w-4" />
        </Button>
      </CardTitle>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
      </CardContent>

      <ClientSearchModal isOpen={isClientSearchOpen} onOpenChange={setIsClientSearchOpen} />
    </>
  );
}
