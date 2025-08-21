import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

import { Outlet } from 'react-router-dom';

import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { ForcedPasswordChange } from '@/components/ChangePassword/forced-password-change';
import { PageHeader } from '@/components/PageHeader';

export default function Layout() {
  const { isPasswordChangeRequired, passwordChangeCompleted } = useAuth();

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  useEffect(() => {
    if (isPasswordChangeRequired) {
      setShowPasswordDialog(true);
    }
  }, [isPasswordChangeRequired]);

  const handlePasswordChangeSuccess = () => {
    passwordChangeCompleted();
    setShowPasswordDialog(false);
  };

  return (
    <SidebarProvider>
      <div className="md:h-screen flex justify-center md:justify-start w-screen bg-background p-0">
        <AppSidebar />
        {/** <div className="fixed top-4 right-4 z-10 flex items-center gap-2">
            {userEmail && <span className="text-sm text-muted-foreground mr-2">{userEmail}</span>}
            <Button variant="outline" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
            <ModeToggle />
            </div> **/}
        <div className="hidden md:block h-full w-full rounded-none border-none overflow-auto scrollbar-hide p-0 m-0">
          <PageHeader />
          <Outlet />
        </div>
        <div className="grid grid-cols-1 gap-4 md:hidden w-full">
          <PageHeader />
          <Outlet />
        </div>

        {isPasswordChangeRequired && (
          <ForcedPasswordChange
            isOpen={showPasswordDialog}
            onOpenChange={setShowPasswordDialog}
            onSuccess={handlePasswordChangeSuccess}
          />
        )}
      </div>
    </SidebarProvider>
  );
}
