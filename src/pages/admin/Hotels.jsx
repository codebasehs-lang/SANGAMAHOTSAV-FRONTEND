import { useEffect, useState } from 'react';
import {
  Plus,
  MapPin,
  Pencil,
  Trash2,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

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
import { FullPageSpinner, Spinner } from '@/components/Spinner';
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

  // Excel Import state
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importResult, setImportResult] = useState(null);

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

  function openImportModal() {
    setImportFile(null);
    setImportError('');
    setImportResult(null);
    setImportOpen(true);
  }

  async function handleDownloadTemplate() {
    setImportError('');
    try {
      const response = await api.get('/hotels/import-template', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'hotels_rooms_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setImportError(getErrorMessage(err));
    }
  }

  async function handleImportExcel(e) {
    e.preventDefault();
    if (!importFile) {
      setImportError('Please select an Excel (.xlsx, .xls) or CSV file to import.');
      return;
    }

    setImporting(true);
    setImportError('');
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await api.post('/hotels/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setImportResult(response.data.data);
      setImportFile(null);
      load();
    } catch (err) {
      setImportError(getErrorMessage(err));
    } finally {
      setImporting(false);
    }
  }

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
          <div className="flex gap-2">
            <Button variant="outline" onClick={openImportModal} className="gap-2 shadow-sm">
              <Upload className="h-4 w-4" /> Import Excel
            </Button>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Add Hotel
            </Button>
          </div>
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

      {/* Excel Import Modal */}
      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import Hotels & Rooms (Excel)"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Excel Format Instructions:</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="gap-1.5 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                <Download className="h-3.5 w-3.5" /> Sample Template (.xlsx)
              </Button>
            </div>
            <p>
              Your Excel file can list hotels and multiple room numbers in each row.
            </p>
            <p className="font-mono text-[11px] text-slate-700 bg-white p-2 rounded border">
              Headers: <strong>Hotel Name</strong>, <strong>Hotel Address</strong>, <strong>Google Map Link</strong>, <strong>Room No</strong>, <strong>Room Type</strong>, <strong>Room Capacity</strong>, <strong>Current Occupancy</strong>, <strong>Notes</strong>, <strong>Active</strong>
            </p>
            <p className="text-[11px] text-slate-500">
              Allowed Room Types: DORMITORY, NON_AC_SHARING, AC_SHARING, DELUXE_AC, PREMIUM_AC
            </p>
          </div>

          {importError && (
            <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 ring-1 ring-red-200">
              {importError}
            </div>
          )}

          {importResult && (
            <div className="rounded-lg bg-emerald-50 p-4 ring-1 ring-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Import Completed Successfully!
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                <div className="rounded bg-white p-2 border">
                  <span className="text-slate-500 block">Hotels Created:</span>
                  <span className="text-lg font-bold text-slate-900">{importResult.hotelsCreated}</span>
                </div>
                <div className="rounded bg-white p-2 border">
                  <span className="text-slate-500 block">Hotels Updated:</span>
                  <span className="text-lg font-bold text-slate-900">{importResult.hotelsUpdated}</span>
                </div>
                <div className="rounded bg-white p-2 border">
                  <span className="text-slate-500 block">Rooms Created:</span>
                  <span className="text-lg font-bold text-emerald-600">{importResult.roomsCreated}</span>
                </div>
                <div className="rounded bg-white p-2 border">
                  <span className="text-slate-500 block">Rooms Updated:</span>
                  <span className="text-lg font-bold text-blue-600">{importResult.roomsUpdated}</span>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-2 text-xs">
                  <span className="font-semibold text-amber-800 flex items-center gap-1 mb-1">
                    <AlertCircle className="h-4 w-4" /> Warnings / Row issues:
                  </span>
                  <ul className="max-h-24 overflow-y-auto space-y-1 bg-white p-2 rounded border text-amber-900 text-[11px]">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleImportExcel} className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Select Excel / CSV File</Label>
              <Input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  setImportFile(e.target.files[0] || null);
                  setImportError('');
                  setImportResult(null);
                }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
                Close
              </Button>
              <Button type="submit" disabled={importing || !importFile} className="gap-2">
                {importing ? (
                  <>
                    <Spinner className="h-4 w-4 text-current" /> Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Upload & Process
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
