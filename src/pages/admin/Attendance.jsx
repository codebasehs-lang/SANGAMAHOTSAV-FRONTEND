import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import api, { getErrorMessage } from '@/lib/api';
import { Camera, Check, ChevronDown, KeyRound, LogOut, RefreshCw, RotateCcw, Search, UserCheck, Users, UserX, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const STATUS_FILTERS = [
  {
    value: 'NOT_ARRIVED',
    label: 'Not arrived',
    active: 'border-red-500 bg-red-500 text-white',
    idle: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
    badge: 'bg-red-500 text-white',
  },
  {
    value: 'PARTIALLY_ARRIVED',
    label: 'Partially arrived',
    active: 'border-amber-500 bg-amber-500 text-white',
    idle: 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
    badge: 'bg-amber-500 text-white',
  },
  {
    value: 'CHECKED_IN',
    label: 'Checked in',
    active: 'border-emerald-600 bg-emerald-600 text-white',
    idle: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
    badge: 'bg-emerald-600 text-white',
  },
  {
    value: 'CHECKED_OUT',
    label: 'Checked out',
    active: 'border-slate-600 bg-slate-600 text-white',
    idle: 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
    badge: 'bg-slate-600 text-white',
  },
];

function statusLabel(status) {
  return {
    NOT_ARRIVED: 'Not arrived',
    PARTIALLY_ARRIVED: 'Partially arrived',
    CHECKED_IN: 'Checked in',
    CHECKED_OUT: 'Checked out',
  }[status] || status || 'Not arrived';
}

function statusClass(status) {
  if (status === 'CHECKED_OUT') return 'bg-slate-100 text-slate-700';
  if (status === 'CHECKED_IN') return 'bg-emerald-100 text-emerald-800';
  if (status === 'PARTIALLY_ARRIVED') return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-700';
}

export default function Attendance() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('NOT_ARRIVED');
  const [results, setResults] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [summaryError, setSummaryError] = useState('');
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);

  function stopScanner() {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }

  useEffect(() => () => stopScanner(), []);

  useEffect(() => {
    lookup({ status: statusFilter });
  }, [statusFilter]);

  useEffect(() => {
    loadAttendanceSummary();
  }, []);

  async function loadAttendanceSummary() {
    setSummaryError('');
    try {
      const { data } = await api.get('/registrations/attendance/summary');
      setAttendanceSummary(data.data);
    } catch (err) {
      setSummaryError(getErrorMessage(err));
    }
  }

  async function lookup(params) {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.get('/registrations/attendance/lookup', { params });
      const nextResults = data.data || [];
      setResults(nextResults);
      if (nextResults.length === 1) selectRegistration(nextResults[0]);
      else setSelected(null);
      if (!nextResults.length) setError('No matching registration found.');
    } catch (err) {
      setResults([]);
      setSelected(null);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function selectRegistration(registration) {
    setSelected(registration);
    setSelectedMembers(
      (registration.familyMembers || [])
        .map((member, index) => (member.checkedIn ? null : index))
        .filter((index) => index !== null)
    );
    setMessage('');
    setError('');
  }

  function handleSearch(event) {
    event.preventDefault();
    if (search.trim()) lookup({ search: search.trim() });
  }

  async function startScanner() {
    setError('');
    if (!('BarcodeDetector' in window)) {
      setError('QR camera scanning is not supported in this browser. Use the search box or enter the QR token manually.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setScanning(true);
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes[0]?.rawValue) {
            stopScanner();
            setSearch(codes[0].rawValue);
            lookup({ token: codes[0].rawValue });
            return;
          }
        } catch {
          // Continue scanning while the camera is active.
        }
        frameRef.current = requestAnimationFrame(scan);
      };
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      scan();
    } catch (err) {
      setError(`Unable to access the camera: ${err.message}`);
      stopScanner();
    }
  }

  async function performAction(action) {
    if (!selected) return;
    if (
      action === 'RESET' &&
      !window.confirm(`Reset attendance and hotel key status for ${selected.name} and all family members?`)
    ) {
      return;
    }

    setActionLoading(action);
    setError('');
    setMessage('');
    try {
      const { data } = await api.put(`/registrations/${selected.id}/attendance`, {
        action,
        memberIndexes: selectedMembers,
      });
      await loadAttendanceSummary();
      setSelected(data.data);
      setResults((current) => current.map((item) => (item.id === data.data.id ? data.data : item)));
      setSelectedMembers(
        action === 'CHECK_OUT'
          ? []
          : action === 'RESET'
            ? (data.data.familyMembers || []).map((_, index) => index)
            : (data.data.familyMembers || []).map((member, index) => (member.checkedIn ? null : index)).filter((index) => index !== null)
      );
      if (action === 'RESET') {
        setMessage('Attendance and hotel key status reset.');
      } else {
        setMessage(action === 'CHECK_IN' ? 'Arrival recorded.' : action === 'CHECK_OUT' ? 'Checkout recorded.' : 'Hotel key status updated.');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading('');
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Attendance Desk</h1>
        <p className="text-sm text-muted-foreground">Scan a QR code or search by name or phone number.</p>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <form onSubmit={handleSearch} className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, phone number, or QR token"
            />
            <Button type="button" variant="destructive" onClick={() => setSearch('')} disabled={!search} className="w-full sm:w-auto">
              <X className="h-4 w-4" /> Clear
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto"><Search className="h-4 w-4" /> Search</Button>
            <Button type="button" variant="outline" onClick={scanning ? stopScanner : startScanner} className="w-full sm:w-auto">
              <Camera className="h-4 w-4" /> {scanning ? 'Stop camera' : 'Scan QR'}
            </Button>
          </form>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {STATUS_FILTERS.map(({ value, label, active, idle, badge }) => {
              const isActive = statusFilter === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  aria-pressed={isActive}
                  className={`inline-flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-medium shadow-sm transition-colors ${isActive ? active : idle}`}
                >
                  <span>{label}</span>
                  <span className={`min-w-[1.75rem] rounded-full px-2 py-0.5 text-center text-xs font-bold ${isActive ? 'bg-white/25 text-white' : badge}`}>
                    {attendanceSummary?.byStatus?.[value] ?? '—'}
                  </span>
                </button>
              );
            })}
          </div>
          <video ref={videoRef} className={`${scanning ? 'block' : 'hidden'} mx-auto max-h-64 w-full max-w-sm rounded-md bg-black`} muted playsInline />
          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-emerald-700">{message}</p>}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white/85">Total devotees (including family)</p>
            <Users className="h-5 w-5 text-white/80" />
          </div>
          <p className="mt-2 text-3xl font-bold">{attendanceSummary?.totalDevotees ?? '—'}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white/85">Checked in (including family)</p>
            <UserCheck className="h-5 w-5 text-white/80" />
          </div>
          <p className="mt-2 text-3xl font-bold">{attendanceSummary?.checkedIn ?? '—'}</p>
        </div>
      </div>
      {summaryError && <p className="text-sm text-destructive">Unable to load attendance totals: {summaryError}</p>}

      {results.length > 1 && (
        <Card>
          <CardHeader><CardTitle>Matching Registrations</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {results.map((registration) => {
              const isSelected = selected?.id === registration.id;
              return (
                <div key={registration.id} className="space-y-2">
                  <button type="button" onClick={() => (isSelected ? setSelected(null) : selectRegistration(registration))} aria-expanded={isSelected} className={`flex w-full flex-col gap-2 rounded-md border p-3 text-left hover:bg-accent sm:flex-row sm:items-center sm:justify-between ${isSelected ? 'border-primary bg-accent' : ''}`}>
                    <span><strong>{registration.name}</strong><span className="ml-2 text-sm text-muted-foreground">{registration.mobileNumber} · {registration.comingFrom || 'Place not provided'}</span></span>
                    <span className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(registration.attendanceStatus)}`}>{statusLabel(registration.attendanceStatus)}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isSelected ? 'rotate-180' : ''}`} />
                    </span>
                  </button>
                  {isSelected && renderDetails()}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {selected && !(results.length > 1 && results.some((item) => item.id === selected.id)) && renderDetails()}
    </div>
  );

  function renderDetails() {
    return (
      <Card className="border-primary">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle>{selected.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{selected.mobileNumber} · {selected.comingFrom || 'Place not provided'}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(selected.attendanceStatus)}`}>{statusLabel(selected.attendanceStatus)}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {selected.familyMembers?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Family members arriving now</p>
              {selected.familyMembers.map((member, index) => (
                <label key={index} className="flex items-center gap-3 rounded-md border p-3 text-sm">
                  <input type="checkbox" checked={selectedMembers.includes(index)} disabled={member.checkedIn || selected.attendanceStatus === 'CHECKED_OUT'} onChange={(event) => setSelectedMembers((current) => event.target.checked ? [...current, index] : current.filter((item) => item !== index))} />
                  <span className="flex-1"><strong>{member.name}</strong> · {member.age} · {member.relationship || 'Relationship not set'}</span>
                  {member.checkedIn && <span className="text-xs text-emerald-700">Arrived</span>}
                </label>
              ))}
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button onClick={() => performAction('CHECK_IN')} disabled={Boolean(actionLoading) || selected.attendanceStatus === 'CHECKED_OUT'}><UserCheck className="h-4 w-4" /> {actionLoading === 'CHECK_IN' ? 'Saving...' : 'Check in'}</Button>
            <Button variant="outline" onClick={() => performAction('GIVE_KEY')} disabled={Boolean(actionLoading) || selected.hotelKeyGiven}><KeyRound className="h-4 w-4" /> {selected.hotelKeyGiven ? 'Key given' : 'Give hotel key'}</Button>
            <Button variant="outline" onClick={() => performAction('RETURN_KEY')} disabled={Boolean(actionLoading) || !selected.hotelKeyGiven || selected.hotelKeyReturned}><RefreshCw className="h-4 w-4" /> {selected.hotelKeyReturned ? 'Key returned' : 'Return hotel key'}</Button>
            <Button variant="secondary" onClick={() => performAction('CHECK_OUT')} disabled={Boolean(actionLoading) || !['CHECKED_IN', 'PARTIALLY_ARRIVED'].includes(selected.attendanceStatus)}><LogOut className="h-4 w-4" /> {actionLoading === 'CHECK_OUT' ? 'Saving...' : 'Check out'}</Button>
          </div>
          <div className="flex justify-end">
            <Button variant="destructive" onClick={() => performAction('RESET')} disabled={Boolean(actionLoading)}>
              <RotateCcw className="h-4 w-4" /> {actionLoading === 'RESET' ? 'Resetting...' : 'Reset attendance'}
            </Button>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>{selected.hotelKeyGiven ? <Check className="mr-1 inline h-3.5 w-3.5 text-emerald-600" /> : <UserX className="mr-1 inline h-3.5 w-3.5" />}Hotel key {selected.hotelKeyGiven ? 'given' : 'not given'}</span>
            <span>{selected.hotelKeyReturned ? 'Hotel key returned' : 'Hotel key not returned'}</span>
          </div>
        </CardContent>
      </Card>
    );
  }
}
