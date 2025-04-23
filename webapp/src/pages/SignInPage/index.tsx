import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpcProvider';
import { getDashboardRoute } from '@/lib/routes';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, { message: 'Password is required' }),
});

type FormData = z.infer<typeof formSchema>;

const SignInPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signInMutation = trpc.signin.useMutation();
  const { isAuthenticated, login, isAuthLoading } = useAuth();

  // Get the path they were trying to access, or default to dashboard
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || getDashboardRoute();

  // Effect to handle redirect after authentication is confirmed
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate, from]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Show loading state while checking authentication
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // We handle the redirect in useEffect now instead of here
  // This allows for a smoother experience and preserves the 'from' state

  async function onSubmit(values: FormData) {
    try {
      setIsSubmitting(true);
      setError(null);

      const result = await signInMutation.mutateAsync({
        email: values.email,
        password: values.password,
      });

      if (result) {
        // Store authentication state with tokens
        login(
          {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          },
          values.email,
          result.user.role,
          result.user.id
        );

        // Navigate to the original destination or dashboard
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred during sign in');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Visarun</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to sign in
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
              {error}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="example@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignInPage;
