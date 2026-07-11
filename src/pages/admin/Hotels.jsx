import { useEffect, useState } from 'react';
import { Plus, MapPin, Pencil, Trash2 } from 'lucide-react';

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
import { FullPageSpinner } from '@/components/Spinner';

const EMPTY = { hotelName: '', hotelAddress: '', hotelMapLink: '' };

export default function Hotels() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      const { data } = await api.get('/hotels');
      setHotels(data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setError('');
    setOpen(true);
  }

  function openEdit(hotel) {
    setEditing(hotel);
    setForm({
      hotelName: hotel.hotelName || '',
      hotelAddress: hotel.hotelAddress || '',
      hotelMapLink: hotel.hotelMapLink || '',
    });
    setError('');
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api.put(`/hotels/${editing.id}`, form);
      } else {
        await api.post('/hotels', form);
      }
      setOpen(false);
      setForm(EMPTY);
      setEditing(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this hotel?')) return;
    try {
      await api.delete(`/hotels/${id}`);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (loading) return <FullPageSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hotels</h1>
          <p className="text-muted-foreground">
            Manage hotels to reuse when assigning accommodation.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Hotel
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {hotels.map((h) => (
          <Card key={h.id}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <CardTitle className="text-base">{h.hotelName}</CardTitle>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => openEdit(h)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => remove(h.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">{h.hotelAddress}</p>
              {h.hotelMapLink && (
                <a
                  href={h.hotelMapLink}
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
        {hotels.length === 0 && (
          <p className="text-muted-foreground">No hotels added yet.</p>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Hotel' : 'Add Hotel'}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Hotel Name</Label>
            <Input
              value={form.hotelName}
              onChange={(e) => setForm({ ...form, hotelName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Hotel Address</Label>
            <Input
              value={form.hotelAddress}
              onChange={(e) =>
                setForm({ ...form, hotelAddress: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Google Map Link</Label>
            <Input
              value={form.hotelMapLink}
              onChange={(e) =>
                setForm({ ...form, hotelMapLink: e.target.value })
              }
              placeholder="https://maps.google.com/..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save Hotel'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
