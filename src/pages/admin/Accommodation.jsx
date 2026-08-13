import { useEffect, useState, useCallback } from 'react';
import { Search, BedDouble, ChevronDown, ChevronUp } from 'lucide-react';

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
  hotelRoomId: null,
  assignedOccupancy: 1,
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

const GROUP_LABELS = {
  DORMITORY: 'Dormitory Controls',
  SHARED: 'Shared Room Controls',
  FAMILY: 'Family Room Controls',
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
  const [availabilityPanelOpen, setAvailabilityPanelOpen] = useState(false);
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
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
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
    setSelectedRoomType('');
    setSelectedRoom('');
    setForm(
      reg.assignment
        ? {
            hotelName: reg.assignment.hotelName || '',
            hotelAddress: reg.assignment.hotelAddress || '',
            roomNumber: reg.assignment.roomNumber || '',
            hotelRoomId: reg.assignment.hotelRoomId || null,
            assignedOccupancy: reg.assignment.assignedOccupancy || 1,
            hotelMapLink: reg.assignment.hotelMapLink || '',
          }
        : EMPTY
    );

    if (reg.assignment?.hotelRoom?.hotelId) {
      setSelectedHotel(String(reg.assignment.hotelRoom.hotelId));
      setSelectedRoomType(reg.assignment.hotelRoom.roomType || '');
      setSelectedRoom(String(reg.assignment.hotelRoom.id));
    } else {
      setSelectedRoomType(getExpectedRoomType(reg));
    }
    setFormError('');
  }

  function getExpectedRoomType(reg) {
    if (!reg) return '';
    return reg.sharedAccommodation || reg.familyAccommodation || '';
  }

  function roomHasAvailableCapacity(room, currentAssignmentRoomId) {
    if (!room) return false;
    if (String(room.id) === String(currentAssignmentRoomId || '')) return true;
    return Number(room.currentOccupancy || 0) < Number(room.roomCapacity || 0);
  }

  function getSuggestedOccupancy(reg) {
    if (!reg) return 1;
    const familyCount = Array.isArray(reg.familyMembers)
      ? reg.familyMembers.filter((m) => m?.name).length
      : 0;
    return Math.max(1, 1 + familyCount);
  }

  function pickHotel(hotelId) {
    setSelectedHotel(hotelId);
    const expectedType = getExpectedRoomType(active);
    setSelectedRoomType(expectedType || '');
    setSelectedRoom('');
    const hotel = hotels.find((h) => String(h.id) === String(hotelId));
    if (hotel) {
      setForm((prev) => ({
        ...prev,
        hotelName: hotel.hotelName || '',
        hotelAddress: hotel.hotelAddress || '',
        hotelRoomId: null,
        roomNumber: '',
        hotelMapLink: hotel.hotelMapLink || '',
      }));
    }
  }

  function pickRoomType(roomType) {
    setSelectedRoomType(roomType);
    setSelectedRoom('');
    setForm((prev) => ({
      ...prev,
      hotelRoomId: null,
      roomNumber: '',
    }));
  }

  function pickRoom(roomId) {
    setSelectedRoom(roomId);
    const hotel = hotels.find((h) => String(h.id) === String(selectedHotel));
    const room = hotel?.rooms?.find((r) => String(r.id) === String(roomId));
    if (!hotel || !room) return;

    setForm((prev) => ({
      ...prev,
      hotelName: hotel.hotelName || '',
      hotelAddress: hotel.hotelAddress || '',
      hotelRoomId: room.id,
      roomNumber: room.roomNo || '',
      hotelMapLink: hotel.hotelMapLink || '',
    }));
  }

  async function save() {
    setSaving(true);
    setFormError('');
    try {
      if (!selectedHotel) {
        setFormError('Please select a hotel.');
        return;
      }
      if (!selectedRoomType) {
        setFormError('Please select a room type.');
        return;
      }
      if (!selectedRoom) {
        setFormError('Please select a room number with available capacity.');
        return;
      }
      if (!Number(form.assignedOccupancy) || Number(form.assignedOccupancy) < 1) {
        setFormError('Please enter a valid devotees count (minimum 1).');
        return;
      }

      await api.post(`/accommodations/${active.id}`, {
        ...form,
        assignedOccupancy: Number(form.assignedOccupancy || 1),
        hotelRoomId: selectedRoom ? Number(selectedRoom) : null,
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

  const selectedHotelData = hotels.find(
    (h) => String(h.id) === String(selectedHotel)
  );
  const expectedRoomType = getExpectedRoomType(active);
  const assignmentRoomId = active?.assignment?.hotelRoomId;
  const roomTypeOptions = selectedHotelData
    ? Array.from(
        new Set(
          (selectedHotelData.rooms || [])
            .filter((room) => room.isActive)
            .map((room) => room.roomType)
        )
      )
        .filter((roomType) => !expectedRoomType || roomType === expectedRoomType)
        .map((roomType) => ({
          value: roomType,
          label:
            ROOM_TYPE_OPTIONS.find((option) => option.value === roomType)?.label || roomType,
        }))
    : [];
  const roomOptions = (selectedHotelData?.rooms || [])
    .filter((room) => room.isActive)
    .filter((room) => !selectedRoomType || room.roomType === selectedRoomType)
    .filter((room) => roomHasAvailableCapacity(room, assignmentRoomId))
    .map((room) => ({
      value: String(room.id),
      label: `${room.roomNo} • ${room.currentOccupancy}/${room.roomCapacity}`,
    }));
  const selectedRoomData = (selectedHotelData?.rooms || []).find(
    (room) => String(room.id) === String(selectedRoom)
  );
  const effectiveRoomOccupancy = selectedRoomData
    ? String(selectedRoomData.id) === String(assignmentRoomId || '')
      ? Math.max(
          0,
          Number(selectedRoomData.currentOccupancy || 0) -
            Number(active?.assignment?.assignedOccupancy || 1)
        )
      : Number(selectedRoomData.currentOccupancy || 0)
    : 0;
  const roomRemainingCapacity = selectedRoomData
    ? Math.max(0, Number(selectedRoomData.roomCapacity || 0) - effectiveRoomOccupancy)
    : 0;
  const suggestedOccupancy = getSuggestedOccupancy(active);

  const closedRows = availabilityRows.filter((row) => !row.isOpen);
  const openRowsCount = availabilityRows.length - closedRows.length;
  const groupedAvailabilityRows = {
    DORMITORY: availabilityRows.filter((row) => row.accommodationType === 'DORMITORY'),
    SHARED: availabilityRows.filter(
      (row) =>
        row.accommodationType !== 'DORMITORY' &&
        SHARED_ACCOMMODATION.some((option) => option.value === row.accommodationType)
    ),
    FAMILY: availabilityRows.filter((row) =>
      FAMILY_ACCOMMODATION.some((option) => option.value === row.accommodationType)
    ),
  };

  function renderAvailabilityCard(row) {
    const optionLabel =
      ROOM_TYPE_OPTIONS.find((option) => option.value === row.accommodationType)?.label ||
      row.accommodationType;
    const isSaving = availabilitySavingId === row.id;

    return (
      <div
        key={row.id}
        className={`rounded-xl border p-4 shadow-sm transition-colors ${
          row.isOpen
            ? 'border-emerald-200 bg-white'
            : 'border-rose-200 bg-rose-50/70'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900">{optionLabel}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {GENDER_LABEL[row.gender] || row.gender}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  row.isOpen
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {row.isOpen ? 'Open' : 'Closed'}
              </span>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
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
        </div>

        <div className="mt-4 space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-slate-500">Closed message</Label>
          <Input
            value={row.statusMessage || ''}
            disabled={isViewer || isSaving}
            onChange={(e) =>
              updateAvailabilityDraft(row.id, { statusMessage: e.target.value })
            }
            placeholder="Shown on the public registration form when this option is closed"
            className="bg-white"
          />
        </div>

        <div className="mt-4 flex justify-end">
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
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Hotel & Room Assignment</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-amber-50 shadow-sm">
            <button
              type="button"
              onClick={() => setAvailabilityPanelOpen((current) => !current)}
              className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left transition hover:bg-slate-50/70 sm:px-6"
            >
              <div className="space-y-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">Accommodation Controls</p>
                  <p className="text-sm text-slate-600">
                    Open or close accommodation options before devotees submit the registration form.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {openRowsCount} open
                  </span>
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                    {closedRows.length} closed
                  </span>
                  {closedRows.slice(0, 3).map((row) => (
                    <span
                      key={row.id}
                      className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800"
                    >
                      {(ROOM_TYPE_OPTIONS.find((option) => option.value === row.accommodationType)?.label ||
                        row.accommodationType)
                        .split(' - ')[0]} {GENDER_LABEL[row.gender] || row.gender} closed
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
                {availabilityPanelOpen ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </button>

            {availabilityPanelOpen && (
              <div className="border-t border-slate-200 px-5 py-5 sm:px-6">
                <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                  Use this panel to quickly stop one category, such as Mataji dormitory, without affecting the room assignment workflow below.
                </div>

                {availabilityError && (
                  <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
                    {availabilityError}
                  </div>
                )}

                {availabilityLoading ? (
                  <div className="flex justify-center py-6">
                    <Spinner className="h-5 w-5 text-primary" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedAvailabilityRows).map(([groupKey, groupRows]) => {
                      if (groupRows.length === 0) return null;

                      return (
                        <section key={groupKey} className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <h2 className="text-base font-semibold text-slate-900">
                                {GROUP_LABELS[groupKey] || groupKey}
                              </h2>
                              <p className="text-sm text-slate-500">
                                {groupKey === 'DORMITORY'
                                  ? 'Separate controls for Prabhuji and Mataji dormitory allocation.'
                                  : 'Shared public availability settings for this accommodation group.'}
                              </p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                              {groupRows.filter((row) => row.isOpen).length}/{groupRows.length} open
                            </span>
                          </div>

                          <div className="grid gap-4 xl:grid-cols-2">
                            {groupRows.map((row) => renderAvailabilityCard(row))}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
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
          {selectedHotel && (
            <div className="space-y-1.5">
              <Label>Room Type</Label>
              <Select
                options={roomTypeOptions}
                placeholder={
                  expectedRoomType
                    ? 'No matching room types available in this hotel'
                    : 'Choose room type...'
                }
                value={selectedRoomType}
                onChange={(e) => pickRoomType(e.target.value)}
              />
              {expectedRoomType && (
                <p className="text-xs text-muted-foreground">
                  Expected from registration preference: {ROOM_TYPE_OPTIONS.find((option) => option.value === expectedRoomType)?.label || expectedRoomType}
                </p>
              )}
            </div>
          )}
          {selectedHotel && selectedRoomType && (
            <div className="space-y-1.5">
              <Label>Room Number</Label>
              <Select
                options={roomOptions}
                placeholder={
                  roomOptions.length
                    ? 'Choose available room...'
                    : 'No active room with available capacity'
                }
                value={selectedRoom}
                onChange={(e) => pickRoom(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Devotees To Assign In This Room</Label>
            <Input
              type="number"
              min={1}
              value={form.assignedOccupancy}
              onChange={(e) =>
                setForm({
                  ...form,
                  assignedOccupancy: e.target.value,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Suggested for this registration: {suggestedOccupancy} devotee(s).
            </p>
            {selectedRoomData && (
              <p className="text-xs text-muted-foreground">
                Remaining capacity in selected room: {roomRemainingCapacity} (capacity {selectedRoomData.roomCapacity}, current {effectiveRoomOccupancy}).
              </p>
            )}
          </div>
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
