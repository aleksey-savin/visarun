import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ModeToggle } from '@/components/ModeToggle';
import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { ForcedPasswordChange } from '@/components/ChangePassword/forced-password-change';

export default function Layout() {
  const { logout, userEmail, isPasswordChangeRequired, passwordChangeCompleted } = useAuth();
  const navigate = useNavigate();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  useEffect(() => {
    if (isPasswordChangeRequired) {
      setShowPasswordDialog(true);
    }
  }, [isPasswordChangeRequired]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handlePasswordChangeSuccess = () => {
    passwordChangeCompleted();
    setShowPasswordDialog(false);
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
      <main className="flex flex-col w-full items-start justify-center">
        <div className="flex-1 w-full flex items-start p-20">
          <Outlet />
        </div>
      </main>

      {isPasswordChangeRequired && (
        <ForcedPasswordChange
          isOpen={showPasswordDialog}
          onOpenChange={setShowPasswordDialog}
          onSuccess={handlePasswordChangeSuccess}
        />
      )}
    </SidebarProvider>
  );
}
