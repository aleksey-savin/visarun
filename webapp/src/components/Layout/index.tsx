import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ModeToggle } from '@/components/ModeToggle';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="fixed top-4 left-4 z-10 md:left-[calc(var(--sidebar-width)+0.5rem)] transition-[left] duration-200 ease-linear peer-data-[state=collapsed]:left-4">
        <SidebarTrigger />
      </div>
      <div className="fixed top-4 right-4 z-10">
        <ModeToggle />
      </div>
      <main className="flex flex-col w-full items-center justify-center">
        <div className="flex-1 w-full flex items-center">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <Outlet />
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}
