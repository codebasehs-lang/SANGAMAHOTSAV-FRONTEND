import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, LayoutDashboard, Users } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EVENT_INFO } from '@/lib/constants';

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
  const [showPassword, setShowPassword] = useState(false);

  // Read once at mount — parsing inside render causes a new object each cycle
  const rememberedLogin = useState(() =>
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('sangam_admin_credentials') || 'null')
      : null
  )[0];

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-200 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-2xl shadow-indigo-200/50 backdrop-blur-xl lg:grid-cols-2">
        {/* Brand / hero panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-10 text-white lg:flex">
          {/* Decorative glows */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-400/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-72 w-72 rounded-full bg-slate-400/20 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/40 bg-white/10 shadow-lg">
              <LayoutDashboard className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-100">Admin Console</p>
              <p className="font-serif text-xl font-semibold">{EVENT_INFO.title}</p>
            </div>
          </div>

          <div className="relative space-y-6">
            <h1 className="font-serif text-4xl font-bold leading-tight">
              Manage the Event
              <br />
              With Full Control
            </h1>
            <p className="max-w-sm text-indigo-50/90">
              Sign in to manage registrations, accommodation, seminar halls, payments, and communications from one dashboard.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm text-indigo-50">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                  <Users className="h-4 w-4" />
                </span>
                Registrations &amp; accommodation management
              </div>
              <div className="flex items-center gap-3 text-sm text-indigo-50">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                Role-based secure access
              </div>
            </div>
          </div>

          <div className="relative flex items-center gap-2 text-xs text-indigo-100/80">
            <ShieldCheck className="h-4 w-4" />
            Secure admin sign-in · Hare Krishna 🙏
          </div>
        </div>

        {/* Form panel */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            {/* Mobile-only brand header */}
            <div className="mb-6 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 p-4 text-white shadow-lg shadow-indigo-200/60 lg:hidden">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white/50 bg-white/10 shadow-md">
                <LayoutDashboard className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-indigo-100">Admin Console</p>
                <p className="truncate font-serif text-lg font-semibold leading-tight">{EVENT_INFO.title}</p>
                <p className="mt-0.5 text-[11px] text-indigo-100/90">Secure admin sign-in · Hare Krishna 🙏</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="font-serif text-2xl font-bold text-slate-900 sm:text-3xl">Admin Login</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in with your registered email and password to access the admin dashboard.
              </p>
            </div>

            {serverError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-slate-900">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-600" />
                  <Input
                    type="email"
                    className="h-11 border-indigo-200 pl-10 focus-visible:ring-indigo-500"
                    placeholder="Enter your email"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-900">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-600" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    className="h-11 border-indigo-200 px-10 focus-visible:ring-indigo-500"
                    placeholder="Enter your password"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 transition-colors hover:text-indigo-800"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-900">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-indigo-300 text-indigo-600 accent-indigo-600 focus:ring-indigo-500"
                  {...register('rememberMe')}
                />
                Remember Me
              </label>

              <Button
                type="submit"
                className="h-11 w-full bg-gradient-to-r from-slate-800 to-indigo-700 text-base font-semibold shadow-lg shadow-indigo-200/60 transition-all hover:from-slate-900 hover:to-indigo-800 hover:shadow-indigo-300/60"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Need help? Return to{' '}
              <Link to="/" className="font-medium text-indigo-700 underline-offset-4 hover:underline">
                home
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
