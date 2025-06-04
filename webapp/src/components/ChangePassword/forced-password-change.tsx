import { useState, useEffect } from 'react';
import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '@/lib/trpcProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Form schema for forced password change
const ForcedPasswordChangeSchema = z
  .object({
    email: z.string().email({ message: 'Invalid email address' }),
    newPassword: z.string().min(8, { message: 'Password must be at least 8 characters' }).max(100),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ForcedPasswordChangeFormValues = z.infer<typeof ForcedPasswordChangeSchema>;

interface ForcedPasswordChangeProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ForcedPasswordChange({
  isOpen,
  onOpenChange,
  onSuccess,
}: ForcedPasswordChangeProps) {
  // Prevent closing the dialog by pressing escape or clicking outside
  useEffect(() => {
    if (isOpen) {
      const originalOnKeyDown = document.onkeydown;
      document.onkeydown = e => {
        if (e.key === 'Escape') {
          e.preventDefault();
          return false;
        }
      };
      return () => {
        document.onkeydown = originalOnKeyDown;
      };
    }
  }, [isOpen]);
  const [formStatus, setFormStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({
    type: null,
    message: '',
  });

  const { user, logout } = useAuth();
  const isDefaultAdmin = user?.email === 'admin@admin.com';

  const forceChangePassword = trpc.forceChangePassword.useMutation({
    onSuccess: () => {
      setFormStatus({
        type: 'success',
        message: 'Password changed successfully! You will be logged out.',
      });

      // Force logout after successful password change
      setTimeout(() => {
        logout();
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    },
    onError: error => {
      setFormStatus({
        type: 'error',
        message: error.message || 'Failed to change password. Please try again.',
      });
    },
  });

  const form = useForm<ForcedPasswordChangeFormValues>({
    resolver: zodResolver(ForcedPasswordChangeSchema),
    defaultValues: {
      email: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: ForcedPasswordChangeFormValues) {
    setFormStatus({ type: null, message: '' });
    forceChangePassword.mutate({ email: data.email, newPassword: data.newPassword });
  }

  // Custom DialogContent without close button
  const DialogContentWithoutCloseButton = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
  >(({ className, children, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
          className
        )}
        {...props}
      >
        {children}
        {/* No close button here */}
      </DialogPrimitive.Content>
    </DialogPortal>
  ));
  DialogContentWithoutCloseButton.displayName = 'DialogContentWithoutCloseButton';

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        // Prevent dialog from being closed by the user
        if (isOpen && !open) {
          return;
        }
        onOpenChange(open);
      }}
    >
      <DialogContentWithoutCloseButton
        className="sm:max-w-md"
        onEscapeKeyDown={e => e.preventDefault()}
        onPointerDownOutside={e => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Change your password</DialogTitle>
          <DialogDescription>
            {isDefaultAdmin
              ? 'You are using the default admin account. For security reasons, you must change your email & password before continuing.'
              : 'Your email & password needs to be changed before you can continue.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {formStatus.type && (
              <Alert variant={formStatus.type === 'error' ? 'destructive' : 'default'}>
                <AlertDescription>{formStatus.message}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={forceChangePassword.isPending || formStatus.type === 'success'}
            >
              {forceChangePassword.isPending ? 'Updating data...' : 'Update user data'}
            </Button>
          </form>
        </Form>
      </DialogContentWithoutCloseButton>
    </Dialog>
  );
}
