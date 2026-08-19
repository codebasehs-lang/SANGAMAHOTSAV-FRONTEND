import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Phone, MapPin, CalendarDays, ShieldCheck } from 'lucide-react';
import api, { getErrorMessage, tokenStore } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EVENT_INFO } from '@/lib/constants';

export default function RegistrantLogin() {
  const navigate = useNavigate();
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('registrant_remember') || 'false');
    } catch {
      return false;
    }
  });

  // Prefill mobile if remembered
  useEffect(() => {
    if (rememberMe) {
      const stored = localStorage.getItem('registrant_mobile');
      if (stored) setMobileNumber(stored);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/registrant-auth/login', {
        mobileNumber,
        password,
      });

      tokenStore.set(data.data.token, true);
      if (rememberMe) {
        localStorage.setItem('registrant_mobile', mobileNumber);
        localStorage.setItem('registrant_remember', 'true');
      } else {
        localStorage.removeItem('registrant_mobile');
        localStorage.setItem('registrant_remember', 'false');
      }
      navigate('/registrant/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-2xl shadow-emerald-200/50 backdrop-blur-xl lg:grid-cols-2">
        {/* Brand / hero panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 p-10 text-white lg:flex">
          {/* Decorative glows */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-72 w-72 rounded-full bg-teal-300/25 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <img
              src="/images/Gurudeva.jpg"
              alt="Sri Gurudeva"
              className="h-14 w-14 rounded-full border-2 border-white/40 object-cover object-top shadow-lg"
            />
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-100">Welcome to</p>
              <p className="font-serif text-xl font-semibold">{EVENT_INFO.title}</p>
            </div>
          </div>

          <div className="relative space-y-6">
            <h1 className="font-serif text-4xl font-bold leading-tight">
              Your Devotee
              <br />
              Dashboard Awaits
            </h1>
            <p className="max-w-sm text-emerald-50/90">
              Sign in to manage your registration, accommodation, services, payments, and event check-in QR — all in one place.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm text-emerald-50">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                  <CalendarDays className="h-4 w-4" />
                </span>
                {EVENT_INFO.startDate} – {EVENT_INFO.endDate}
              </div>
              <div className="flex items-center gap-3 text-sm text-emerald-50">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                  <MapPin className="h-4 w-4" />
                </span>
                {EVENT_INFO.venue}
              </div>
            </div>
          </div>

          <div className="relative flex items-center gap-2 text-xs text-emerald-100/80">
            <ShieldCheck className="h-4 w-4" />
            Secure devotee sign-in · Hare Krishna 🙏
          </div>
        </div>

        {/* Form panel */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            {/* Mobile-only brand header */}
            <div className="mb-6 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-600 p-4 text-white shadow-lg shadow-emerald-200/60 lg:hidden">
              <img
                src="/images/Gurudeva.jpg"
                alt="Sri Gurudeva"
                className="h-14 w-14 shrink-0 rounded-full border-2 border-white/50 object-cover object-top shadow-md"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-100">Welcome to</p>
                <p className="truncate font-serif text-lg font-semibold leading-tight">{EVENT_INFO.title}</p>
                <p className="mt-0.5 text-[11px] text-emerald-100/90">Devotee sign-in · Hare Krishna 🙏</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="font-serif text-2xl font-bold text-emerald-900 sm:text-3xl">Devotee Login</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in with your mobile number and password. First time? Use your phone number followed by
                <span className="font-semibold text-emerald-700"> #</span> and your age.
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-emerald-900">Mobile Number</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
                  <Input
                    className="h-11 border-emerald-200 pl-10 focus-visible:ring-emerald-500"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="Enter your mobile number"
                    inputMode="numeric"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-emerald-900">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    className="h-11 border-emerald-200 px-10 focus-visible:ring-emerald-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 transition-colors hover:text-emerald-800"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-emerald-900">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-emerald-300 text-emerald-600 accent-emerald-600 focus:ring-emerald-500"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember Me
              </label>

              <Button
                type="submit"
                className="h-11 w-full bg-gradient-to-r from-emerald-700 to-teal-600 text-base font-semibold shadow-lg shadow-emerald-200/60 transition-all hover:from-emerald-800 hover:to-teal-700 hover:shadow-emerald-300/60"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Need help? Return to{' '}
              <Link to="/" className="font-medium text-emerald-700 underline-offset-4 hover:underline">
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
