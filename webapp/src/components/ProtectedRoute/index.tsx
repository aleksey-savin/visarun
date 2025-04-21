import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { getSignInRoute } from '@/lib/routes';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to sign-in page, but save the current location to redirect back after login
    return <Navigate to={getSignInRoute()} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
