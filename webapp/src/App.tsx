import './App.css';
import { TrpcProvider } from './lib/trpcProvider';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AllUsersPage from './pages/Users/getAll';
import ViewUserPage from './pages/Users/view';
import CreateUserPage from './pages/Users/create';
import EditUserPage from './pages/Users/edit';

import AllRolesPage from './pages/Roles/getAll';
import ViewRolePage from './pages/Roles/view';
import CreateRolePage from './pages/Roles/create';
import EditRolePage from './pages/Roles/edit';
import DashboardPage from './pages/Dashboard';
import CurrencyExchangePage from './pages/CurrencyExchange';
import HomePage from './pages/HomePage';
import TelegramChannelsPage from './pages/Telegram/getAll';
import ViewTelegramChannelPage from './pages/Telegram/view';

import {
  getAllUsersRoute,
  getCurrencyExchangeRoute,
  getDashboardRoute,
  getViewUserRoute,
  getCreateUserRoute,
  getEditUserRoute,
  editUserRouteParams,
  getAllRolesRoute,
  getViewRoleRoute,
  getCreateRoleRoute,
  getEditRoleRoute,
  editRoleRouteParams,
  getSignInRoute,
  viewRoleRouteParams,
  viewUserRouteParams,
  getTelegramChannelsRoute,
  getViewTelegramChannelRoute,
  viewTelegramChannelRouteParams,
  getAccessDeniedRoute,
} from './lib/routes';

import Layout from '@/components/Layout';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/lib/auth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PermissionRoute } from '@/components/PermissionRoute';
import AccessDeniedPage from '@/pages/AccessDenied';

const App = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <AuthProvider>
        <TrpcProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path={getSignInRoute()} element={<HomePage />} />
              <Route path={getAccessDeniedRoute()} element={<AccessDeniedPage />} />

              {/* Protected routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path={getDashboardRoute()} element={<DashboardPage />} />

                {/* Currency Exchange Routes */}
                <Route
                  path={getCurrencyExchangeRoute()}
                  element={
                    <PermissionRoute requiredPermission="exchangeRates.create">
                      <CurrencyExchangePage />
                    </PermissionRoute>
                  }
                />

                {/* User Management Routes */}
                <Route
                  path={getAllUsersRoute()}
                  element={
                    <PermissionRoute requiredPermission="users.read">
                      <AllUsersPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getCreateUserRoute()}
                  element={
                    <PermissionRoute requiredPermission="users.create">
                      <CreateUserPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getEditUserRoute(editUserRouteParams)}
                  element={
                    <PermissionRoute requiredPermission="users.update">
                      <EditUserPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getViewUserRoute(viewUserRouteParams)}
                  element={
                    <PermissionRoute requiredPermission="users.read">
                      <ViewUserPage />
                    </PermissionRoute>
                  }
                />

                {/* Role Management Routes */}
                <Route
                  path={getAllRolesRoute()}
                  element={
                    <PermissionRoute requiredPermission="roles.read">
                      <AllRolesPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getCreateRoleRoute()}
                  element={
                    <PermissionRoute requiredPermission="roles.create">
                      <CreateRolePage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getViewRoleRoute(viewRoleRouteParams)}
                  element={
                    <PermissionRoute requiredPermission="roles.read">
                      <ViewRolePage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getEditRoleRoute(editRoleRouteParams)}
                  element={
                    <PermissionRoute requiredPermission="roles.update">
                      <EditRolePage />
                    </PermissionRoute>
                  }
                />

                {/* Telegram Management Routes */}
                <Route
                  path={getTelegramChannelsRoute()}
                  element={
                    <PermissionRoute requiredPermission="telegram.channels.read">
                      <TelegramChannelsPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getViewTelegramChannelRoute(viewTelegramChannelRouteParams)}
                  element={
                    <PermissionRoute requiredPermission="telegram.channels.read">
                      <ViewTelegramChannelPage />
                    </PermissionRoute>
                  }
                />
              </Route>

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TrpcProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
