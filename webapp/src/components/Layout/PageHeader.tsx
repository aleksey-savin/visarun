import { CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ClientSearchModal } from '@/components/Client/client-search-modal.js';
import { useAuth } from '@/lib/auth';
import { useSidebar } from '@/components/ui/sidebar';
import {
  UserPlus,
  Plus,
  Users,
  FileText,
  Globe,
  FileUser,
  CreditCard,
  MessageSquare,
  Shield,
  History,
  Gauge,
  Coins,
  Car,
  Bus,
  Armchair,
  ShoppingCart,
  Menu,
  FileSearch,
  CalendarCheck,
  ArrowRight,
} from 'lucide-react';

interface PageConfig {
  title: string;
  icon: React.ReactNode;
  entity?: string;
  createRoute?: string;
  buttonText?: string;
  showButton?: boolean;
}

const WheelIcon = () => {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
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

const pageConfigs: Record<string, PageConfig> = {
  '/dashboard': {
    title: 'Dashboard',
    icon: <Gauge />,
    entity: 'order',
    showButton: true,
  },
  '/orders': {
    title: 'Orders',
    icon: <ShoppingCart />,
    entity: 'order',
    showButton: true,
  },
  '/users': {
    title: 'Users',
    icon: <Users />,
    entity: 'user',
    createRoute: '/users/create',
    showButton: true,
  },
  '/roles': {
    title: 'Roles',
    icon: <Shield />,
    entity: 'role',
    createRoute: '/roles/create',
    showButton: true,
  },
  '/message-templates': {
    title: 'Message Templates',
    icon: <MessageSquare />,
    entity: 'message-template',
    createRoute: '/message-templates/create',
    showButton: true,
  },
  '/requirements': {
    title: 'Requirements',
    icon: <FileText />,
    entity: 'requirement',
    createRoute: '/requirements/create',
    showButton: true,
  },
  '/countries': {
    title: 'Countries',
    icon: <Globe />,
    entity: 'country',
    createRoute: '/countries/create',
    showButton: true,
  },
  '/currencies': {
    title: 'Currencies',
    icon: <Coins />,
    entity: 'currency',
    createRoute: '/currencies/create',
    showButton: true,
  },
  '/citizenships': {
    title: 'Citizenships',
    icon: <FileUser />,
    entity: 'citizenship',
    createRoute: '/citizenships/create',
    showButton: true,
  },
  '/visa-types': {
    title: 'Visa Types',
    icon: <FileUser />,
    entity: 'visa-type',
    createRoute: '/visa-types/create',
    showButton: true,
  },
  '/visa-citizenship-surcharges': {
    title: 'Visa Citizenship Surcharges',
    icon: <CreditCard />,
    entity: 'visa-citizenship-surcharge',
    createRoute: '/visa-citizenship-surcharges/create',
    showButton: true,
  },
  '/contact-methods': {
    title: 'Contact Methods',
    icon: <MessageSquare />,
    entity: 'contact-method',
    createRoute: '/contact-methods/create',
    showButton: true,
  },
  '/currency-exchange': {
    title: 'Currency Exchange',
    icon: <CreditCard />,
      entity: 'currency-exchange',
    showButton: true,
  },
  '/telegram-channels': {
    title: 'Telegram Channels',
    icon: <MessageSquare />,
    showButton: false,
  },
  '/audit-logs': {
    title: 'Audit Logs',
    icon: <History />,
    showButton: false,
  },

  '/transports': {
    title: 'Transports',
    icon: <Bus />,
    entity: 'transport',
    createRoute: '/transports/create',
    showButton: true,
  },
  '/transport-types': {
    title: 'Transport Types',
    icon: <Car />,
    entity: 'transport-type',
    createRoute: '/transport-types/create',
    showButton: true,
  },
  '/seat-classes': {
    title: 'Seat Classes',
    icon: <Armchair />,
    entity: 'seat-class',
    createRoute: '/seat-classes/create',
    showButton: true,
  },
  '/visa-applications': {
    title: 'Visa Applications',
    icon: <FileSearch />,
    entity: 'visa-application',
    createRoute: '',
    showButton: false,
  },
  '/transfers': {
    title: 'Transfers',
    icon: <WheelIcon />,
    entity: 'visarun-trip',
    createRoute: '',
    showButton: false,
  },
  '/visarun-schedules': {
    title: 'Visarun Schedules',
    icon: <CalendarCheck />,
    entity: 'visarun-schedule',
    createRoute: '/visarun-schedules/create',
    showButton: true,
  },
};

// Routes that should not show the PageHeader (they have their own custom headers like breadcrumbs)
const skipHeaderRoutes: string[] = [];

interface PageHeaderProps {
  onButtonClick?: () => void;
}

export function PageHeader({ onButtonClick }: PageHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);
  const { hasPermission } = useAuth();
  const { toggleSidebar } = useSidebar();

  // Check if current route should skip the header
  const shouldSkipHeader = skipHeaderRoutes.some(route => {
    if (route.includes(':id')) {
      // For dynamic routes like /order/edit/:id, check if pathname starts with the base
      const basePath = route.replace('/:id', '');
      return location.pathname.startsWith(basePath);
    }
    return location.pathname === route || location.pathname.startsWith(route + '/');
  });

  if (shouldSkipHeader) {
    return null;
  }

  // Find exact match first, then try to find a partial match for dynamic routes
  let config = pageConfigs[location.pathname];

  if (!config) {
    // Try to find a match for routes like /users/view/123, /countries/edit/456, etc.
    const pathSegments = location.pathname.split('/');
    if (pathSegments.length >= 2) {
      const basePath = `/${pathSegments[1]}`;
      config = pageConfigs[basePath];

      // For view/edit pages, hide the add button
      if (
        config &&
        (pathSegments.includes('view') ||
          pathSegments.includes('edit') ||
          pathSegments.includes('create'))
      ) {
        config = { ...config, showButton: false };
      }
    }
  }

  // If no config found, don't render anything
  if (!config) {
    return null;
  }

  // Get path info for edit/view pages
  const getPathInfo = () => {
    const pathSegments = location.pathname.split('/');
    if (pathSegments.length >= 3) {
      const action = pathSegments[2]; // 'edit', 'view', 'create'

      if (action === 'edit' || action === 'view' || action === 'create') {
        return {
          action: action.charAt(0).toUpperCase() + action.slice(1),
        };
      }
    }
    return null;
  };

  const pathInfo = getPathInfo();

  const handleButtonClick = () => {
    if (onButtonClick) {
      onButtonClick();
    } else if (['/dashboard', '/orders'].includes(location.pathname) && config.entity === 'order') {
      // Special handling for dashboard order creation
      setIsClientSearchOpen(true);
    } else if (['/currency-exchange'].includes(location.pathname) && config.entity === 'currency-exchange') {
        // Special handling for dashboard currency exchange creation
        setIsClientSearchOpen(true);
    } else if (config.createRoute) {
      navigate(config.createRoute);
    }
  };

  const getButtonText = () => {
    if (config.buttonText) {
      return config.buttonText;
    }
    if (config.entity) {
      const entityName = config.entity
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return `${entityName}`;
    }
    return 'Create';
  };

  // Check permissions for dashboard order creation
  const canCreateOrders = hasPermission('orders.create');
  const shouldShowButton =
    config.showButton && (['/dashboard', '/orders'].includes(location.pathname) || canCreateOrders);

  return (
    <>
      <CardTitle className="px-4 sticky top-0 z-10 bg-background border-b flex items-center py-1.5 md:px-6 justify-between gap-2 h-[50px] md:mb-0">
        <div className="flex gap-3 items-center">
          <Button variant="primary" onClick={toggleSidebar} className="block md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
          {config.icon}
          {pathInfo ? (
            <button
              onClick={() => {
                const basePath = location.pathname.split('/')[1];
                navigate(`/${basePath}`);
              }}
              className="font-semibold hover:text-primary transition-colors cursor-pointer"
            >
              {config.title}
            </button>
          ) : (
            <span className="font-semibold">{config.title}</span>
          )}
          {pathInfo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowRight className="h-4 w-4" />
              <span className="text-primary font-medium">{pathInfo.action}</span>
            </div>
          )}
        </div>
        {shouldShowButton && (
          <Button size="sm" onClick={handleButtonClick} className={`relative whitespace-nowrap `}>
            {getButtonText()}
            {config.buttonText === 'Client' ? (
              <UserPlus className="ml-1 h-4 w-4" />
            ) : (
              <Plus className="ml-1 h-4 w-4" />
            )}
          </Button>
        )}
      </CardTitle>

      {['/dashboard', '/orders', '/currency-exchange'].includes(location.pathname) && (
        <ClientSearchModal isOpen={isClientSearchOpen} onOpenChange={setIsClientSearchOpen} />
      )}
    </>
  );
}
