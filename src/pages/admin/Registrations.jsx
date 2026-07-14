import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, Eye, ImageIcon, X, CheckCircle2 } from 'lucide-react';

import api, { getErrorMessage, tokenStore } from '@/lib/api';
import { humanize, formatDate } from '@/lib/utils';
import {
  ACCOMMODATION_STATUS,
  DEVOTEE_CATEGORY,
  NON_ATTENDING_TYPE,
  SHARED_ACCOMMODATION,
  FAMILY_ACCOMMODATION,
  ADDITIONAL_FAMILY_ACCOMMODATION,
} from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
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

function ImageModal({ src, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
    >
      <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -right-3 -top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-100"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <img
          src={src}
          alt="Payment screenshot"
          className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain shadow-xl"
        />
      </div>
    </div>
  );
}

function PaymentStatusBadge({ status }) {
  if (status === 'APPROVED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        <CheckCircle2 className="h-3 w-3" /> Approved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
      Pending
    </span>
  );
}

const ALL_ACCOM = [
  ...NON_ATTENDING_TYPE,
  ...SHARED_ACCOMMODATION,
  ...FAMILY_ACCOMMODATION,
  ...ADDITIONAL_FAMILY_ACCOMMODATION,
];

function findLabel(value) {
  return ALL_ACCOM.find((o) => o.value === value)?.label || null;
}

function parseAmount(label) {
  const match = label?.match(/₹\s*([\d,]+)/);
  return match ? parseInt(match[1].replace(',', ''), 10) : 0;
}

function AccommodationCell({ reg }) {
  const primary =
    findLabel(reg.nonAttendingType) ||
    findLabel(reg.sharedAccommodation) ||
    findLabel(reg.familyAccommodation);
  const extra = findLabel(reg.additionalFamilyAccommodation);

  if (!primary && !extra) return <span className="text-muted-foreground">-</span>;

  const total = parseAmount(primary) + parseAmount(extra);

  return (
    <div className="space-y-0.5">
      {primary && (
        <div className="text-xs font-medium leading-snug">{primary}</div>
      )}
      {extra && (
        <div className="text-xs text-muted-foreground leading-snug">
          + {extra}
        </div>
      )}
      {extra && primary && (
        <div className="text-xs font-semibold text-primary leading-snug">
          Total: ₹ {total.toLocaleString()}/-
        </div>
      )}
    </div>
  );
}

export default function Registrations() {
  const navigate = useNavigate();
  const { isViewer } = useAuth();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/registrations', {
        params: { search, status, category, page, limit: 20 },
      });
      setRows(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, status, category, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleExport() {
    const res = await fetch(
      `/api/v1/registrations/export?search=${encodeURIComponent(
        search
      )}&status=${status}&category=${category}`,
      { headers: { Authorization: `Bearer ${tokenStore.get()}` } }
    );
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'registrations.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleApprovePayment(id) {
    setApprovingId(id);
    try {
      const { data } = await api.put(`/registrations/${id}/approve-payment`);
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, paymentStatus: data.data.paymentStatus } : r))
      );
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setApprovingId(null);
    }
  }

  async function handleUnapprovePayment(id) {
    setApprovingId(id);
    try {
      const { data } = await api.put(`/registrations/${id}/unapprove-payment`);
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, paymentStatus: data.data.paymentStatus } : r))
      );
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {lightboxSrc && (
        <ImageModal src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Registrations</h1>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4" /> Export Excel
        </Button>
      </div>

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
          <Select
            className="w-40"
            options={DEVOTEE_CATEGORY}
            placeholder="All categories"
            value={category}
            onChange={(e) => {
              setPage(1);
              setCategory(e.target.value);
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
          ) : error ? (
            <p className="p-6 text-destructive">{error}</p>
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
                  <TableHead>From</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Arrival</TableHead>
                  <TableHead>Accommodation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.mobileNumber}</TableCell>
                    <TableCell>{r.comingFrom}</TableCell>
                    <TableCell>{humanize(r.devoteeCategory)}</TableCell>
                    <TableCell>{formatDate(r.arrivalDate)}</TableCell>
                    <TableCell>
                      <AccommodationCell reg={r} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.accommodationStatus} />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <PaymentStatusBadge status={r.paymentStatus} />
                        {r.paymentScreenshot && (
                          <button
                            type="button"
                            title="View payment screenshot"
                            onClick={() => setLightboxSrc(r.paymentScreenshot)}
                            className="mt-0.5 flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <ImageIcon className="h-3.5 w-3.5" /> Screenshot
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!isViewer && (
                          r.paymentStatus !== 'APPROVED' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-500 text-green-700 hover:bg-green-50"
                              disabled={approvingId === r.id}
                              onClick={() => handleApprovePayment(r.id)}
                            >
                              {approvingId === r.id ? '...' : 'Approve'}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-400 text-red-600 hover:bg-red-50"
                              disabled={approvingId === r.id}
                              onClick={() => handleUnapprovePayment(r.id)}
                            >
                              {approvingId === r.id ? '...' : 'Unapprove'}
                            </Button>
                          )
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/registrations/${r.id}`)}
                        >
                          <Eye className="h-4 w-4" /> View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <Pagination meta={meta} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
