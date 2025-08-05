import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

import { Outlet } from 'react-router-dom';

import { Card } from '@/components/ui/card';
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
      <div className="h-screen p-14 flex w-screen bg-background">
        <AppSidebar />
        {/** <div className="fixed top-4 right-4 z-10 flex items-center gap-2">
            {userEmail && <span className="text-sm text-muted-foreground mr-2">{userEmail}</span>}
            <Button variant="outline" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
            <ModeToggle />
            </div> **/}
        <Card className="h-full w-full rounded-l-none border-l-0 overflow-auto scrollbar-hide p-0 m-0 pb-6">
          <PageHeader />
          <Outlet />
        </Card>

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
