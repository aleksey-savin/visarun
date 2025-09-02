import { getIconPath } from '@/utils/icons';

interface IconDisplayProps {
  iconFilename?: string;
  iconType: 'transport-type' | 'transport-seat';
  alt?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fallback?: React.ReactNode;
}

export function IconDisplay({
  iconFilename,
  iconType,
  alt = 'Icon',
  className = '',
  size = 'md',
  fallback,
}: IconDisplayProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const iconPath = getIconPath(iconType, iconFilename);

  if (!iconPath || iconFilename === 'none') {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <img
      src={iconPath}
      alt={alt}
      className={`${sizeClasses[size]} ${className}`}
      onError={e => {
        // Hide image if it fails to load
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}
