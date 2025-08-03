import { MessageCircle, Mail, Phone } from 'lucide-react';

interface ContactMethodIconProps {
  method: {
    name: string;
    icon?: string | null;
  };
  className?: string;
  fallbackClassName?: string;
}

export const ContactMethodIcon = ({
  method,
  className = 'w-4 h-4',
  fallbackClassName,
}: ContactMethodIconProps) => {
  // If we have a custom SVG icon from the database, use it
  if (method.icon) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        dangerouslySetInnerHTML={{ __html: method.icon }}
      />
    );
  }

  // Fallback to hardcoded icons for backward compatibility
  const iconClass = fallbackClassName || className;

  switch (method.name.toLowerCase()) {
    case 'email':
      return <Mail className={`${iconClass} text-blue-600`} />;
    case 'phone':
      return <Phone className={`${iconClass} text-green-600`} />;
    case 'telegram':
    case 'whatsapp':
    case 'viber':
    case 'line':
    case 'wechat':
    case 'skype':
    case 'zalo':
      return <MessageCircle className={`${iconClass} text-purple-600`} />;
    default:
      return <MessageCircle className={`${iconClass} text-gray-600`} />;
  }
};

export default ContactMethodIcon;
