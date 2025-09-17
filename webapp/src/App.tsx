import './App.css';
import { TrpcProvider } from './lib/trpcProvider';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useOrderStore from './stores/order/order-store';

import AllUsersPage from './pages/Users/getAll.js';
import ViewUserPage from './pages/Users/view.js';
import CreateUserPage from './pages/Users/create.js';
import EditUserPage from './pages/Users/edit.js';

import AllRolesPage from './pages/Roles/getAll.js';
import ViewRolePage from './pages/Roles/view.js';
import CreateRolePage from './pages/Roles/create.js';
import EditRolePage from './pages/Roles/edit';
import DashboardPage from './pages/Dashboard';
import CurrencyExchangePage from './pages/CurrencyExchange';
import HomePage from './pages/HomePage';
import TelegramChannelsPage from './pages/Telegram/getAll.js';
import ViewTelegramChannelPage from './pages/Telegram/view.js';
import ContactMethodsPage from './pages/ContactMethods/getAll.js';
import CreateContactMethodPage from './pages/ContactMethods/create.js';
import EditContactMethodPage from './pages/ContactMethods/edit.js';

// Countries pages
import AllCountriesPage from './pages/Countries/getAll.js';
import ViewCountryPage from './pages/Countries/view.js';
import CreateCountryPage from './pages/Countries/create.js';
import EditCountryPage from './pages/Countries/edit';

// Currencies pages
import AllCurrenciesPage from './pages/Currencies/getAll.js';
import ViewCurrencyPage from './pages/Currencies/view.js';
import CreateCurrencyPage from './pages/Currencies/create.js';
import EditCurrencyPage from './pages/Currencies/edit';

// Citizenships pages
import AllCitizenshipsPage from './pages/Citizenships/getAll.js';
import ViewCitizenshipPage from './pages/Citizenships/view.js';
import CreateCitizenshipPage from './pages/Citizenships/create.js';
import EditCitizenshipPage from './pages/Citizenships/edit';

// Visa Types pages
import AllVisaTypesPage from './pages/VisaTypes/getAll.js';
import ViewVisaTypePage from './pages/VisaTypes/view.js';
import CreateVisaTypePage from './pages/VisaTypes/create.js';
import EditVisaTypePage from './pages/VisaTypes/edit';

// Transport Types pages
import AllTransportTypesPage from './pages/TransportTypes/index.js';
import CreateTransportTypePage from './pages/TransportTypes/edit.js';
import EditTransportTypePage from './pages/TransportTypes/edit.js';

// Transports pages
import AllTransportsPage from './pages/Transports/index.js';
import CreateTransportPage from './pages/Transports/edit.js';
import EditTransportPage from './pages/Transports/edit.js';

// Seat Classes pages
import AllSeatClassesPage from './pages/SeatClasses/index.js';
import CreateSeatClassPage from './pages/SeatClasses/edit.js';
import EditSeatClassPage from './pages/SeatClasses/edit.js';

// Visa Citizenship Surcharges pages
import AllVisaCitizenshipSurchargesPage from './pages/VisaCitizenshipSurcharges/getAll.js';
import ViewVisaCitizenshipSurchargePage from './pages/VisaCitizenshipSurcharges/view.js';
import CreateVisaCitizenshipSurchargePage from './pages/VisaCitizenshipSurcharges/create.js';
import EditVisaCitizenshipSurchargePage from './pages/VisaCitizenshipSurcharges/edit';

// Client pages
import ViewClientPage from './pages/Clients/view';

// Message templates pages
import AllMessageTemplatesPage from './pages/MessageTemplates/getAll.js';

// Requirements pages
import RequirementsPage from './pages/Requirements/index.js';
import CreateRequirementPage from './pages/Requirements/create.js';
import ViewRequirementPage from './pages/Requirements/view.js';
import EditRequirementPage from './pages/Requirements/edit.js';
import CreateMessageTemplatePage from './pages/MessageTemplates/create.js';
import ViewMessageTemplatePage from './pages/MessageTemplates/view.js';
import EditMessageTemplatePage from './pages/MessageTemplates/edit.js';

// Audit Log pages
import AllAuditLogsPage from './pages/AuditLogs/getAll.js';
import ViewAuditLogPage from './pages/AuditLogs/view.js';

// Order pages
import AllOrdersPage from './pages/Order/index.js';
import EditOrderPage from './pages/Order/edit.js';
import ViewOrderPage from './pages/Order/view.js';

// Visa Applications pages
import AllVisaApplicationsPage from './pages/VisaApplications/getAll.js';
import ViewVisaApplicationPage from './pages/VisaApplications/view.js';

// VisarunSchedule pages
import AllVisarunSchedulesPage from './pages/VisarunSchedules/index.js';
import CreateVisarunSchedulePage from './pages/VisarunSchedules/create.js';
import EditVisarunSchedulePage from './pages/VisarunSchedules/edit.js';

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
  getCreateContactMethodRoute,
  getEditContactMethodRoute,
  editContactMethodRouteParams,
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
  // Currency routes
  getAllCurrenciesRoute,
  getViewCurrencyRoute,
  getCreateCurrencyRoute,
  getEditCurrencyRoute,
  editCurrencyRouteParams,
  viewCurrencyRouteParams,
  // Visa Types routes
  getAllVisaTypesRoute,
  getViewVisaTypeRoute,
  getCreateVisaTypeRoute,
  editTransportTypeRouteParams,
  editTransportRouteParams,
  // Transport Types routes
  getAllTransportTypesRoute,
  getCreateTransportTypeRoute,
  getEditTransportTypeRoute,
  // Transports routes
  getAllTransportsRoute,
  getCreateTransportRoute,
  getEditTransportRoute,
  // Seat Classes routes
  getAllSeatClassesRoute,
  getCreateSeatClassRoute,
  getEditSeatClassRoute,
  editSeatClassRouteParams,
  getEditVisaTypeRoute,
  editVisaTypeRouteParams,
  viewVisaTypeRouteParams,
  // VisarunSchedule routes
  getAllVisarunSchedulesRoute,
  getCreateVisarunScheduleRoute,
  getEditVisarunScheduleRoute,
  editVisarunScheduleRouteParams,
  // Visa Citizenship Surcharges routes
  getAllVisaCitizenshipSurchargesRoute,
  getCreateVisaCitizenshipSurchargeRoute,
  getViewVisaCitizenshipSurchargeRoute,
  getEditVisaCitizenshipSurchargeRoute,
  viewVisaCitizenshipSurchargeRouteParams,
  editVisaCitizenshipSurchargeRouteParams,
  getViewClientRoute,
  viewClientRouteParams,
  getAllRequirementsRoute,
  getCreateRequirementRoute,
  getViewRequirementRoute,
  getEditRequirementRoute,
  viewRequirementRouteParams,
  editRequirementRouteParams,
  getMessageTemplatesRoute,
  getCreateMessageTemplateRoute,
  getViewMessageTemplateRoute,
  getEditMessageTemplateRoute,
  viewMessageTemplateRouteParams,
  editMessageTemplateRouteParams,
  // Audit Log routes
  getAllAuditLogsRoute,
  getViewAuditLogRoute,
  viewAuditLogRouteParams,
  // Order routes
  getAllOrdersRoute,
  getEditOrderRoute,
  getViewOrderRoute,
  editOrderRouteParams,
  viewOrderRouteParams,
  // Visa Applications routes
  getAllVisaApplicationsRoute,
  getViewVisaApplicationRoute,
  viewVisaApplicationRouteParams,
} from './lib/routes';

import Layout from '@/components/Layout';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/lib/auth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PermissionRoute } from '@/components/PermissionRoute';
import { Toaster } from '@/components/ui/sonner';
import AccessDeniedPage from '@/pages/AccessDenied';

const OrderEditWrapper = ({ children }: { children: React.ReactNode }) => {
  const reset = useOrderStore(state => state.reset);

  useEffect(() => {
    return () => {
      // Reset the order store when leaving the order edit page
      reset();
    };
  }, [reset]);

  return <>{children}</>;
};

const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
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
                <Route
                  path={getCreateContactMethodRoute()}
                  element={
                    <PermissionRoute requiredPermission="global.fullAccess">
                      <CreateContactMethodPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getEditContactMethodRoute(editContactMethodRouteParams)}
                  element={
                    <PermissionRoute requiredPermission="global.fullAccess">
                      <EditContactMethodPage />
                    </PermissionRoute>
                  }
                />

                {/* Requirements Management Routes */}
                <Route
                  path={getAllRequirementsRoute()}
                  element={
                    <PermissionRoute requiredPermission="requirements.read">
                      <RequirementsPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getCreateRequirementRoute()}
                  element={
                    <PermissionRoute requiredPermission="requirements.create">
                      <CreateRequirementPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getViewRequirementRoute(viewRequirementRouteParams)}
                  element={
                    <PermissionRoute requiredPermission="requirements.read">
                      <ViewRequirementPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getEditRequirementRoute(editRequirementRouteParams)}
                  element={
                    <PermissionRoute requiredPermission="requirements.update">
                      <EditRequirementPage />
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

                {/* Currencies Management Routes */}
                <Route
                  path={getAllCurrenciesRoute()}
                  element={
                    <PermissionRoute requiredPermission="currencies.read">
                      <AllCurrenciesPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getCreateCurrencyRoute()}
                  element={
                    <PermissionRoute requiredPermission="currencies.create">
                      <CreateCurrencyPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getViewCurrencyRoute(viewCurrencyRouteParams)}
                  element={
                    <PermissionRoute requiredPermission="currencies.read">
                      <ViewCurrencyPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getEditCurrencyRoute(editCurrencyRouteParams)}
                  element={
                    <PermissionRoute requiredPermission="currencies.update">
                      <EditCurrencyPage />
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

                {/* Visa Types Management Routes */}
                <Route
                  path={getAllVisaTypesRoute()}
                  element={
                    <PermissionRoute requiredPermission="visaTypes.read">
                      <AllVisaTypesPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getCreateVisaTypeRoute()}
                  element={
                    <PermissionRoute requiredPermission="visaTypes.create">
                      <CreateVisaTypePage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getViewVisaTypeRoute(viewVisaTypeRouteParams)}
                  element={
                    <PermissionRoute requiredPermission="visaTypes.read">
                      <ViewVisaTypePage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getEditVisaTypeRoute(editVisaTypeRouteParams)}
                  element={
                    <PermissionRoute requiredPermission="visaTypes.update">
                      <EditVisaTypePage />
                    </PermissionRoute>
                  }
                />

                {/* Transport Types Routes */}
                <Route
                  path={getAllTransportTypesRoute()}
                  element={
                    <PermissionRoute requiredPermission="transportTypes.read">
                      <AllTransportTypesPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getCreateTransportTypeRoute()}
                  element={
                    <PermissionRoute requiredPermission="transportTypes.create">
                      <CreateTransportTypePage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getEditTransportTypeRoute(editTransportTypeRouteParams)}
                  element={
                    <PermissionRoute requiredPermission="transportTypes.update">
                      <EditTransportTypePage />
                    </PermissionRoute>
                  }
                />

                {/* Transports Routes */}
                <Route
                  path={getAllTransportsRoute()}
                  element={
                    <PermissionRoute requiredPermission="transports.read">
                      <AllTransportsPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getCreateTransportRoute()}
                  element={
                    <PermissionRoute requiredPermission="transports.create">
                      <CreateTransportPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getEditTransportRoute(editTransportRouteParams)}
                  element={
                    <PermissionRoute requiredPermission="transports.update">
                      <EditTransportPage />
                    </PermissionRoute>
                  }
                />

                {/* Seat Classes Routes */}
                <Route
                  path={getAllSeatClassesRoute()}
                  element={
                    <PermissionRoute requiredPermission="seatClasses.read">
                      <AllSeatClassesPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getCreateSeatClassRoute()}
                  element={
                    <PermissionRoute requiredPermission="seatClasses.create">
                      <CreateSeatClassPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getEditSeatClassRoute(editSeatClassRouteParams)}
                  element={
                    <PermissionRoute requiredPermission="seatClasses.update">
                      <EditSeatClassPage />
                    </PermissionRoute>
                  }
                />

                {/* VisarunSchedule Routes */}
                <Route
                  path={getAllVisarunSchedulesRoute()}
                  element={
                    <PermissionRoute requiredPermission="visarunSchedules.read">
                      <AllVisarunSchedulesPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getCreateVisarunScheduleRoute()}
                  element={
                    <PermissionRoute requiredPermission="visarunSchedules.create">
                      <CreateVisarunSchedulePage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getEditVisarunScheduleRoute(editVisarunScheduleRouteParams)}
                  element={
                    <PermissionRoute requiredPermission="visarunSchedules.update">
                      <EditVisarunSchedulePage />
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

                {/* Audit Log Routes */}
                <Route
                  path={getAllAuditLogsRoute()}
                  element={
                    <PermissionRoute requiredPermission="audit.manage">
                      <AllAuditLogsPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getViewAuditLogRoute(viewAuditLogRouteParams)}
                  element={
                    <PermissionRoute requiredPermission="audit.manage">
                      <ViewAuditLogPage />
                    </PermissionRoute>
                  }
                />

                {/* Order Routes */}
                <Route
                  path={getAllOrdersRoute()}
                  element={
                    <PermissionRoute requiredPermission="orders.read">
                      <AllOrdersPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getViewOrderRoute(viewOrderRouteParams)}
                  element={
                    <PermissionRoute requiredPermission="orders.read">
                      <ViewOrderPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getEditOrderRoute(editOrderRouteParams)}
                  element={
                    <OrderEditWrapper>
                      <EditOrderPage />
                    </OrderEditWrapper>
                  }
                />

                {/* Visa Applications Routes */}
                <Route
                  path={getAllVisaApplicationsRoute()}
                  element={
                    <PermissionRoute requiredPermission="visaApplications.read">
                      <AllVisaApplicationsPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path={getViewVisaApplicationRoute(viewVisaApplicationRouteParams)}
                  element={
                    <PermissionRoute requiredPermission="visaApplications.read">
                      <ViewVisaApplicationPage />
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
  );
};

export default App;
