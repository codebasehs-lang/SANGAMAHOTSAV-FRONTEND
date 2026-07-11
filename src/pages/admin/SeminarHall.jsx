import { useEffect, useState } from 'react';
import { Plus, CheckCircle2, MapPin } from 'lucide-react';

import api, { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FullPageSpinner } from '@/components/Spinner';

const EMPTY = { hallName: '', hallAddress: '', hallMapLink: '' };

export default function SeminarHall() {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      const { data } = await api.get('/seminar-halls');
      setHalls(data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setSaving(true);
    setError('');
    try {
      await api.post('/seminar-halls', { ...form, isActive: true });
      setOpen(false);
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function activate(id) {
    await api.patch(`/seminar-halls/${id}/activate`);
    load();
  }

  if (loading) return <FullPageSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Seminar Hall Configuration</h1>
          <p className="text-muted-foreground">
            Only one hall can be active at a time.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add Hall
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {halls.map((h) => (
          <Card key={h.id}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <CardTitle className="text-base">{h.hallName}</CardTitle>
              {h.isActive ? (
                <Badge variant="success">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                </Badge>
              ) : (
                <Button size="sm" variant="outline" onClick={() => activate(h.id)}>
                  Activate
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">{h.hallAddress}</p>
              {h.hallMapLink && (
                <a
                  href={h.hallMapLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <MapPin className="h-4 w-4" /> View on Map
                </a>
              )}
            </CardContent>
          </Card>
        ))}
        {halls.length === 0 && (
          <p className="text-muted-foreground">No seminar halls configured yet.</p>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Seminar Hall">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Hall Name</Label>
            <Input
              value={form.hallName}
              onChange={(e) => setForm({ ...form, hallName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Hall Address</Label>
            <Input
              value={form.hallAddress}
              onChange={(e) => setForm({ ...form, hallAddress: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Google Map Link</Label>
            <Input
              value={form.hallMapLink}
              onChange={(e) => setForm({ ...form, hallMapLink: e.target.value })}
              placeholder="https://maps.google.com/..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={create} disabled={saving}>
              {saving ? 'Saving...' : 'Save & Activate'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
