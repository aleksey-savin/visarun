import { useState } from 'react';
import { Users, CircleDollarSign, MessageCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '@/lib/auth';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import {
  getAllUsersRoute,
  getCurrencyExchangeRoute,
  getTelegramChannelsRoute,
  //getTelegramTemplatesRoute,
} from '@/lib/routes';

export function AppSidebar() {
  const { userRole } = useAuth();
  const location = useLocation();
  const [isTelegramOpen, setTelegramOpen] = useState(false);

  // Проверяем, находимся ли мы в одном из вложенных маршрутов Telegram
  const isOnTelegramSubpage =
    location.pathname === getTelegramChannelsRoute() ||
    location.pathname.startsWith(`${getTelegramChannelsRoute()}/`);
  //location.pathname === getTelegramTemplatesRoute() ||
  //location.pathname.startsWith(`${getTelegramTemplatesRoute()}/`);

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex justify-between pt-10">
            <div className="text-2xl font-medium">Visarun Vietnam</div>
          </SidebarGroupLabel>

          <SidebarGroupContent className="pt-10">
            <SidebarMenu>
              {/* Currency Exchange */}
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

              {/* Users (только для admin) */}
              {userRole === 'admin' && (
                <SidebarMenuItem key="Users">
                  <SidebarMenuButton
                    asChild
                    isActive={
                      location.pathname === getAllUsersRoute() ||
                      location.pathname.startsWith(`${getAllUsersRoute()}/`)
                    }
                  >
                    <Link to={getAllUsersRoute()} className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      <span>Users</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Telegram (коллапсируемый пункт без ссылки) */}
              <SidebarMenuItem key="Telegram">
                <SidebarMenuButton
                  onClick={() => setTelegramOpen(prev => !prev)}
                  isActive={isOnTelegramSubpage}
                  className="flex items-center justify-between px-2"
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
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
                  <SidebarMenu className="pl-6 mt-2">
                    {/* Channels & groups */}
                    <SidebarMenuItem key="Channels & groups">
                      <SidebarMenuButton
                        asChild
                        isActive={
                          location.pathname === getTelegramChannelsRoute() ||
                          location.pathname.startsWith(`${getTelegramChannelsRoute()}/`)
                        }
                      >
                        <Link to={getTelegramChannelsRoute()} className="flex items-center gap-2">
                          <span>Telegram Channels &amp; Groups</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Message templates */}
                    <SidebarMenuItem key="Message templates">
                      <SidebarMenuButton
                        asChild
                        //isActive={
                        //  location.pathname === getTelegramTemplatesRoute() ||
                        // location.pathname.startsWith(`${getTelegramTemplatesRoute()}/`)
                        //}
                      >
                        <Link to={'.'} className="flex items-center gap-2">
                          <span>Message templates</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
