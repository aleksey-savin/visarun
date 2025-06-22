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

export const getSignInRoute = () => '/sign-in';
export const getAccessDeniedRoute = () => '/access-denied';

export const getAllContactMethodsRoute = () => '/contact-methods';

export const viewUserRouteParams = getRouteParams({ id: true });
export type ViewUserRouteParams = typeof viewUserRouteParams;
export const getViewUserRoute = ({ id }: ViewUserRouteParams) => `/users/${id}`;
