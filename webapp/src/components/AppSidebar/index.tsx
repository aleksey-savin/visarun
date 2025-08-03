import { useState } from 'react';
import {
  Users,
  CircleDollarSign,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Send,
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
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '@/lib/auth';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

import {
  getAllRolesRoute,
  getAllUsersRoute,
  getCurrencyExchangeRoute,
  getTelegramChannelsRoute,
  getAllContactMethodsRoute,
  getAllRequirementsRoute,
  // New entity routes
  getAllCountriesRoute,
  getAllCitizenshipsRoute,
  getAllVisaTypesRoute,
  getAllVisaCitizenshipSurchargesRoute,
  getMessageTemplatesRoute,
  getAllAuditLogsRoute,
  getDashboardRoute,
  getAllOrdersRoute,
} from '@/lib/routes';

export function AppSidebar() {
  const { hasPermission } = useAuth();
  const location = useLocation();
  const [isTelegramOpen, setTelegramOpen] = useState(false);

  // Проверяем, находимся ли мы в одном из вложенных маршрутов Telegram
  const isOnTelegramSubpage =
    location.pathname === getTelegramChannelsRoute() ||
    location.pathname.startsWith(`${getTelegramChannelsRoute()}/`);
  //location.pathname === getTelegramTemplatesRoute() ||
  //location.pathname.startsWith(`${getTelegramTemplatesRoute()}/`);
  //
  const [isUsersManagementOpen, setUsersManagementOpen] = useState(false);
  const [isVisaManagementOpen, setVisaManagementOpen] = useState(false);

  const isOnUsersManagementSubpage =
    location.pathname === getAllUsersRoute() || location.pathname === getAllRolesRoute();

  const isOnVisaManagementSubpage =
    location.pathname === getAllCountriesRoute() ||
    location.pathname.startsWith(`${getAllCountriesRoute()}/`) ||
    location.pathname === getAllCitizenshipsRoute() ||
    location.pathname.startsWith(`${getAllCitizenshipsRoute()}/`) ||
    location.pathname === getAllVisaTypesRoute() ||
    location.pathname.startsWith(`${getAllVisaTypesRoute()}/`) ||
    location.pathname === getAllVisaCitizenshipSurchargesRoute() ||
    location.pathname.startsWith(`${getAllVisaCitizenshipSurchargesRoute()}/`);

  // Permission checks
  const canAccessExchangeRates = hasPermission('exchangeRates.create');
  const canReadUsers = hasPermission('users.read');
  const canReadRoles = hasPermission('roles.read');
  const canReadTelegram = hasPermission('telegram.channels.read');
  const canManageContactMethods = hasPermission('global.fullAccess');

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

  const canManageAudit = hasPermission('audit.manage');
  const canReadOrders =
    hasPermission('orders.read') ||
    hasPermission('orders.create') ||
    hasPermission('orders.update') ||
    hasPermission('orders.delete');

  // Check if user has any admin permissions
  const hasAnyAdminPermission =
    canReadUsers ||
    canReadRoles ||
    canReadTelegram ||
    canManageContactMethods ||
    canReadRequirements ||
    canManageAudit ||
    canReadOrders;

  // Check if user has any visa management permissions
  const hasAnyVisaPermission =
    canReadCountries || canReadCitizenships || canReadVisaTypes || canReadVisaCitizenshipSurcharges;

  return (
    <Sidebar collapsible="none" className="bg-secondary border rounded-l-xl h-full">
      <SidebarHeader className="border-b flex py-2.5 px-6 justify-between gap-2">
        <div className="flex gap-2 items-center justify-center">
          <span className="font-semibold">Visarun Vietnam</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem key="Dashboard">
                <SidebarMenuButton
                  asChild
                  isActive={
                    location.pathname === getDashboardRoute() ||
                    location.pathname.startsWith(`${getDashboardRoute()}/`)
                  }
                >
                  <Link to={getDashboardRoute()} className="flex items-center gap-2">
                    <Gauge />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {canAccessExchangeRates && (
                <SidebarMenuItem key="Currency Exchange">
                  <SidebarMenuButton
                    asChild
                    isActive={
                      location.pathname === getCurrencyExchangeRoute() ||
                      location.pathname.startsWith(`${getCurrencyExchangeRoute()}/`)
                    }
                  >
                    <Link to={getCurrencyExchangeRoute()} className="flex items-center gap-2">
                      <CircleDollarSign className="w-5 h-5" />
                      <span>Currency Exchange</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {hasAnyAdminPermission && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* User management (коллапсируемый пункт без ссылки) */}
                {(canReadUsers || canReadRoles) && (
                  <SidebarMenuItem key="UsersManagement">
                    <SidebarMenuButton
                      onClick={() => setUsersManagementOpen(prev => !prev)}
                      isActive={isOnUsersManagementSubpage}
                      className="flex items-center justify-between px-2"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        <span>User Management</span>
                      </div>
                      {isUsersManagementOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </SidebarMenuButton>

                    {/* Вложенные пункты, показываются только при isTelegramOpen */}
                    {isUsersManagementOpen && (
                      <SidebarMenuSub>
                        {canReadUsers && (
                          <SidebarMenuSubItem key="Users">
                            <SidebarMenuButton
                              asChild
                              isActive={
                                location.pathname === getAllUsersRoute() ||
                                location.pathname.startsWith(`${getAllUsersRoute()}/`)
                              }
                            >
                              <Link to={getAllUsersRoute()}>
                                <User className="w-4 h-4" />
                                <span>Users</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuSubItem>
                        )}
                        {canReadRoles && (
                          <SidebarMenuItem key="Roles">
                            <SidebarMenuButton
                              asChild
                              isActive={
                                location.pathname === getAllRolesRoute() ||
                                location.pathname.startsWith(`${getAllRolesRoute()}/`)
                              }
                            >
                              <Link to={getAllRolesRoute()}>
                                <Shield className="w-4 h-4" />
                                <span>Roles</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                )}

                {hasAnyVisaPermission && (
                  <SidebarMenu>
                    <SidebarMenuItem key="VisaManagement">
                      <SidebarMenuButton
                        onClick={() => setVisaManagementOpen(prev => !prev)}
                        isActive={isOnVisaManagementSubpage}
                        className="flex items-center justify-between px-2"
                      >
                        <div className="flex items-center gap-2">
                          <Globe className="w-5 h-5" />
                          <span>Visa Management</span>
                        </div>
                        {isVisaManagementOpen ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </SidebarMenuButton>

                      {/* Nested visa management items */}
                      {isVisaManagementOpen && (
                        <SidebarMenuSub>
                          {canReadVisaTypes && (
                            <SidebarMenuSubItem key="VisaTypes">
                              <SidebarMenuButton
                                asChild
                                isActive={
                                  location.pathname === getAllVisaTypesRoute() ||
                                  location.pathname.startsWith(`${getAllVisaTypesRoute()}/`)
                                }
                              >
                                <Link to={getAllVisaTypesRoute()}>
                                  <FileText className="w-4 h-4" />
                                  <span>Visa Types</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuSubItem>
                          )}
                          {canReadVisaCitizenshipSurcharges && (
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
                                <Link to={getAllVisaCitizenshipSurchargesRoute()}>
                                  <DollarSign className="w-4 h-4" />
                                  <span>Visa Surcharges</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuSubItem>
                          )}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  </SidebarMenu>
                )}

                {/* Telegram (коллапсируемый пункт без ссылки) */}
                {canReadTelegram && (
                  <SidebarMenuItem key="Telegram">
                    <SidebarMenuButton
                      onClick={() => setTelegramOpen(prev => !prev)}
                      isActive={isOnTelegramSubpage}
                      className="flex items-center justify-between px-2"
                    >
                      <div className="flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        <span>Messengers</span>
                      </div>
                      {isTelegramOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </SidebarMenuButton>

                    {/* Вложенные пункты, показываются только при isTelegramOpen */}
                    {isTelegramOpen && (
                      <SidebarMenuSub>
                        {/* Channels & groups */}
                        <SidebarMenuSubItem key="Channels & groups">
                          <SidebarMenuButton
                            asChild
                            isActive={
                              location.pathname === getTelegramChannelsRoute() ||
                              location.pathname.startsWith(`${getTelegramChannelsRoute()}/`)
                            }
                          >
                            <Link to={getTelegramChannelsRoute()}>
                              <Hash className="w-4 h-4" />
                              <span>Telegram Channels &amp; Groups</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuSubItem>

                        {/* Message templates */}
                        <SidebarMenuSubItem key="Message templates">
                          <SidebarMenuButton
                            asChild
                            isActive={
                              location.pathname === getMessageTemplatesRoute() ||
                              location.pathname.startsWith(`${getMessageTemplatesRoute()}/`)
                            }
                          >
                            <Link to={getMessageTemplatesRoute()}>
                              <Mail className="w-4 h-4" />
                              <span>Message templates</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                )}

                {/* Contact Methods Management */}
                {canManageContactMethods && (
                  <SidebarMenuItem key="ContactMethods">
                    <SidebarMenuButton
                      asChild
                      isActive={
                        location.pathname === getAllContactMethodsRoute() ||
                        location.pathname.startsWith(`${getAllContactMethodsRoute()}/`)
                      }
                    >
                      <Link to={getAllContactMethodsRoute()}>
                        <MessageCircle className="w-5 h-5" />
                        <span>Contact Methods</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {canReadCountries && (
                  <SidebarMenuItem key="Countries">
                    <SidebarMenuButton
                      asChild
                      isActive={
                        location.pathname === getAllCountriesRoute() ||
                        location.pathname.startsWith(`${getAllCountriesRoute()}/`)
                      }
                    >
                      <Link to={getAllCountriesRoute()}>
                        <Globe className="w-4 h-4" />
                        <span>Countries</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {canReadCitizenships && (
                  <SidebarMenuItem key="Citizenships">
                    <SidebarMenuButton
                      asChild
                      isActive={
                        location.pathname === getAllCitizenshipsRoute() ||
                        location.pathname.startsWith(`${getAllCitizenshipsRoute()}/`)
                      }
                    >
                      <Link to={getAllCitizenshipsRoute()}>
                        <UserCheck className="w-4 h-4" />
                        <span>Citizenships</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {canReadRequirements && (
                  <SidebarMenuItem key="Requirements">
                    <SidebarMenuButton
                      asChild
                      isActive={
                        location.pathname === getAllRequirementsRoute() ||
                        location.pathname.startsWith(`${getAllRequirementsRoute()}/`)
                      }
                    >
                      <Link to={getAllRequirementsRoute()} className="flex items-center gap-2">
                        <ClipboardList className="w-5 h-5" />
                        <span>Requirements</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {canReadOrders && (
                  <SidebarMenuItem key="Orders">
                    <SidebarMenuButton
                      asChild
                      isActive={
                        location.pathname === getAllOrdersRoute() ||
                        location.pathname.startsWith(`${getAllOrdersRoute()}/`)
                      }
                    >
                      <Link to={getAllOrdersRoute()}>
                        <ShoppingCart className="w-4 h-4" />
                        <span>Orders</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {canManageAudit && (
                  <SidebarMenuItem key="AuditLogs">
                    <SidebarMenuButton
                      asChild
                      isActive={
                        location.pathname === getAllAuditLogsRoute() ||
                        location.pathname.startsWith(`${getAllAuditLogsRoute()}/`)
                      }
                    >
                      <Link to={getAllAuditLogsRoute()}>
                        <FileSearch className="w-4 h-4" />
                        <span>Audit Logs</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
