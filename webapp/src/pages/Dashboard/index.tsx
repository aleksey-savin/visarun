import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Clock, CheckCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();

  // Get user's available permissions
  const permissions = user?.permissions || [];
  const roles = user?.roles || [];

  // Check what the user can do
  const canAccessExchangeRates = hasPermission('exchangeRates.create');
  const canReadUsers = hasPermission('users.read');
  const canReadRoles = hasPermission('roles.read');
  const canReadTelegram = hasPermission('telegram.channels.read');

  const availableFeatures = [
    { name: 'Currency Exchange', available: canAccessExchangeRates, icon: '💱' },
    { name: 'User Management', available: canReadUsers, icon: '👥' },
    { name: 'Role Management', available: canReadRoles, icon: '🛡️' },
    { name: 'Telegram Channels', available: canReadTelegram, icon: '📱' },
  ];

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center gap-3">
        <User className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-bold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </CardTitle>
            <CardDescription>Your account details and current status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-muted-foreground">Email:</span>
                <span className="text-sm">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-muted-foreground">User ID:</span>
                <span className="text-sm font-mono">{user?.id}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Roles:</span>
              <div className="flex flex-wrap gap-1">
                {roles.length > 0 ? (
                  roles.map(role => (
                    <Badge key={role} variant="secondary">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No roles assigned</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Features Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Available Features
            </CardTitle>
            <CardDescription>Features you have access to based on your permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableFeatures.map(feature => (
              <div
                key={feature.name}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{feature.icon}</span>
                  <span className="text-sm font-medium">{feature.name}</span>
                </div>
                <Badge variant={feature.available ? 'default' : 'secondary'}>
                  {feature.available ? 'Available' : 'Restricted'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Permissions Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Your Permissions
            </CardTitle>
            <CardDescription>Detailed list of permissions assigned to your account</CardDescription>
          </CardHeader>
          <CardContent>
            {permissions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {permissions.map(permission => (
                  <Badge key={permission} variant="outline" className="justify-start">
                    {permission}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Permissions Assigned</h3>
                <p className="text-sm text-muted-foreground">
                  Contact your administrator to get permissions assigned to your account.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions / Status Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Getting Started
            </CardTitle>
            <CardDescription>What you can do with your current permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {canAccessExchangeRates && (
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-green-900 dark:text-green-100">
                    💱 Currency Exchange
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    You can create and manage exchange rates for currency conversion.
                  </p>
                </div>
              )}

              {(canReadUsers || canReadRoles) && (
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    👥 Administration
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    You have access to user and role management features.
                  </p>
                </div>
              )}

              {canReadTelegram && (
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800">
                  <h4 className="font-medium text-purple-900 dark:text-purple-100">📱 Telegram</h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    You can manage Telegram channels and messaging features.
                  </p>
                </div>
              )}

              {!canAccessExchangeRates && !canReadUsers && !canReadRoles && !canReadTelegram && (
                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                    ⚠️ Limited Access
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Your account has limited permissions. Contact your administrator to request
                    additional access.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
