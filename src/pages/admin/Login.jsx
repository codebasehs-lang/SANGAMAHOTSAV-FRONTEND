import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');

  const rememberedLogin = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('sangam_admin_credentials') || 'null')
    : null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: rememberedLogin?.email || '',
      password: rememberedLogin?.password || '',
      rememberMe: rememberedLogin?.rememberMe || false,
    },
  });

  useEffect(() => {
    if (rememberedLogin) {
      reset(rememberedLogin);
    }
  }, [rememberedLogin, reset]);

  async function onSubmit(values) {
    setServerError('');
    try {
      await login(values.email, values.password, values.rememberMe);
      if (values.rememberMe) {
        localStorage.setItem(
          'sangam_admin_credentials',
          JSON.stringify({
            email: values.email,
            password: values.password,
            rememberMe: true,
          })
        );
      } else {
        localStorage.removeItem('sangam_admin_credentials');
      }
      const to = location.state?.from?.pathname || '/admin';
      navigate(to, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-primary">Sanga Mahotsav</CardTitle>
          <CardDescription>Admin Login</CardDescription>
        </CardHeader>
        <CardContent>
          {serverError && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" {...register('email')} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" {...register('password')} />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border border-slate-400 bg-white text-primary focus:ring-2 focus:ring-primary"
                {...register('rememberMe')}
              />
              Remember Me
            </label>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
