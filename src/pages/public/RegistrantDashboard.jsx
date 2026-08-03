import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { getErrorMessage, tokenStore } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, User, Home, CreditCard, MapPin } from 'lucide-react';
import { currency, formatDate } from '@/lib/utils';

export default function RegistrantDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const { data } = await api.get('/registrant-auth/me');
        setProfile(data.data);
      } catch (err) {
        setError(getErrorMessage(err));
        tokenStore.clear();
        navigate('/registrant/login', { replace: true });
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [navigate]);

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordLoading(true);

    try {
      await api.put('/registrant-auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMessage('Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPasswordMessage(getErrorMessage(err));
    } finally {
      setPasswordLoading(false);
    }
  }

  function handleLogout() {
    tokenStore.clear();
    navigate('/registrant/login', { replace: true });
  }

  if (loading) {
    return <div className="p-6 text-center">Loading your registration details...</div>;
  }

  if (error && !profile) {
    return <div className="p-6 text-center text-destructive">{error}</div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-500 shadow-lg shadow-emerald-200/50 flex items-center justify-center text-white ring-1 ring-emerald-100">
            <User className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-serif text-emerald-900">My Registration</h1>
            <p className="mt-1 text-sm text-emerald-700">Registration summary, accommodation and payments.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="success" onClick={() => window.print()}>Print</Button>
          <Button variant="success" onClick={handleLogout}>Logout</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Basic Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-xs">Name</p>
                <p className="font-medium">{profile?.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Initiated Name</p>
                <p className="font-medium">{profile?.initiatedName || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Age</p>
                <p className="font-medium">{profile?.age}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Category</p>
                <p className="font-medium">{profile?.devoteeCategory}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Mobile</p>
                <p className="font-medium">{profile?.mobileNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Coming From</p>
                <p className="font-medium">{profile?.comingFrom}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accommodation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground text-xs">Status</span>
              <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${profile?.accommodationStatus === 'ASSIGNED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {profile?.accommodationStatus}
              </span>
            </p>
            {profile?.assignment ? (
              <>
                <p className="text-sm"><strong>Hotel:</strong> {profile.assignment.hotelName}</p>
                <p className="text-sm"><strong>Room:</strong> {profile.assignment.roomNumber}</p>
                <p className="text-sm"><strong>Address:</strong> {profile.assignment.hotelAddress}</p>
                {profile.assignment.hotelMapLink && <a href={profile.assignment.hotelMapLink} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-2"><MapPin className="h-4 w-4"/>Open map</a>}
              </>
            ) : (
              <p className="text-sm">No accommodation assigned yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Selections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Services:</strong> {profile?.services?.length ? profile.services.join(', ') : '-'}</p>
            <p><strong>Donation Items:</strong> {profile?.donationItems?.length ? profile.donationItems.map((item) => item?.id || item?.label || JSON.stringify(item)).join(', ') : '-'}</p>
            <p><strong>Extra Charges:</strong> {profile?.extraCharges?.length ? profile.extraCharges.join(', ') : '-'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground text-xs">Status</span> <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${profile?.paymentStatus === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{profile?.paymentStatus}</span></p>
            <p className="mt-2"><strong>Amount Paid:</strong> {currency(profile?.amountPaid || 0)}</p>
            <p><strong>Reference:</strong> {profile?.paymentReferenceId || '-'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Current Password</Label>
                <div className="relative">
                  <Input type={showCurrent ? 'text' : 'password'} value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))} required />
                  <button type="button" aria-label={showCurrent ? 'Hide password' : 'Show password'} onClick={() => setShowCurrent((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <div className="relative">
                  <Input type={showNew ? 'text' : 'password'} value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} required />
                  <button type="button" aria-label={showNew ? 'Hide password' : 'Show password'} onClick={() => setShowNew((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {passwordMessage && <p className="text-sm text-muted-foreground">{passwordMessage}</p>}
              <Button type="submit" variant="success" disabled={passwordLoading}>
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="success" onClick={() => window.location.reload()}>Refresh</Button>
            {profile?.assignment?.hotelMapLink && (
              <a href={profile.assignment.hotelMapLink} target="_blank" rel="noreferrer" className="inline-block text-primary">Open hotel map</a>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
