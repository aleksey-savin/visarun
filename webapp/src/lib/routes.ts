const getRouteParams = <T extends Record<string, boolean>>(object: T) => {
  return Object.keys(object).reduce((acc, key) => ({ ...acc, [key]: `:${key}` }), {}) as Record<
    keyof T,
    string
  >;
};

export const getDashboardRoute = () => '/dashboard';
export const getCurrencyExchangeRoute = () => '/currency-exchange';

export const getAllUsersRoute = () => '/users';
export const getCreateUserRoute = () => '/users/create';
export const editUserRouteParams = getRouteParams({ id: true });
export type EditUserRouteParams = typeof editUserRouteParams;
export const getEditUserRoute = ({ id }: EditUserRouteParams) => `/users/edit/${id}`;

export const getAllRolesRoute = () => '/roles';
export const getCreateRoleRoute = () => '/roles/create';
export const editRoleRouteParams = getRouteParams({ id: true });
export type EditRoleRouteParams = typeof editRoleRouteParams;
export const getEditRoleRoute = ({ id }: EditRoleRouteParams) => `/roles/edit/${id}`;
export const viewRoleRouteParams = getRouteParams({ id: true });
export type ViewRoleRouteParams = typeof viewRoleRouteParams;
export const getViewRoleRoute = ({ id }: ViewRoleRouteParams) => `/roles/view/${id}`;

export const getTelegramChannelsRoute = () => '/telegram-channels';
export const viewTelegramChannelRouteParams = getRouteParams({ id: true });
export type ViewTelegramChannelRouteParams = typeof viewTelegramChannelRouteParams;
export const getViewTelegramChannelRoute = ({ id }: ViewTelegramChannelRouteParams) =>
  `/telegram-channels/${id}`;

export const getMessageTemplatesRoute = () => '/message-templates';
export const getCreateMessageTemplateRoute = () => '/message-templates/create';
export const editMessageTemplateRouteParams = getRouteParams({ id: true });
export type EditMessageTemplateRouteParams = typeof editMessageTemplateRouteParams;
export const getEditMessageTemplateRoute = ({ id }: EditMessageTemplateRouteParams) =>
  `/message-templates/edit/${id}`;
export const viewMessageTemplateRouteParams = getRouteParams({ id: true });
export type ViewMessageTemplateRouteParams = typeof viewMessageTemplateRouteParams;
export const getViewMessageTemplateRoute = ({ id }: ViewMessageTemplateRouteParams) =>
  `/message-templates/view/${id}`;

export const getSignInRoute = () => '/sign-in';
export const getAccessDeniedRoute = () => '/access-denied';

export const getAllContactMethodsRoute = () => '/contact-methods';
export const getCreateContactMethodRoute = () => '/contact-methods/create';
export const editContactMethodRouteParams = getRouteParams({ id: true });
export type EditContactMethodRouteParams = typeof editContactMethodRouteParams;
export const getEditContactMethodRoute = ({ id }: EditContactMethodRouteParams) =>
  `/contact-methods/edit/${id}`;

export const getAllRequirementsRoute = () => '/requirements';
export const getCreateRequirementRoute = () => '/requirements/create';
export const editRequirementRouteParams = getRouteParams({ id: true });
export type EditRequirementRouteParams = typeof editRequirementRouteParams;
export const getEditRequirementRoute = ({ id }: EditRequirementRouteParams) =>
  `/requirements/edit/${id}`;
export const viewRequirementRouteParams = getRouteParams({ id: true });
export type ViewRequirementRouteParams = typeof viewRequirementRouteParams;
export const getViewRequirementRoute = ({ id }: ViewRequirementRouteParams) =>
  `/requirements/view/${id}`;

export const viewUserRouteParams = getRouteParams({ id: true });
export type ViewUserRouteParams = typeof viewUserRouteParams;
export const getViewUserRoute = ({ id }: ViewUserRouteParams) => `/users/${id}`;

// Countries routes
export const getAllCountriesRoute = () => '/countries';
export const getCreateCountryRoute = () => '/countries/create';
export const editCountryRouteParams = getRouteParams({ id: true });
export type EditCountryRouteParams = typeof editCountryRouteParams;
export const getEditCountryRoute = ({ id }: EditCountryRouteParams) => `/countries/edit/${id}`;
export const viewCountryRouteParams = getRouteParams({ id: true });
export type ViewCountryRouteParams = typeof viewCountryRouteParams;
export const getViewCountryRoute = ({ id }: ViewCountryRouteParams) => `/countries/view/${id}`;

// Citizenships routes
export const getAllCitizenshipsRoute = () => '/citizenships';
export const getCreateCitizenshipRoute = () => '/citizenships/create';
export const editCitizenshipRouteParams = getRouteParams({ id: true });
export type EditCitizenshipRouteParams = typeof editCitizenshipRouteParams;
export const getEditCitizenshipRoute = ({ id }: EditCitizenshipRouteParams) =>
  `/citizenships/edit/${id}`;
export const viewCitizenshipRouteParams = getRouteParams({ id: true });
export type ViewCitizenshipRouteParams = typeof viewCitizenshipRouteParams;
export const getViewCitizenshipRoute = ({ id }: ViewCitizenshipRouteParams) =>
  `/citizenships/view/${id}`;

// Visa Types routes
export const getAllVisaTypesRoute = () => '/visa-types';
export const getCreateVisaTypeRoute = () => '/visa-types/create';
export const editVisaTypeRouteParams = getRouteParams({ id: true });
export type EditVisaTypeRouteParams = typeof editVisaTypeRouteParams;
export const getEditVisaTypeRoute = ({ id }: EditVisaTypeRouteParams) => `/visa-types/edit/${id}`;
export const viewVisaTypeRouteParams = getRouteParams({ id: true });
export type ViewVisaTypeRouteParams = typeof viewVisaTypeRouteParams;
export const getViewVisaTypeRoute = ({ id }: ViewVisaTypeRouteParams) => `/visa-types/view/${id}`;

// Visa Citizenship Surcharges routes
export const getAllVisaCitizenshipSurchargesRoute = () => '/visa-citizenship-surcharges';
export const getCreateVisaCitizenshipSurchargeRoute = () => '/visa-citizenship-surcharges/create';
export const editVisaCitizenshipSurchargeRouteParams = getRouteParams({ id: true });
export type EditVisaCitizenshipSurchargeRouteParams =
  typeof editVisaCitizenshipSurchargeRouteParams;
export const getEditVisaCitizenshipSurchargeRoute = ({
  id,
}: EditVisaCitizenshipSurchargeRouteParams) => `/visa-citizenship-surcharges/edit/${id}`;
export const viewVisaCitizenshipSurchargeRouteParams = getRouteParams({ id: true });
export type ViewVisaCitizenshipSurchargeRouteParams =
  typeof viewVisaCitizenshipSurchargeRouteParams;
export const getViewVisaCitizenshipSurchargeRoute = ({
  id,
}: ViewVisaCitizenshipSurchargeRouteParams) => `/visa-citizenship-surcharges/view/${id}`;

// Client routes
export const viewClientRouteParams = getRouteParams({ id: true });
export type ViewClientRouteParams = typeof viewClientRouteParams;
export const getViewClientRoute = ({ id }: ViewClientRouteParams) => `/clients/view/${id}`;
export const editClientRouteParams = getRouteParams({ id: true });
export type EditClientRouteParams = typeof editClientRouteParams;
export const getEditClientRoute = ({ id }: EditClientRouteParams) => `/clients/edit/${id}`;

// Audit Log routes
export const getAllAuditLogsRoute = () => '/audit-logs';
export const viewAuditLogRouteParams = getRouteParams({ id: true });
export type ViewAuditLogRouteParams = typeof viewAuditLogRouteParams;
export const getViewAuditLogRoute = ({ id }: ViewAuditLogRouteParams) => `/audit-logs/view/${id}`;

// Client Requirements routes
export const getAllClientRequirementsRoute = () => '/client-requirements';
export const getCreateClientRequirementRoute = () => '/client-requirements/create';
export const editClientRequirementRouteParams = getRouteParams({ id: true });
export type EditClientRequirementRouteParams = typeof editClientRequirementRouteParams;
export const getEditClientRequirementRoute = ({ id }: EditClientRequirementRouteParams) =>
  `/client-requirements/edit/${id}`;
export const viewClientRequirementRouteParams = getRouteParams({ id: true });
export type ViewClientRequirementRouteParams = typeof viewClientRequirementRouteParams;
export const getViewClientRequirementRoute = ({ id }: ViewClientRequirementRouteParams) =>
  `/client-requirements/view/${id}`;

// Currency routes
export const getAllCurrenciesRoute = () => '/currencies';
export const getCreateCurrencyRoute = () => '/currencies/create';
export const editCurrencyRouteParams = getRouteParams({ id: true });
export type EditCurrencyRouteParams = typeof editCurrencyRouteParams;
export const getEditCurrencyRoute = ({ id }: EditCurrencyRouteParams) => `/currencies/edit/${id}`;
export const viewCurrencyRouteParams = getRouteParams({ id: true });
export type ViewCurrencyRouteParams = typeof viewCurrencyRouteParams;
export const getViewCurrencyRoute = ({ id }: ViewCurrencyRouteParams) => `/currencies/view/${id}`;

// Order routes
export const getAllOrdersRoute = () => '/orders';
export const getCreateOrderRoute = () => '/orders/create';
export const editOrderRouteParams = getRouteParams({ id: true });
export type EditOrderRouteParams = typeof editOrderRouteParams;
export const getEditOrderRoute = ({ id }: EditOrderRouteParams) => `/orders/edit/${id}`;
export const viewOrderRouteParams = getRouteParams({ id: true });
export type ViewOrderRouteParams = typeof viewOrderRouteParams;
export const getViewOrderRoute = ({ id }: ViewOrderRouteParams) => `/orders/view/${id}`;

// Currency Exchanges routes
export const getAllCurrencyExchangesRoute = () => '/currency-exchanges';

// Visa Applications routes
export const getAllVisaApplicationsRoute = () => '/visa-applications';
export const getCreateVisaApplicationRoute = () => '/visa-applications/create';
export const editVisaApplicationRouteParams = getRouteParams({ id: true });
export type EditVisaApplicationRouteParams = typeof editVisaApplicationRouteParams;
export const getEditVisaApplicationRoute = ({ id }: EditVisaApplicationRouteParams) =>
  `/visa-applications/edit/${id}`;
export const viewVisaApplicationRouteParams = getRouteParams({ id: true });
export type ViewVisaApplicationRouteParams = typeof viewVisaApplicationRouteParams;
export const getViewVisaApplicationRoute = ({ id }: ViewVisaApplicationRouteParams) =>
  `/visa-applications/view/${id}`;

// TransportType routes
export const getAllTransportTypesRoute = () => '/transport-types';
export const getCreateTransportTypeRoute = () => '/transport-types/create';
export const editTransportTypeRouteParams = getRouteParams({ id: true });
export type EditTransportTypeRouteParams = typeof editTransportTypeRouteParams;
export const getEditTransportTypeRoute = ({ id }: EditTransportTypeRouteParams) =>
  `/transport-types/edit/${id}`;
export const viewTransportTypeRouteParams = getRouteParams({ id: true });
export type ViewTransportTypeRouteParams = typeof viewTransportTypeRouteParams;
export const getViewTransportTypeRoute = ({ id }: ViewTransportTypeRouteParams) =>
  `/transport-types/view/${id}`;

// Transport routes
export const getAllTransportsRoute = () => '/transports';
export const getCreateTransportRoute = () => '/transports/create';
export const editTransportRouteParams = getRouteParams({ id: true });
export type EditTransportRouteParams = typeof editTransportRouteParams;
export const getEditTransportRoute = ({ id }: EditTransportRouteParams) => `/transports/edit/${id}`;
export const viewTransportRouteParams = getRouteParams({ id: true });
export type ViewTransportRouteParams = typeof viewTransportRouteParams;
export const getViewTransportRoute = ({ id }: ViewTransportRouteParams) => `/transports/view/${id}`;

// SeatClass routes
export const getAllSeatClassesRoute = () => '/seat-classes';
export const getCreateSeatClassRoute = () => '/seat-classes/create';
export const editSeatClassRouteParams = getRouteParams({ id: true });
export type EditSeatClassRouteParams = typeof editSeatClassRouteParams;
export const getEditSeatClassRoute = ({ id }: EditSeatClassRouteParams) =>
  `/seat-classes/edit/${id}`;
export const viewSeatClassRouteParams = getRouteParams({ id: true });
export type ViewSeatClassRouteParams = typeof viewSeatClassRouteParams;
export const getViewSeatClassRoute = ({ id }: ViewSeatClassRouteParams) =>
  `/seat-classes/view/${id}`;

// VisarunSchedule routes
export const getAllVisarunSchedulesRoute = () => '/visarun-schedules';
export const getCreateVisarunScheduleRoute = () => '/visarun-schedules/create';
export const editVisarunScheduleRouteParams = getRouteParams({ id: true });
export type EditVisarunScheduleRouteParams = typeof editVisarunScheduleRouteParams;
export const getEditVisarunScheduleRoute = ({ id }: EditVisarunScheduleRouteParams) =>
  `/visarun-schedules/${id}/edit`;
export const viewVisarunScheduleRouteParams = getRouteParams({ id: true });
export type ViewVisarunScheduleRouteParams = typeof viewVisarunScheduleRouteParams;
export const getViewVisarunScheduleRoute = ({ id }: ViewVisarunScheduleRouteParams) =>
  `/visarun-schedules/${id}/view`;

// VisarunTrips routes
export const getAllVisarunTripsRoute = () => '/transfers';
