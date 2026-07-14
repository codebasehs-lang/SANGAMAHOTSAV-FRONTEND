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
  ADDITIONAL_FAMILY_ACCOMMODATION,
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
  additionalHotelName: '',
  additionalHotelAddress: '',
  additionalRoomNumber: '',
  additionalHotelMapLink: '',
};

const ROOM_TYPE_OPTIONS = [
  ...SHARED_ACCOMMODATION,
  ...FAMILY_ACCOMMODATION,
  ...ADDITIONAL_FAMILY_ACCOMMODATION,
  ...NON_ATTENDING_TYPE,
];

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
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [active, setActive] = useState(null); // registration being assigned
  const [form, setForm] = useState(EMPTY);
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [selectedAdditionalHotel, setSelectedAdditionalHotel] = useState('');
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
    api
      .get('/hotels')
      .then(({ data }) => setHotels(data.data))
      .catch(() => {
        /* handled via UI */
      });
  }, []);

  function openAssign(reg) {
    setActive(reg);
    setSelectedHotel('');
    setSelectedAdditionalHotel('');
    setForm(
      reg.assignment
        ? {
            hotelName: reg.assignment.hotelName || '',
            hotelAddress: reg.assignment.hotelAddress || '',
            roomNumber: reg.assignment.roomNumber || '',
            hotelMapLink: reg.assignment.hotelMapLink || '',
            additionalHotelName: reg.assignment.additionalHotelName || '',
            additionalHotelAddress: reg.assignment.additionalHotelAddress || '',
            additionalRoomNumber: reg.assignment.additionalRoomNumber || '',
            additionalHotelMapLink: reg.assignment.additionalHotelMapLink || '',
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

  function pickAdditionalHotel(hotelId) {
    setSelectedAdditionalHotel(hotelId);
    const hotel = hotels.find((h) => String(h.id) === String(hotelId));
    if (hotel) {
      setForm((prev) => ({
        ...prev,
        additionalHotelName: hotel.hotelName || '',
        additionalHotelAddress: hotel.hotelAddress || '',
        additionalHotelMapLink: hotel.hotelMapLink || '',
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
                  <TableHead>Mobile</TableHead>
                  <TableHead>Arrival</TableHead>
                  <TableHead>Room Type</TableHead>
                  <TableHead>Hotel / Room</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.mobileNumber}</TableCell>
                    <TableCell>{formatDate(r.arrivalDate)}</TableCell>
                    <TableCell>{getRoomType(r)}</TableCell>
                    <TableCell>
                      {r.assignment ? (
                        <div className="space-y-0.5 text-sm">
                          <div>{r.assignment.hotelName} / {r.assignment.roomNumber}</div>
                          {r.assignment.additionalRoomNumber && (
                            <div className="text-xs text-muted-foreground">
                              Addl: {r.assignment.additionalHotelName} / {r.assignment.additionalRoomNumber}
                            </div>
                          )}
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

          {/* ── Additional Family Room (only when devotee selected it) ── */}
          {active?.additionalFamilyAccommodation && (
            <>
              <div className="mt-2 border-t pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Additional Family Room
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {ADDITIONAL_FAMILY_ACCOMMODATION.find(
                    (o) => o.value === active.additionalFamilyAccommodation
                  )?.label || active.additionalFamilyAccommodation}
                </p>
              </div>
              {hotels.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Select Hotel</Label>
                  <Select
                    options={hotels.map((h) => ({
                      value: String(h.id),
                      label: h.hotelName,
                    }))}
                    placeholder="Choose a hotel..."
                    value={selectedAdditionalHotel}
                    onChange={(e) => pickAdditionalHotel(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Hotel Name</Label>
                <Input
                  value={form.additionalHotelName}
                  onChange={(e) => setForm({ ...form, additionalHotelName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Hotel Address</Label>
                <Input
                  value={form.additionalHotelAddress}
                  onChange={(e) => setForm({ ...form, additionalHotelAddress: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Room Number</Label>
                <Input
                  value={form.additionalRoomNumber}
                  onChange={(e) => setForm({ ...form, additionalRoomNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Hotel Google Map Link</Label>
                <Input
                  value={form.additionalHotelMapLink}
                  onChange={(e) => setForm({ ...form, additionalHotelMapLink: e.target.value })}
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </>
          )}

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
