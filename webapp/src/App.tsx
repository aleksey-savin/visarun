import './App.css';
import { TrpcProvider } from './lib/trpcProvider';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AllUsersPage from './pages/AllUsersPage';
import ViewUserPage from './pages/ViewUserPage';
import CreateUserPage from './pages/CreateUserPage';
// import DashboardPage from './pages/DashboardPage';
import CurrencyExchangePage from './pages/CurrencyExchangePage';
import HomePage from './pages/HomePage';
import TelegramChannelsPage from './pages/TelegramChannelsPage';
import ViewTelegramChannelPage from './pages/ViewTelegramChannelPage';

import {
  getAllUsersRoute,
  getCurrencyExchangeRoute,
  getDashboardRoute,
  getViewUserRoute,
  getCreateUserRoute,
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
