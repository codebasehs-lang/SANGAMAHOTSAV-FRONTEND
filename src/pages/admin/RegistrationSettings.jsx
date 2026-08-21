import { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

import api, { getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/Spinner';

const DEFAULT_MESSAGE = 'Registrations are currently closed. Please check back later.';

export default function RegistrationSettings() {
  const { isViewer } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [closedMessage, setClosedMessage] = useState(DEFAULT_MESSAGE);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api
      .get('/registration-settings')
      .then(({ data }) => {
        setIsOpen(Boolean(data.data.isOpen));
        setClosedMessage(data.data.closedMessage || DEFAULT_MESSAGE);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.put('/registration-settings', {
        isOpen,
        closedMessage,
      });
      setIsOpen(Boolean(data.data.isOpen));
      setClosedMessage(data.data.closedMessage || DEFAULT_MESSAGE);
      setSuccess('Registration settings saved successfully.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registration Settings</h1>
        <p className="text-sm text-muted-foreground">
          Disable the public registration form and show a custom message to visitors.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-5 py-6">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Accept new registrations</p>
              <p className="text-sm text-muted-foreground">
                Turn this off to close the registration page. Visitors will see the message
                below instead of the form and won't be able to register.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isOpen}
              disabled={isViewer}
              onClick={() => setIsOpen((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                isOpen ? 'bg-green-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isOpen ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="closedMessage">Message shown when registrations are closed</Label>
            <Textarea
              id="closedMessage"
              rows={4}
              value={closedMessage}
              disabled={isViewer}
              onChange={(e) => setClosedMessage(e.target.value)}
              placeholder={DEFAULT_MESSAGE}
            />
          </div>

          {!isViewer && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
