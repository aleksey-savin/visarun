import { LayoutDashboardIcon, Users, CircleDollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

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
import { getAllUsersRoute, getCurrencyExchangeRoute, getDashboardRoute } from '@/lib/routes';

// Menu items.
const items = [
  {
    title: 'Dashboard',
    url: getDashboardRoute(),
    icon: LayoutDashboardIcon,
  },
  {
    title: 'Currency Exchange',
    url: getCurrencyExchangeRoute(),
    icon: CircleDollarSign,
  },
  {
    title: 'Users',
    url: getAllUsersRoute(),
    icon: Users,
  },
];

export function AppSidebar() {
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
