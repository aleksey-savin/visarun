const getRouteParams = <T extends Record<string, boolean>>(object: T) => {
  return Object.keys(object).reduce((acc, key) => ({ ...acc, [key]: `:${key}` }), {}) as Record<
    keyof T,
    string
  >;
};

export const getDashboardRoute = () => '/';
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
