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
export const getTelegramChannelsRoute = () => '/telegram-channels';

export const viewTelegramChannelRouteParams = getRouteParams({ id: true });
export type ViewTelegramChannelRouteParams = typeof viewTelegramChannelRouteParams;
export const getViewTelegramChannelRoute = ({ id }: ViewTelegramChannelRouteParams) =>
  `/telegram-channels/${id}`;

export const getSignInRoute = () => '/sign-in';

export const viewUserRouteParams = getRouteParams({ id: true });
export type ViewUserRouteParams = typeof viewUserRouteParams;
export const getViewUserRoute = ({ id }: ViewUserRouteParams) => `/users/${id}`;
