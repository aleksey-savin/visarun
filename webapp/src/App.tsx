import './App.css';
import { TrpcProvider } from './lib/trpcProvider';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AllUsersPage from './pages/AllUsersPage';
import ViewUserPage from './pages/ViewUserPage';
import CreateUserPage from './pages/CreateUserPage';
import DashboardPage from './pages/DashboardPage';
import CurrencyExchangePage from './pages/CurrencyExchangePage';

import {
  getAllUsersRoute,
  getCurrencyExchangeRoute,
  getDashboardRoute,
  getViewUserRoute,
  getCreateUserRoute,
  viewUserRouteParams,
} from './lib/routes';

import Layout from '@/components/Layout';
import { ThemeProvider } from '@/components/theme-provider';

const App = () => {
  return (
    <TrpcProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path={getDashboardRoute()} element={<DashboardPage />} />
              <Route path={getAllUsersRoute()} element={<AllUsersPage />} />
              <Route path={getCreateUserRoute()} element={<CreateUserPage />} />
              <Route path={getViewUserRoute(viewUserRouteParams)} element={<ViewUserPage />} />
              <Route path={getCurrencyExchangeRoute()} element={<CurrencyExchangePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </TrpcProvider>
  );
};

export default App;
