import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ModeToggle } from '@/components/ModeToggle';
import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getSignInRoute } from '@/lib/routes';

export default function Layout() {
  const { logout, userEmail } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(getSignInRoute());
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="fixed top-4 left-4 z-10 md:left-[calc(var(--sidebar-width)+0.5rem)] transition-[left] duration-200 ease-linear peer-data-[state=collapsed]:left-4">
        <SidebarTrigger />
      </div>
      <div className="fixed top-4 right-4 z-10 flex items-center gap-2">
        {userEmail && <span className="text-sm text-muted-foreground mr-2">{userEmail}</span>}
        <Button variant="outline" size="icon" onClick={handleLogout} title="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
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
