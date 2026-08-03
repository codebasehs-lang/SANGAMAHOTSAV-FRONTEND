import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api, { getErrorMessage, tokenStore } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-primary">Registrant Login</CardTitle>
          <CardDescription>
            Sign in with your mobile number and your password. For first-time login, use your phone number followed by # and your age.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Mobile Number</Label>
              <Input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 rounded" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              Remember Me
            </label>
            <Button type="submit" variant="success" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Need help? Return to <Link to="/" className="text-primary">home</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
