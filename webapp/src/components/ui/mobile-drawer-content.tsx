import * as React from 'react';
import { DrawerContent } from './drawer';
import { cn } from '@/lib/utils';

interface MobileDrawerContentProps extends React.ComponentProps<typeof DrawerContent> {
  children: React.ReactNode;
}

export function MobileDrawerContent({ className, children, ...props }: MobileDrawerContentProps) {
  const [viewportHeight, setViewportHeight] = React.useState('100vh');

  React.useEffect(() => {
    const updateViewportHeight = () => {
      // Use the visual viewport API if available for better mobile support
      if (window.visualViewport) {
        setViewportHeight(`${window.visualViewport.height}px`);
      } else {
        setViewportHeight(`${window.innerHeight}px`);
      }
    };

    // Set initial height
    updateViewportHeight();

    // Listen for viewport changes (keyboard open/close)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);
    } else {
      window.addEventListener('resize', updateViewportHeight);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
        window.visualViewport.removeEventListener('scroll', updateViewportHeight);
      } else {
        window.removeEventListener('resize', updateViewportHeight);
      }
    };
  }, []);

  return (
    <DrawerContent
      className={cn('overflow-hidden', className)}
      style={{
        maxHeight: viewportHeight,
      }}
      {...props}
    >
      <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 'inherit' }}>
        {children}
      </div>
    </DrawerContent>
  );
}
