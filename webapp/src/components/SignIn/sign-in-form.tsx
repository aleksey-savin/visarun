import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { getCurrencyExchangeRoute } from '@/lib/routes';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, { message: 'Password is required' }),
});

type FormData = z.infer<typeof formSchema>;

interface SignInFormProps {
  onSuccess?: () => void;
}

const SignInForm = ({ onSuccess }: SignInFormProps) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signInMutation = trpc.signin.useMutation();
  const { login } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

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
          result.user.roles && result.user.roles.length > 0 ? result.user.roles[0] : 'client',
          result.user.id,
          result.user.permissions || [],
          result.user.mustChangePassword || false
        );

        // Call the success callback if provided
        if (onSuccess) {
          onSuccess();
        }

        // Navigate to currency exchange page
        navigate(getCurrencyExchangeRoute(), { replace: true });
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
    <div className="space-y-4 py-2 px-1">
      <div className="text-center mb-4">
        <h2 className="text-xl font-semibold">Sign In</h2>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your account
        </p>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">{error}</div>
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
                  <Input placeholder="" {...field} />
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
    </div>
  );
};

export default SignInForm;
