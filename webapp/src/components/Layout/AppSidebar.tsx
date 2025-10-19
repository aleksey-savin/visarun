import { useState } from 'react';
import {
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Globe,
  UserCheck,
  FileText,
  DollarSign,
  Hash,
  Mail,
  User,
  Shield,
  ClipboardList,
  FileSearch,
  Gauge,
  ShoppingCart,
  Coins,
  LogOut,
  Car,
  Bus,
  Armchair,
  X,
  Calculator,
  Search,
  Cog,
  Calendar,
} from 'lucide-react';

import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/lib/auth';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  getAllRolesRoute,
  getAllUsersRoute,
  getCurrencyExchangeRoute,
  getTelegramChannelsRoute,
  getAllContactMethodsRoute,
  getAllRequirementsRoute,
  // New entity routes
  getAllCountriesRoute,
  getAllCurrenciesRoute,
  getAllCitizenshipsRoute,
  getAllVisaTypesRoute,
  getAllVisaCitizenshipSurchargesRoute,
  getAllVisaApplicationsRoute,
  getAllTransportTypesRoute,
  getAllTransportsRoute,
  getAllSeatClassesRoute,
  getAllVisarunSchedulesRoute,
  getAllVisarunTripsRoute,
  getMessageTemplatesRoute,
  getAllAuditLogsRoute,
  getDashboardRoute,
  getAllOrdersRoute,
} from '@/lib/routes';
import { Button } from '../ui/button';
import { getUserDisplayName } from '@/utils/user';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';

export function AppSidebar() {
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();
  const { hasPermission, logout, userEmail, userFirstName, userLastName, user } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdministrationOpen, setAdministrationOpen] = useState(false);

  // Clear search when sidebar is toggled closed on mobile
  const handleToggleSidebar = () => {
    setSearchQuery('');
    toggleSidebar();
  };

  // Helper function to check if a menu item should be shown based on search query
  const shouldShowMenuItem = (itemName: string, childItems?: string[]): boolean => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();

    // Check if the main item matches
    if (itemName.toLowerCase().includes(query)) return true;

    // Check if any child items match (for parent categories)
    if (childItems && childItems.some(child => child.toLowerCase().includes(query))) {
      return true;
    }

    return false;
  };

  // Auto-expand menus when searching
  const hasSearchQuery = searchQuery.trim().length > 0;

  // Permission checks
  const canAccessExchangeRates = hasPermission('exchangeRates.create');
  const canReadUsers = hasPermission('users.read');
  const canReadRoles = hasPermission('roles.read');
  const canReadTelegram = hasPermission('telegram.channels.read');
  const canManageContactMethods = hasPermission('global.fullAccess');
  const isAdmin = hasPermission('global.fullAccess');

  // Requirements permissions
  const canReadRequirements =
    hasPermission('requirements.read') ||
    hasPermission('requirements.create') ||
    hasPermission('requirements.update') ||
    hasPermission('requirements.delete');

  // New entity permissions
  const canReadCountries =
    hasPermission('countries.read') ||
    hasPermission('countries.create') ||
    hasPermission('countries.update') ||
    hasPermission('countries.delete');
  const canReadCurrencies =
    hasPermission('currencies.read') ||
    hasPermission('currencies.create') ||
    hasPermission('currencies.update') ||
    hasPermission('currencies.delete');

  const canReadCitizenships =
    hasPermission('citizenships.read') ||
    hasPermission('citizenships.create') ||
    hasPermission('citizenships.update') ||
    hasPermission('citizenships.delete');
  const canReadVisaTypes =
    hasPermission('visaTypes.read') ||
    hasPermission('visaTypes.create') ||
    hasPermission('visaTypes.update') ||
    hasPermission('visaTypes.delete');
  const canReadVisaCitizenshipSurcharges =
    hasPermission('visaCitizenshipSurcharges.read') ||
    hasPermission('visaCitizenshipSurcharges.create') ||
    hasPermission('visaCitizenshipSurcharges.update') ||
    hasPermission('visaCitizenshipSurcharges.delete');

  const canReadVisaApplications =
    hasPermission('visaApplications.read') ||
    hasPermission('visaApplications.create') ||
    hasPermission('visaApplications.update') ||
    hasPermission('visaApplications.delete');

  const canManageAudit = hasPermission('audit.manage');
  const canReadOrders =
    hasPermission('orders.read') ||
    hasPermission('orders.create') ||
    hasPermission('orders.update') ||
    hasPermission('orders.delete');

  // Transport permissions
  const canReadTransportTypes =
    hasPermission('transportTypes.read') ||
    hasPermission('transportTypes.create') ||
    hasPermission('transportTypes.update') ||
    hasPermission('transportTypes.delete');
  const canReadTransports =
    hasPermission('transports.read') ||
    hasPermission('transports.create') ||
    hasPermission('transports.update') ||
    hasPermission('transports.delete');
  const canReadSeatClasses =
    hasPermission('seatClasses.read') ||
    hasPermission('seatClasses.create') ||
    hasPermission('seatClasses.update') ||
    hasPermission('seatClasses.delete');

  // VisarunSchedule permissions
  const canReadVisarunSchedules =
    hasPermission('visarunSchedules.read') ||
    hasPermission('visarunSchedules.create') ||
    hasPermission('visarunSchedules.update') ||
    hasPermission('visarunSchedules.delete');

  // VisarunTrips permissions
  const canReadVisarunTrips =
    hasPermission('visarunTrips.read') ||
    hasPermission('visarunTrips.create') ||
    hasPermission('visarunTrips.update') ||
    hasPermission('visarunTrips.delete');

  // Check if user has any transport management permissions
  const hasAnyTransportPermission =
    canReadTransportTypes ||
    canReadTransports ||
    canReadSeatClasses ||
    canReadVisarunSchedules ||
    canReadVisarunTrips;

  // Check if user has any admin permissions
  const hasAnyAdminPermission =
    canReadUsers ||
    canReadRoles ||
    canReadTelegram ||
    canManageContactMethods ||
    canManageAudit ||
    canReadRequirements ||
    hasAnyTransportPermission ||
    isAdmin ||
    hasPermission('messageTemplates.read') ||
    canReadOrders;

  const handleCurrencyExchangeClick = () => {
    navigate(getCurrencyExchangeRoute());
    toggleSidebar();
  };

  const handleMenuItemClick = () => {
    // Only close sidebar on mobile devices
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  // Helper function to check if any items in a section should be shown
  const shouldShowSection = (sectionItems: string[], permissionChecks: boolean[]): boolean => {
    // First check if user has any permissions for items in this section
    const hasAnyPermissions = permissionChecks.some(hasPermission => hasPermission);
    if (!hasAnyPermissions) return false;

    // If there's no search query, show section if user has permissions
    if (!searchQuery.trim()) return true;

    // If searching, show section only if any items match the search
    return sectionItems.some(item => shouldShowMenuItem(item));
  };

  const WheelIcon = () => {
    return (
      <svg
        width="17"
        height="17"
        viewBox="0 0 17 17"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2.58203 8.87891C2.58203 9.66684 2.73723 10.4471 3.03875 11.175C3.34028 11.903 3.78224 12.5644 4.33939 13.1215C4.89654 13.6787 5.55798 14.1207 6.28593 14.4222C7.01388 14.7237 7.7941 14.8789 8.58203 14.8789C9.36996 14.8789 10.1502 14.7237 10.8781 14.4222C11.6061 14.1207 12.2675 13.6787 12.8247 13.1215C13.3818 12.5644 13.8238 11.903 14.1253 11.175C14.4268 10.4471 14.582 9.66684 14.582 8.87891C14.582 8.09098 14.4268 7.31076 14.1253 6.58281C13.8238 5.85485 13.3818 5.19342 12.8247 4.63627C12.2675 4.07911 11.6061 3.63716 10.8781 3.33563C10.1502 3.0341 9.36996 2.87891 8.58203 2.87891C7.7941 2.87891 7.01388 3.0341 6.28593 3.33563C5.55798 3.63716 4.89654 4.07911 4.33939 4.63627C3.78224 5.19342 3.34028 5.85485 3.03875 6.58281C2.73723 7.31076 2.58203 8.09098 2.58203 8.87891Z"
          stroke="#FAFAFA"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.24805 8.87826C7.24805 9.23188 7.38852 9.57102 7.63857 9.82106C7.88862 10.0711 8.22776 10.2116 8.58138 10.2116C8.935 10.2116 9.27414 10.0711 9.52419 9.82106C9.77424 9.57102 9.91471 9.23188 9.91471 8.87826C9.91471 8.52463 9.77424 8.18549 9.52419 7.93545C9.27414 7.6854 8.935 7.54492 8.58138 7.54492C8.22776 7.54492 7.88862 7.6854 7.63857 7.93545C7.38852 8.18549 7.24805 8.52463 7.24805 8.87826Z"
          stroke="#FAFAFA"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.58203 10.2129V14.8796"
          stroke="#FAFAFA"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.24805 8.87826L2.74805 7.54492"
          stroke="#FAFAFA"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.91602 8.87826L14.416 7.54492"
          stroke="#FAFAFA"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <Sidebar className="bg-secondary">
      <SidebarHeader className="md:flex justify-center items-center border-b py-0 px-3  min-h-[50px]  gap-2 hidden  ">
        <span className="font-semibold">Visarun Vietnam</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <div className="flex md:hidden items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    onClick={handleToggleSidebar}
                    className="block md:hidden"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <span className="font-semibold text-sm">Menu</span>
                </div>
                {canAccessExchangeRates && shouldShowMenuItem('Currency Exchange') && (
                  <Button
                    variant="secondary"
                    className="flex"
                    onClick={handleCurrencyExchangeClick}
                  >
                    <DollarSign />
                    <Calculator />
                  </Button>
                )}
              </div>
              {/* Search bar */}
              <div className="py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search ..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              {shouldShowMenuItem('Dashboard') && (
                <SidebarMenuItem key="Dashboard">
                  <SidebarMenuButton
                    asChild
                    isActive={
                      location.pathname === getDashboardRoute() ||
                      location.pathname.startsWith(`${getDashboardRoute()}/`)
                    }
                  >
                    <Link
                      to={getDashboardRoute()}
                      className="flex items-center gap-2"
                      onClick={handleMenuItemClick}
                    >
                      <Gauge />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {canAccessExchangeRates && shouldShowMenuItem('Currency Exchange') && (
                <SidebarMenuItem key="CurrencyExchange" className="hidden md:block">
                  <SidebarMenuButton
                    asChild
                    isActive={
                      location.pathname === getCurrencyExchangeRoute() ||
                      location.pathname.startsWith(`${getCurrencyExchangeRoute()}/`)
                    }
                  >
                    <Link
                      to={getCurrencyExchangeRoute()}
                      className="flex items-center gap-2"
                      onClick={handleMenuItemClick}
                    >
                      <DollarSign />
                      <span>Currency Exchange</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {canReadOrders && shouldShowMenuItem('Orders') && (
                <SidebarMenuItem key="Orders">
                  <SidebarMenuButton
                    asChild
                    isActive={
                      location.pathname === getAllOrdersRoute() ||
                      location.pathname.startsWith(`${getAllOrdersRoute()}/`)
                    }
                  >
                    <Link to={getAllOrdersRoute()} onClick={handleMenuItemClick}>
                      <ShoppingCart className="w-4 h-4" />
                      <span>Orders</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {canReadVisaApplications && shouldShowMenuItem('Visa Applications') && (
                <SidebarMenuItem key="VisaApplications">
                  <SidebarMenuButton
                    asChild
                    isActive={
                      location.pathname === getAllVisaApplicationsRoute() ||
                      location.pathname.startsWith(`${getAllVisaApplicationsRoute()}/`)
                    }
                  >
                    <Link to={getAllVisaApplicationsRoute()} onClick={handleMenuItemClick}>
                      <FileSearch className="w-4 h-4" />
                      <span>Visa Applications</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {canReadVisarunTrips && shouldShowMenuItem('Transfers') && (
                <SidebarMenuSubItem key="VisarunTrips">
                  <SidebarMenuButton
                    asChild
                    isActive={
                      location.pathname === getAllVisarunTripsRoute() ||
                      location.pathname.startsWith(`${getAllVisarunTripsRoute()}/`)
                    }
                  >
                    <Link to={getAllVisarunTripsRoute()} onClick={handleMenuItemClick}>
                      <WheelIcon />
                      Transfers
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuSubItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {hasAnyAdminPermission && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem key="Administration">
                  <SidebarMenuButton
                    onClick={() => setAdministrationOpen(prev => !prev)}
                    className="flex items-center justify-between px-2"
                  >
                    <div className="flex items-center gap-2">
                      <Cog className="w-5 h-5" />
                      <span>Administration</span>
                    </div>
                    {isAdministrationOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </SidebarMenuButton>

                  {(isAdministrationOpen || hasSearchQuery) && (
                    <SidebarMenuSub>
                      {shouldShowSection(['Roles', 'Users'], [canReadRoles, canReadUsers]) && (
                        <SidebarGroupLabel>User Management</SidebarGroupLabel>
                      )}
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {canReadRoles && shouldShowMenuItem('Roles') && (
                            <SidebarMenuSubItem key="Roles">
                              <SidebarMenuButton
                                asChild
                                isActive={
                                  location.pathname === getAllRolesRoute() ||
                                  location.pathname.startsWith(`${getAllRolesRoute()}/`)
                                }
                              >
                                <Link to={getAllRolesRoute()} onClick={handleMenuItemClick}>
                                  <Shield className="w-4 h-4" />
                                  <span>Roles</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuSubItem>
                          )}

                          {canReadUsers && shouldShowMenuItem('Users') && (
                            <SidebarMenuSubItem key="Users">
                              <SidebarMenuButton
                                asChild
                                isActive={
                                  location.pathname === getAllUsersRoute() ||
                                  location.pathname.startsWith(`${getAllUsersRoute()}/`)
                                }
                              >
                                <Link to={getAllUsersRoute()} onClick={handleMenuItemClick}>
                                  <User className="w-4 h-4" />
                                  <span>Users</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuSubItem>
                          )}
                        </SidebarMenu>
                      </SidebarGroupContent>
                      {shouldShowSection(
                        ['Visa Types', 'Visa Surcharges', 'Visarun Schedules'],
                        [
                          canReadVisaTypes,
                          canReadVisaCitizenshipSurcharges,
                          canReadVisarunSchedules,
                        ]
                      ) && <SidebarGroupLabel>Visa Management</SidebarGroupLabel>}
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {canReadVisaTypes && shouldShowMenuItem('Visa Types') && (
                            <SidebarMenuSubItem key="VisaTypes">
                              <SidebarMenuButton
                                asChild
                                isActive={
                                  location.pathname === getAllVisaTypesRoute() ||
                                  location.pathname.startsWith(`${getAllVisaTypesRoute()}/`)
                                }
                              >
                                <Link to={getAllVisaTypesRoute()} onClick={handleMenuItemClick}>
                                  <FileText className="w-4 h-4" />
                                  <span>Visa Types</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuSubItem>
                          )}
                          {canReadVisaCitizenshipSurcharges &&
                            shouldShowMenuItem('Visa Surcharges') && (
                              <SidebarMenuSubItem key="VisaCitizenshipSurcharges">
                                <SidebarMenuButton
                                  asChild
                                  isActive={
                                    location.pathname === getAllVisaCitizenshipSurchargesRoute() ||
                                    location.pathname.startsWith(
                                      `${getAllVisaCitizenshipSurchargesRoute()}/`
                                    )
                                  }
                                >
                                  <Link
                                    to={getAllVisaCitizenshipSurchargesRoute()}
                                    onClick={handleMenuItemClick}
                                  >
                                    <DollarSign className="w-4 h-4" />
                                    <span>Visa Surcharges</span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuSubItem>
                            )}
                        </SidebarMenu>
                      </SidebarGroupContent>
                      {shouldShowSection(
                        ['Visarun Schedules', 'Transfers'],
                        [canReadVisarunSchedules, canReadVisarunTrips]
                      ) && <SidebarGroupLabel>Visarun Management</SidebarGroupLabel>}
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {canReadVisarunSchedules && shouldShowMenuItem('Visarun Schedules') && (
                            <SidebarMenuSubItem key="VisarunSchedules">
                              <SidebarMenuButton
                                asChild
                                isActive={
                                  location.pathname === getAllVisarunSchedulesRoute() ||
                                  location.pathname.startsWith(`${getAllVisarunSchedulesRoute()}/`)
                                }
                              >
                                <Link
                                  to={getAllVisarunSchedulesRoute()}
                                  onClick={handleMenuItemClick}
                                >
                                  <Calendar className="w-4 h-4" />
                                  <span>Visarun Schedules</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuSubItem>
                          )}
                        </SidebarMenu>
                      </SidebarGroupContent>
                      {shouldShowSection(
                        ['Message templates', 'Telegram Channels & Groups'],
                        [hasPermission('messageTemplates.read'), canReadTelegram]
                      ) && <SidebarGroupLabel>Messengers</SidebarGroupLabel>}
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {hasPermission('messageTemplates.read') &&
                            shouldShowMenuItem('Message templates') && (
                              <SidebarMenuSubItem key="Message templates">
                                <SidebarMenuButton
                                  asChild
                                  isActive={
                                    location.pathname === getMessageTemplatesRoute() ||
                                    location.pathname.startsWith(`${getMessageTemplatesRoute()}/`)
                                  }
                                >
                                  <Link
                                    to={getMessageTemplatesRoute()}
                                    onClick={handleMenuItemClick}
                                  >
                                    <Mail className="w-4 h-4" />
                                    <span>Message templates</span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuSubItem>
                            )}
                          {canReadTelegram && shouldShowMenuItem('Telegram Channels & Groups') && (
                            <SidebarMenuSubItem key="Telegram Channels">
                              <SidebarMenuButton
                                asChild
                                isActive={
                                  location.pathname === getTelegramChannelsRoute() ||
                                  location.pathname.startsWith(`${getTelegramChannelsRoute()}/`)
                                }
                              >
                                <Link to={getTelegramChannelsRoute()} onClick={handleMenuItemClick}>
                                  <Hash className="w-4 h-4" />
                                  <span>Telegram Channels &amp; Groups</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuSubItem>
                          )}
                        </SidebarMenu>
                      </SidebarGroupContent>
                      {shouldShowSection(['Contact Methods'], [canManageContactMethods]) && (
                        <SidebarGroupLabel>Client Communication</SidebarGroupLabel>
                      )}
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {canManageContactMethods && shouldShowMenuItem('Contact Methods') && (
                            <SidebarMenuSubItem key="ContactMethods">
                              <SidebarMenuButton
                                asChild
                                isActive={
                                  location.pathname === getAllContactMethodsRoute() ||
                                  location.pathname.startsWith(`${getAllContactMethodsRoute()}/`)
                                }
                              >
                                <Link
                                  to={getAllContactMethodsRoute()}
                                  onClick={handleMenuItemClick}
                                >
                                  <MessageCircle className="w-5 h-5" />
                                  <span>Contact Methods</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuSubItem>
                          )}
                        </SidebarMenu>
                      </SidebarGroupContent>
                      {shouldShowSection(
                        ['Citizenships', 'Countries', 'Requirements'],
                        [canReadCitizenships, canReadCountries, canReadRequirements]
                      ) && <SidebarGroupLabel>Geography & Rules</SidebarGroupLabel>}
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {canReadCitizenships && shouldShowMenuItem('Citizenships') && (
                            <SidebarMenuSubItem key="Citizenships">
                              <SidebarMenuButton
                                asChild
                                isActive={
                                  location.pathname === getAllCitizenshipsRoute() ||
                                  location.pathname.startsWith(`${getAllCitizenshipsRoute()}/`)
                                }
                              >
                                <Link to={getAllCitizenshipsRoute()} onClick={handleMenuItemClick}>
                                  <UserCheck className="w-4 h-4" />
                                  <span>Citizenships</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuSubItem>
                          )}
                          {canReadCountries && shouldShowMenuItem('Countries') && (
                            <SidebarMenuSubItem key="Countries">
                              <SidebarMenuButton
                                asChild
                                isActive={
                                  location.pathname === getAllCountriesRoute() ||
                                  location.pathname.startsWith(`${getAllCountriesRoute()}/`)
                                }
                              >
                                <Link to={getAllCountriesRoute()} onClick={handleMenuItemClick}>
                                  <Globe className="w-4 h-4" />
                                  <span>Countries</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuSubItem>
                          )}
                          {canReadRequirements && shouldShowMenuItem('Requirements') && (
                            <SidebarMenuSubItem key="Requirements">
                              <SidebarMenuButton
                                asChild
                                isActive={
                                  location.pathname === getAllRequirementsRoute() ||
                                  location.pathname.startsWith(`${getAllRequirementsRoute()}/`)
                                }
                              >
                                <Link
                                  to={getAllRequirementsRoute()}
                                  className="flex items-center gap-2"
                                  onClick={handleMenuItemClick}
                                >
                                  <ClipboardList className="w-5 h-5" />
                                  <span>Requirements</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuSubItem>
                          )}
                        </SidebarMenu>
                      </SidebarGroupContent>
                      {shouldShowSection(
                        ['Seat Classes', 'Transports', 'Transport Types'],
                        [canReadSeatClasses, canReadTransports, canReadTransportTypes]
                      ) && <SidebarGroupLabel>Transport</SidebarGroupLabel>}
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {canReadSeatClasses && shouldShowMenuItem('Seat Classes') && (
                            <SidebarMenuSubItem key="SeatClasses">
                              <SidebarMenuButton
                                asChild
                                isActive={
                                  location.pathname === getAllSeatClassesRoute() ||
                                  location.pathname.startsWith(`${getAllSeatClassesRoute()}/`)
                                }
                              >
                                <Link to={getAllSeatClassesRoute()} onClick={handleMenuItemClick}>
                                  <Armchair className="w-4 h-4" />
                                  <span>Seat Classes</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuSubItem>
                          )}
                          {canReadTransports && shouldShowMenuItem('Transports') && (
                            <SidebarMenuSubItem key="Transports">
                              <SidebarMenuButton
                                asChild
                                isActive={
                                  location.pathname === getAllTransportsRoute() ||
                                  location.pathname.startsWith(`${getAllTransportsRoute()}/`)
                                }
                              >
                                <Link to={getAllTransportsRoute()} onClick={handleMenuItemClick}>
                                  <Bus className="w-4 h-4" />
                                  <span>Transports</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuSubItem>
                          )}
                          {canReadTransportTypes && shouldShowMenuItem('Transport Types') && (
                            <SidebarMenuSubItem key="TransportTypes">
                              <SidebarMenuButton
                                asChild
                                isActive={
                                  location.pathname === getAllTransportTypesRoute() ||
                                  location.pathname.startsWith(`${getAllTransportTypesRoute()}/`)
                                }
                              >
                                <Link
                                  to={getAllTransportTypesRoute()}
                                  onClick={handleMenuItemClick}
                                >
                                  <Car className="w-4 h-4" />
                                  <span>Transport Types</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuSubItem>
                          )}
                        </SidebarMenu>
                      </SidebarGroupContent>
                      {shouldShowSection(['Currencies'], [canReadCurrencies]) && (
                        <SidebarGroupLabel>Finances</SidebarGroupLabel>
                      )}
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {canReadCurrencies && shouldShowMenuItem('Currencies') && (
                            <SidebarMenuSubItem key="Currencies">
                              <SidebarMenuButton
                                asChild
                                isActive={
                                  location.pathname === getAllCurrenciesRoute() ||
                                  location.pathname.startsWith(`${getAllCurrenciesRoute()}/`)
                                }
                              >
                                <Link to={getAllCurrenciesRoute()} onClick={handleMenuItemClick}>
                                  <Coins className="w-4 h-4" />
                                  <span>Currencies</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuSubItem>
                          )}
                        </SidebarMenu>
                      </SidebarGroupContent>
                      {shouldShowSection(['Audit Logs'], [canManageAudit]) && (
                        <SidebarGroupLabel>Others</SidebarGroupLabel>
                      )}
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {canManageAudit && shouldShowMenuItem('Audit Logs') && (
                            <SidebarMenuSubItem key="AuditLogs">
                              <SidebarMenuButton
                                asChild
                                isActive={
                                  location.pathname === getAllAuditLogsRoute() ||
                                  location.pathname.startsWith(`${getAllAuditLogsRoute()}/`)
                                }
                              >
                                <Link to={getAllAuditLogsRoute()} onClick={handleMenuItemClick}>
                                  <FileSearch className="w-4 h-4" />
                                  <span>Audit Logs</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuSubItem>
                          )}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <Separator />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="w-full justify-between hover:bg-accent min-h-12">
              <div className="flex items-center gap-2 min-w-0">
                <User className="w-4 h-4 flex-shrink-0" />
                <div className="flex flex-col items-start text-left min-w-0">
                  <span className="text-sm font-medium truncate max-w-full">
                    {getUserDisplayName(user, userEmail, userFirstName, userLastName)}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-full">
                    {userEmail || 'user@example.com'}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-56 mb-2" sideOffset={4}>
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">
                {getUserDisplayName(user, userEmail, userFirstName, userLastName)}
              </p>
              <p className="text-xs text-muted-foreground">{userEmail || 'user@example.com'}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="text-destructive" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
