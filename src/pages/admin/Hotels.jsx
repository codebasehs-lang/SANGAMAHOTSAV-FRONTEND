import { useEffect, useState } from 'react';
import { Plus, MapPin, Pencil, Trash2 } from 'lucide-react';

import api, { getErrorMessage } from '@/lib/api';
import { SHARED_ACCOMMODATION, FAMILY_ACCOMMODATION } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FullPageSpinner } from '@/components/Spinner';
import { useAuth } from '@/context/AuthContext';

const EMPTY = { hotelName: '', hotelAddress: '', hotelMapLink: '' };
const EMPTY_ROOM = {
  roomNo: '',
  roomType: 'DORMITORY',
  roomCapacity: 1,
  currentOccupancy: 0,
  isActive: true,
  notes: '',
};

const ROOM_TYPE_OPTIONS = [
  ...SHARED_ACCOMMODATION,
  ...FAMILY_ACCOMMODATION,
];

export default function Hotels() {
  const { isViewer } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [roomOpen, setRoomOpen] = useState(false);
  const [roomEditing, setRoomEditing] = useState(null);
  const [roomHotel, setRoomHotel] = useState(null);
  const [roomForm, setRoomForm] = useState(EMPTY_ROOM);
  const [roomSaving, setRoomSaving] = useState(false);

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

  function openCreateRoom(hotel) {
    setRoomHotel(hotel);
    setRoomEditing(null);
    setRoomForm(EMPTY_ROOM);
    setError('');
    setRoomOpen(true);
  }

  function openEditRoom(hotel, room) {
    setRoomHotel(hotel);
    setRoomEditing(room);
    setRoomForm({
      roomNo: room.roomNo || '',
      roomType: room.roomType || 'DORMITORY',
      roomCapacity: room.roomCapacity || 1,
      currentOccupancy: room.currentOccupancy || 0,
      isActive: Boolean(room.isActive),
      notes: room.notes || '',
    });
    setError('');
    setRoomOpen(true);
  }

  async function saveRoom() {
    if (!roomHotel) return;
    setRoomSaving(true);
    setError('');
    try {
      const payload = {
        ...roomForm,
        roomCapacity: Number(roomForm.roomCapacity || 1),
        currentOccupancy: Number(roomForm.currentOccupancy || 0),
      };

      if (roomEditing) {
        await api.put(`/hotels/${roomHotel.id}/rooms/${roomEditing.id}`, payload);
      } else {
        await api.post(`/hotels/${roomHotel.id}/rooms`, payload);
      }

      setRoomOpen(false);
      setRoomEditing(null);
      setRoomHotel(null);
      setRoomForm(EMPTY_ROOM);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRoomSaving(false);
    }
  }

  async function removeRoom(hotelId, roomId) {
    if (!window.confirm('Delete this room?')) return;
    try {
      await api.delete(`/hotels/${hotelId}/rooms/${roomId}`);
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
        {!isViewer && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Hotel
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {hotels.map((h) => (
          <Card key={h.id}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{h.hotelName}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Rooms: {h.rooms?.length || 0}
                </p>
              </div>
              <div className="flex gap-1">
                {!isViewer && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => openCreateRoom(h)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(h)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => remove(h.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
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

              <div className="mt-3 rounded-md border">
                <div className="grid grid-cols-[1fr_1fr_4rem_4rem_auto] gap-2 border-b bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
                  <span>Room No</span>
                  <span>Type</span>
                  <span>Cap.</span>
                  <span>Occ.</span>
                  <span className="text-right">Actions</span>
                </div>
                <div className="divide-y">
                  {(h.rooms || []).map((room) => (
                    <div
                      key={room.id}
                      className="grid grid-cols-[1fr_1fr_4rem_4rem_auto] items-center gap-2 px-3 py-2 text-xs"
                    >
                      <span className="font-medium">{room.roomNo}</span>
                      <span>{ROOM_TYPE_OPTIONS.find((r) => r.value === room.roomType)?.label || room.roomType}</span>
                      <span>{room.roomCapacity}</span>
                      <span className={room.currentOccupancy > room.roomCapacity ? 'text-amber-700 font-semibold' : ''}>
                        {room.currentOccupancy}
                      </span>
                      <div className="flex justify-end gap-1">
                        {!room.isActive && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            Inactive
                          </span>
                        )}
                        {!isViewer && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => openEditRoom(h, room)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => removeRoom(h.id, room.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {(h.rooms || []).length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      No rooms added yet.
                    </div>
                  )}
                </div>
              </div>
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

      <Modal
        open={roomOpen}
        onClose={() => setRoomOpen(false)}
        title={roomEditing ? `Edit Room — ${roomHotel?.hotelName || ''}` : `Add Room — ${roomHotel?.hotelName || ''}`}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Room Number</Label>
            <Input
              value={roomForm.roomNo}
              onChange={(e) => setRoomForm({ ...roomForm, roomNo: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Room Type</Label>
            <Select
              options={ROOM_TYPE_OPTIONS}
              value={roomForm.roomType}
              onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Room Capacity</Label>
              <Input
                type="number"
                min={1}
                value={roomForm.roomCapacity}
                onChange={(e) => setRoomForm({ ...roomForm, roomCapacity: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Current Occupancy</Label>
              <Input
                type="number"
                min={0}
                value={roomForm.currentOccupancy}
                onChange={(e) => setRoomForm({ ...roomForm, currentOccupancy: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input
              value={roomForm.notes}
              onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={roomForm.isActive}
              onChange={(e) => setRoomForm({ ...roomForm, isActive: e.target.checked })}
            />
            Room is active for assignment
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRoomOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRoom} disabled={roomSaving}>
              {roomSaving ? 'Saving...' : 'Save Room'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
