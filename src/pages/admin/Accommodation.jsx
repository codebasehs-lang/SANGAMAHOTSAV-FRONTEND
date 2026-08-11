import { useEffect, useState, useCallback } from 'react';
import { Search, BedDouble } from 'lucide-react';

import api, { getErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  ACCOMMODATION_STATUS,
  NON_ATTENDING_TYPE,
  SHARED_ACCOMMODATION,
  FAMILY_ACCOMMODATION,
} from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import { Spinner } from '@/components/Spinner';

const EMPTY = {
  hotelName: '',
  hotelAddress: '',
  roomNumber: '',
  hotelMapLink: '',
};

const ROOM_TYPE_OPTIONS = [
  ...SHARED_ACCOMMODATION,
  ...FAMILY_ACCOMMODATION,
  ...NON_ATTENDING_TYPE,
];

const GENDER_LABEL = {
  ALL: 'All devotees',
  MALE: 'Prabhuji',
  FEMALE: 'Mataji',
};

/** Returns the label of whichever PRIMARY accommodation preference the devotee selected (excluding additional). */
function getRoomType(reg) {
  const value =
    reg.sharedAccommodation ||
    reg.familyAccommodation ||
    reg.nonAttendingType;
  if (!value) return '-';
  return ROOM_TYPE_OPTIONS.find((o) => o.value === value)?.label || value;
}

export default function Accommodation() {
  const { isViewer } = useAuth();
  const [rows, setRows] = useState([]);
  const [availabilityRows, setAvailabilityRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilitySavingId, setAvailabilitySavingId] = useState(null);
  const [availabilityError, setAvailabilityError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [active, setActive] = useState(null); // registration being assigned
  const [form, setForm] = useState(EMPTY);
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/registrations', {
        params: { search, status, page, limit: 20 },
      });
      setRows(data.data);
      setMeta(data.meta);
    } catch {
      /* handled via UI */
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadAvailability();
  }, []);

  useEffect(() => {
    api
      .get('/hotels')
      .then(({ data }) => setHotels(data.data))
      .catch(() => {
        /* handled via UI */
      });
  }, []);

  async function loadAvailability() {
    setAvailabilityLoading(true);
    setAvailabilityError('');
    try {
      const { data } = await api.get('/accommodations/availability');
      setAvailabilityRows(data.data || []);
    } catch (err) {
      setAvailabilityError(getErrorMessage(err));
    } finally {
      setAvailabilityLoading(false);
    }
  }

  function updateAvailabilityDraft(id, patch) {
    setAvailabilityRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  }

  async function saveAvailability(row) {
    setAvailabilitySavingId(row.id);
    setAvailabilityError('');
    try {
      const { data } = await api.put(`/accommodations/availability/${row.id}`, {
        isOpen: row.isOpen,
        statusMessage: row.statusMessage?.trim() || null,
      });
      setAvailabilityRows((current) =>
        current.map((item) => (item.id === row.id ? data.data : item))
      );
    } catch (err) {
      setAvailabilityError(getErrorMessage(err));
    } finally {
      setAvailabilitySavingId(null);
    }
  }

  function openAssign(reg) {
    setActive(reg);
    setSelectedHotel('');
    setForm(
      reg.assignment
        ? {
            hotelName: reg.assignment.hotelName || '',
            hotelAddress: reg.assignment.hotelAddress || '',
            roomNumber: reg.assignment.roomNumber || '',
            hotelMapLink: reg.assignment.hotelMapLink || '',
          }
        : EMPTY
    );
    setFormError('');
  }

  function pickHotel(hotelId) {
    setSelectedHotel(hotelId);
    const hotel = hotels.find((h) => String(h.id) === String(hotelId));
    if (hotel) {
      setForm((prev) => ({
        ...prev,
        hotelName: hotel.hotelName || '',
        hotelAddress: hotel.hotelAddress || '',
        hotelMapLink: hotel.hotelMapLink || '',
      }));
    }
  }

  async function save() {
    setSaving(true);
    setFormError('');
    try {
      await api.post(`/accommodations/${active.id}`, {
        ...form,
        status: 'ASSIGNED',
      });
      setActive(null);
      load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Hotel & Room Assignment</h1>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <h2 className="text-lg font-semibold">Accommodation Availability</h2>
            <p className="text-sm text-muted-foreground">
              Manually open or close accommodation options before devotees submit the registration form.
            </p>
          </div>

          {availabilityError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
              {availabilityError}
            </div>
          )}

          {availabilityLoading ? (
            <div className="flex justify-center py-6">
              <Spinner className="h-5 w-5 text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {availabilityRows.map((row) => {
                const optionLabel =
                  ROOM_TYPE_OPTIONS.find((option) => option.value === row.accommodationType)
                    ?.label || row.accommodationType;
                const isSaving = availabilitySavingId === row.id;

                return (
                  <div
                    key={row.id}
                    className="grid gap-3 rounded-lg border p-4 lg:grid-cols-[minmax(0,1.2fr)_12rem_minmax(0,1.5fr)_auto]"
                  >
                    <div>
                      <p className="font-medium">{optionLabel}</p>
                      <p className="text-xs text-muted-foreground">{row.accommodationType}</p>
                    </div>

                    <div>
                      <Label className="text-xs">Applies To</Label>
                      <p className="mt-2 text-sm">{GENDER_LABEL[row.gender] || row.gender}</p>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={row.isOpen}
                          disabled={isViewer || isSaving}
                          onChange={(e) =>
                            updateAvailabilityDraft(row.id, { isOpen: e.target.checked })
                          }
                        />
                        Open for registration
                      </label>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Closed message</Label>
                        <Input
                          value={row.statusMessage || ''}
                          disabled={isViewer || isSaving}
                          onChange={(e) =>
                            updateAvailabilityDraft(row.id, { statusMessage: e.target.value })
                          }
                          placeholder="Shown on the public registration form when this option is closed"
                        />
                      </div>
                    </div>

                    <div className="flex items-end justify-end">
                      {isViewer ? (
                        <span className="text-xs text-muted-foreground">View Only</span>
                      ) : (
                        <Button onClick={() => saveAvailability(row)} disabled={isSaving}>
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search name, mobile, place..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
          <Select
            className="w-44"
            options={ACCOMMODATION_STATUS}
            placeholder="All statuses"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-6 w-6 text-primary" />
            </div>
          ) : rows.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground">
              No registrations found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Mobile</TableHead>
                  <TableHead className="hidden md:table-cell">Arrival</TableHead>
                  <TableHead className="hidden md:table-cell">Room Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Hotel / Room</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{r.mobileNumber}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(r.arrivalDate)}</TableCell>
                    <TableCell className="hidden md:table-cell">{getRoomType(r)}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {r.assignment ? (
                        <div className="space-y-0.5 text-sm">
                          <div>{r.assignment.hotelName} / {r.assignment.roomNumber}</div>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.accommodationStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      {isViewer ? (
                        <span className="text-xs text-muted-foreground">View Only</span>
                      ) : r.paymentStatus !== 'APPROVED' ? (
                        <span
                          title="Payment must be approved before assigning accommodation"
                          className="inline-block cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs text-gray-400"
                        >
                          Payment Pending
                        </span>
                      ) : (
                        <Button size="sm" onClick={() => openAssign(r)}>
                          <BedDouble className="h-4 w-4" />
                          {r.assignment ? 'Edit' : 'Assign'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <Pagination meta={meta} onPageChange={setPage} />
        </CardContent>
      </Card>

      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title={`Assign Accommodation — ${active?.name || ''}`}
      >
        {formError && (
          <div className="mb-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
            {formError}
          </div>
        )}
        <div className="space-y-3">
          {/* ── Primary Room ── */}
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Primary Room
          </p>
          {hotels.length > 0 && (
            <div className="space-y-1.5">
              <Label>Select Hotel</Label>
              <Select
                options={hotels.map((h) => ({
                  value: String(h.id),
                  label: h.hotelName,
                }))}
                placeholder="Choose a hotel..."
                value={selectedHotel}
                onChange={(e) => pickHotel(e.target.value)}
              />
            </div>
          )}
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
              onChange={(e) => setForm({ ...form, hotelAddress: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Room Number</Label>
            <Input
              value={form.roomNumber}
              onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Hotel Google Map Link</Label>
            <Input
              value={form.hotelMapLink}
              onChange={(e) => setForm({ ...form, hotelMapLink: e.target.value })}
              placeholder="https://maps.google.com/..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setActive(null)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save Assignment'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
