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
} from 'lucide-react';

interface PageConfig {
  title: string;
  icon: React.ReactNode;
  entity?: string;
  createRoute?: string;
  buttonText?: string;
  showButton?: boolean;
}

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
    showButton: false,
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

  const handleButtonClick = () => {
    if (onButtonClick) {
      onButtonClick();
    } else if (['/dashboard', '/orders'].includes(location.pathname) && config.entity === 'order') {
      // Special handling for dashboard order creation
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
          <span className="font-semibold">{config.title}</span>
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

      {['/dashboard', '/orders'].includes(location.pathname) && (
        <ClientSearchModal isOpen={isClientSearchOpen} onOpenChange={setIsClientSearchOpen} />
      )}
    </>
  );
}
