import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { getSignInRoute } from '@/lib/routes';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const location = useLocation();

  // Show loading indicator while authentication state is being determined
  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // If not authenticated after loading completes, redirect to sign-in
  if (!isAuthenticated) {
    // Redirect to sign-in page, but save the current location to redirect back after login
    return <Navigate to={getSignInRoute()} state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}
