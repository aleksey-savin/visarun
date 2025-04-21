import { Users, CircleDollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

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
import { getAllUsersRoute, getCurrencyExchangeRoute } from '@/lib/routes';

// Menu items.

export function AppSidebar() {
  const { userRole } = useAuth();
  const items = [
    /* {
      title: 'Dashboard',
      url: getDashboardRoute(),
      icon: LayoutDashboardIcon,
    }, */
    {
      title: 'Currency Exchange',
      url: getCurrencyExchangeRoute(),
      icon: CircleDollarSign,
    },
    // Only show Users menu item if user is an admin
    ...(userRole === 'admin'
      ? [
          {
            title: 'Users',
            url: getAllUsersRoute(),
            icon: Users,
          },
        ]
      : []),
  ];
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex justify-between pt-10">
            <div className="text-3xl font-medium">Visarun</div>
          </SidebarGroupLabel>
          <SidebarGroupContent className="pt-10">
            <SidebarMenu>
              {items.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
