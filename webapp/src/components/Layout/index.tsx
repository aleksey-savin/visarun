import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/Layout/AppSidebar';

import { Outlet } from 'react-router-dom';

import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { ForcedPasswordChange } from '@/components/ChangePassword/forced-password-change';
import { PageHeader } from '@/components/Layout/PageHeader';

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
      <div className="min-h-screen flex justify-center md:justify-start w-screen bg-background p-0 pb-4">
        <AppSidebar />
        {/* <div className="fixed top-4 right-4 z-10 flex items-center gap-2">
          <ModeToggle />
        </div> */}
        <div className="hidden md:block w-full rounded-none border-none overflow-auto scrollbar-hide p-0 m-0">
          <PageHeader />
          <Outlet />
        </div>
        <div className="flex flex-col md:hidden w-full">
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
