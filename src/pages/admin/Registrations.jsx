import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, Eye, ImageIcon, X, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

import api, { getErrorMessage, tokenStore } from '@/lib/api';
import { humanize, formatDate } from '@/lib/utils';
import {
  ACCOMMODATION_STATUS,
  DEVOTEE_CATEGORY,
  NON_ATTENDING_TYPE,
  SHARED_ACCOMMODATION,
  FAMILY_ACCOMMODATION,
  EXTRA_CHARGE_OPTIONS,
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

function ImageModal({ images, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const total = images.length;
  const goPrev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total]);
  const goNext = useCallback(() => setIndex((i) => (i + 1) % total), [total]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && total > 1) goPrev();
      if (e.key === 'ArrowRight' && total > 1) goNext();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, goPrev, goNext, total]);

  const current = images[index];

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

        {total > 1 && (
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white"
            aria-label="Previous screenshot"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <img
          src={current.src}
          alt={current.label}
          className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain shadow-xl"
        />

        {total > 1 && (
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white"
            aria-label="Next screenshot"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
          {current.label}{total > 1 ? ` · ${index + 1} of ${total}` : ''}
        </div>
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
  ...(typeof ADDITIONAL_FAMILY_ACCOMMODATION !== 'undefined' ? ADDITIONAL_FAMILY_ACCOMMODATION : []),
];

function findLabel(value) {
  return ALL_ACCOM.find((o) => o.value === value)?.label || null;
}

function getExtraChargeTotal(reg) {
  const entries = Array.isArray(reg.extraCharges) ? reg.extraCharges : [];
  return entries.reduce((sum, code) => {
    const option = EXTRA_CHARGE_OPTIONS.find((opt) => opt.value === code);
    return sum + (option?.amount || 0);
  }, 0);
}

function AccommodationCell({ reg }) {
  const primary =
    findLabel(reg.nonAttendingType) ||
    findLabel(reg.sharedAccommodation) ||
    findLabel(reg.familyAccommodation);
  const extraTotal = getExtraChargeTotal(reg);
  const extraSelected = extraTotal > 0;
  const totalExtra = extraTotal;

  if (!primary && !extraSelected) return <span className="text-muted-foreground">-</span>;

  return (
    <div className="space-y-0.5">
      {primary && (
        <div className="text-xs font-medium leading-snug">{primary}</div>
      )}
      {extraSelected && (
        <div className="text-xs text-muted-foreground leading-snug">
          + ₹ {totalExtra.toLocaleString()}/-
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
  const [lightboxImages, setLightboxImages] = useState(null);
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
      {lightboxImages && (
        <ImageModal images={lightboxImages} onClose={() => setLightboxImages(null)} />
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
                  <TableHead className="hidden sm:table-cell">Mobile</TableHead>
                  <TableHead className="hidden lg:table-cell">From</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden md:table-cell">Arrival</TableHead>
                  <TableHead className="hidden lg:table-cell">Accommodation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{r.mobileNumber}</TableCell>
                    <TableCell className="hidden lg:table-cell">{r.comingFrom}</TableCell>
                    <TableCell className="hidden md:table-cell">{humanize(r.devoteeCategory)}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(r.arrivalDate)}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <AccommodationCell reg={r} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.accommodationStatus} />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <PaymentStatusBadge status={r.paymentStatus} />
                        {(() => {
                          const images = [1, 2, 3]
                            .filter((n) => r[`paymentScreenshot${n}`])
                            .map((n) => ({ label: `Installment ${n}`, src: r[`paymentScreenshot${n}`] }));
                          if (images.length === 0 && r.paymentScreenshot) {
                            images.push({ label: 'Payment Screenshot', src: r.paymentScreenshot });
                          }
                          return (
                            images.length > 0 && (
                              <button
                                type="button"
                                title="View payment screenshot"
                                onClick={() => setLightboxImages(images)}
                                className="mt-0.5 flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <ImageIcon className="h-3.5 w-3.5" /> Screenshot
                              </button>
                            )
                          );
                        })()}
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
