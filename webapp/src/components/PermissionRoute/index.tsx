import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { getAccessDeniedRoute } from '@/lib/routes';

interface PermissionRouteProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  fallbackPath?: string;
}

export function PermissionRoute({
  children,
  requiredPermission,
  requiredPermissions,
  fallbackPath = getAccessDeniedRoute(),
}: PermissionRouteProps) {
  const { hasPermission, hasAnyPermission, isAuthLoading } = useAuth();

  // Show loading indicator while authentication state is being determined
  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Check if user has required permission(s)
  let hasRequiredPermission = true;

  if (requiredPermission) {
    hasRequiredPermission = hasPermission(requiredPermission);
  } else if (requiredPermissions && requiredPermissions.length > 0) {
    hasRequiredPermission = hasAnyPermission(requiredPermissions);
  }

  // If user doesn't have required permissions, redirect to fallback page
  if (!hasRequiredPermission) {
    return <Navigate to={fallbackPath} replace />;
  }

  // User has required permissions, render the content
  return <>{children}</>;
}
