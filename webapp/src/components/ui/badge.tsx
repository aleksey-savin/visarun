import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-sm border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-xs',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        primary: 'border-transparent bg-purple-900 text-[#FAFAFA] [a&]:hover:bg-purple-900/90',
        secondary: 'border-transparent bg-muted text-[#FAFAFA] [a&]:hover:bg-emerald-900/90',
        warning: 'border-transparent bg-amber-600 text-[#FAFAFA] [a&]:hover:bg-amber-600/90',
        info: 'border-transparent bg-emerald-600 text-[#FAFAFA] [a&]:hover:bg-emerald-600/90',
        destructive:
          'border-transparent bg-[#F87171] text-secondary [a&]:hover:bg-[#F87171]/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
        accent:
          'border-transparent bg-[#172554] text-foreground [a&]:hover:bg-[#172554]/90 text-[#FAFAFA]',
        outline:
          'border-transparent text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
