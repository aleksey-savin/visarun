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
import ContactMethodsPage from './pages/ContactMethods/getAll';

import AllMessageTemplatesPage from './pages/MessageTemplates/getAll';
import CreateMessageTemplatePage from './pages/MessageTemplates/create';
import ViewMessageTemplatePage from './pages/MessageTemplates/view.tsx';
import EditMessageTemplatePage from './pages/MessageTemplates/edit.tsx';

// Countries pages
import AllCountriesPage from './pages/Countries/getAll';
import ViewCountryPage from './pages/Countries/view';
import CreateCountryPage from './pages/Countries/create';
import EditCountryPage from './pages/Countries/edit';

// Citizenships pages
import AllCitizenshipsPage from './pages/Citizenships/getAll';
import ViewCitizenshipPage from './pages/Citizenships/view';
import CreateCitizenshipPage from './pages/Citizenships/create';
import EditCitizenshipPage from './pages/Citizenships/edit';

// Visa Citizenship Surcharges pages
import AllVisaCitizenshipSurchargesPage from './pages/VisaCitizenshipSurcharges/getAll';
import ViewVisaCitizenshipSurchargePage from './pages/VisaCitizenshipSurcharges/view';
import CreateVisaCitizenshipSurchargePage from './pages/VisaCitizenshipSurcharges/create';
import EditVisaCitizenshipSurchargePage from './pages/VisaCitizenshipSurcharges/edit';

// Client pages
import ViewClientPage from './pages/Clients/view';
import EditClientPage from './pages/Clients/edit';

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
  getAllContactMethodsRoute,
  // Countries routes
  getAllCountriesRoute,
  getViewCountryRoute,
  getCreateCountryRoute,
  getEditCountryRoute,
  editCountryRouteParams,
  viewCountryRouteParams,
  // Citizenships routes
  getAllCitizenshipsRoute,
  getViewCitizenshipRoute,
  getCreateCitizenshipRoute,
  getEditCitizenshipRoute,
  editCitizenshipRouteParams,
  viewCitizenshipRouteParams,
  // Visa Citizenship Surcharges routes
  getAllVisaCitizenshipSurchargesRoute,
  getViewVisaCitizenshipSurchargeRoute,
  getCreateVisaCitizenshipSurchargeRoute,
  getEditVisaCitizenshipSurchargeRoute,
  editVisaCitizenshipSurchargeRouteParams,
  viewVisaCitizenshipSurchargeRouteParams,
  // Client routes
  getViewClientRoute,
  getEditClientRoute,
  viewClientRouteParams,
  editClientRouteParams,
  getMessageTemplatesRoute,
  getCreateMessageTemplateRoute,
  getViewMessageTemplateRoute,
  getEditMessageTemplateRoute,
  viewMessageTemplateRouteParams,
  editMessageTemplateRouteParams,
} from './lib/routes';

import Layout from '@/components/Layout';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/lib/auth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PermissionRoute } from '@/components/PermissionRoute';
import { Toaster } from '@/components/ui/sonner';
import AccessDeniedPage from '@/pages/AccessDenied';
import { TooltipProvider } from '@/components/ui/tooltip';

const App = () => {
  return (
    <TooltipProvider>
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

                  {/* Message Templates Management Routes */}
                  <Route
                    path={getMessageTemplatesRoute()}
                    element={
                      <PermissionRoute requiredPermission="messages.manage">
                        <AllMessageTemplatesPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path={getCreateMessageTemplateRoute()}
                    element={
                      <PermissionRoute requiredPermission="messages.manage">
                        <CreateMessageTemplatePage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path={getViewMessageTemplateRoute(viewMessageTemplateRouteParams)}
                    element={
                      <PermissionRoute requiredPermission="messages.manage">
                        <ViewMessageTemplatePage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path={getEditMessageTemplateRoute(editMessageTemplateRouteParams)}
                    element={
                      <PermissionRoute requiredPermission="messages.manage">
                        <EditMessageTemplatePage />
                      </PermissionRoute>
                    }
                  />

                  {/* Contact Methods Management Routes */}
                  <Route
                    path={getAllContactMethodsRoute()}
                    element={
                      <PermissionRoute requiredPermission="global.fullAccess">
                        <ContactMethodsPage />
                      </PermissionRoute>
                    }
                  />

                  {/* Countries Management Routes */}
                  <Route
                    path={getAllCountriesRoute()}
                    element={
                      <PermissionRoute requiredPermission="countries.read">
                        <AllCountriesPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path={getCreateCountryRoute()}
                    element={
                      <PermissionRoute requiredPermission="countries.create">
                        <CreateCountryPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path={getViewCountryRoute(viewCountryRouteParams)}
                    element={
                      <PermissionRoute requiredPermission="countries.read">
                        <ViewCountryPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path={getEditCountryRoute(editCountryRouteParams)}
                    element={
                      <PermissionRoute requiredPermission="countries.update">
                        <EditCountryPage />
                      </PermissionRoute>
                    }
                  />

                  {/* Citizenships Management Routes */}
                  <Route
                    path={getAllCitizenshipsRoute()}
                    element={
                      <PermissionRoute requiredPermission="citizenships.read">
                        <AllCitizenshipsPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path={getCreateCitizenshipRoute()}
                    element={
                      <PermissionRoute requiredPermission="citizenships.create">
                        <CreateCitizenshipPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path={getViewCitizenshipRoute(viewCitizenshipRouteParams)}
                    element={
                      <PermissionRoute requiredPermission="citizenships.read">
                        <ViewCitizenshipPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path={getEditCitizenshipRoute(editCitizenshipRouteParams)}
                    element={
                      <PermissionRoute requiredPermission="citizenships.update">
                        <EditCitizenshipPage />
                      </PermissionRoute>
                    }
                  />

                  {/* Visa Citizenship Surcharges Management Routes */}
                  <Route
                    path={getAllVisaCitizenshipSurchargesRoute()}
                    element={
                      <PermissionRoute requiredPermission="visaCitizenshipSurcharges.read">
                        <AllVisaCitizenshipSurchargesPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path={getCreateVisaCitizenshipSurchargeRoute()}
                    element={
                      <PermissionRoute requiredPermission="visaCitizenshipSurcharges.create">
                        <CreateVisaCitizenshipSurchargePage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path={getViewVisaCitizenshipSurchargeRoute(
                      viewVisaCitizenshipSurchargeRouteParams
                    )}
                    element={
                      <PermissionRoute requiredPermission="visaCitizenshipSurcharges.read">
                        <ViewVisaCitizenshipSurchargePage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path={getEditVisaCitizenshipSurchargeRoute(
                      editVisaCitizenshipSurchargeRouteParams
                    )}
                    element={
                      <PermissionRoute requiredPermission="visaCitizenshipSurcharges.update">
                        <EditVisaCitizenshipSurchargePage />
                      </PermissionRoute>
                    }
                  />

                  {/* Client Management Routes */}
                  <Route
                    path={getViewClientRoute(viewClientRouteParams)}
                    element={
                      <PermissionRoute requiredPermission="users.read">
                        <ViewClientPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path={getEditClientRoute(editClientRouteParams)}
                    element={
                      <PermissionRoute requiredPermission="users.update">
                        <EditClientPage />
                      </PermissionRoute>
                    }
                  />
                </Route>

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
            <Toaster />
          </TrpcProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  );
};

export default App;
