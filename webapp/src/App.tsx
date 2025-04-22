import './App.css';
import { TrpcProvider } from './lib/trpcProvider';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AllUsersPage from './pages/AllUsersPage';
import ViewUserPage from './pages/ViewUserPage';
import CreateUserPage from './pages/CreateUserPage';
// import DashboardPage from './pages/DashboardPage';
import CurrencyExchangePage from './pages/CurrencyExchangePage';
import SignInPage from './pages/SignInPage';

import {
  getAllUsersRoute,
  getCurrencyExchangeRoute,
  getDashboardRoute,
  getViewUserRoute,
  getCreateUserRoute,
  getSignInRoute,
  viewUserRouteParams,
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
              <Route path={getSignInRoute()} element={<SignInPage />} />

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
              </Route>

              {/* Fallback route */}
              <Route path="*" element={<Navigate to={getSignInRoute()} replace />} />
            </Routes>
          </BrowserRouter>
        </TrpcProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
