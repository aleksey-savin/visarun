import './App.css';
import { TrpcProvider } from './lib/trpcProvider';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AllUsersPage from './pages/Users/getAll';
import ViewUserPage from './pages/Users/view';
import CreateUserPage from './pages/Users/create';

import AllRolesPage from './pages/Roles/getAll';
// import DashboardPage from './pages/DashboardPage';
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
  getAllRolesRoute,
  getSignInRoute,
  viewUserRouteParams,
  getTelegramChannelsRoute,
  getViewTelegramChannelRoute,
  viewTelegramChannelRouteParams,
} from './lib/routes';

import Layout from '@/components/Layout';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/lib/auth';
import { ProtectedRoute } from '@/components/ProtectedRoute';

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

              {/* Protected routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path={getDashboardRoute()} element={<CurrencyExchangePage />} />
                <Route path={getAllUsersRoute()} element={<AllUsersPage />} />
                <Route path={getCreateUserRoute()} element={<CreateUserPage />} />
                <Route path={getViewUserRoute(viewUserRouteParams)} element={<ViewUserPage />} />

                <Route path={getAllRolesRoute()} element={<AllRolesPage />} />

                <Route path={getCurrencyExchangeRoute()} element={<CurrencyExchangePage />} />
                <Route path={getTelegramChannelsRoute()} element={<TelegramChannelsPage />} />
                <Route
                  path={getViewTelegramChannelRoute(viewTelegramChannelRouteParams)}
                  element={<ViewTelegramChannelPage />}
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
