import { useEffect, useRef, useState } from 'react';
import { Camera, Check, KeyRound, LogOut, RefreshCw, Search, UserCheck, UserX } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  const [selected, setSelected] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
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

  async function lookup(params) {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.get('/registrations/attendance/lookup', { params });
      const nextResults = data.data || [];
      setResults(nextResults);
      if (nextResults.length === 1) selectRegistration(nextResults[0]);
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
    setActionLoading(action);
    setError('');
    setMessage('');
    try {
      const { data } = await api.put(`/registrations/${selected.id}/attendance`, {
        action,
        memberIndexes: selectedMembers,
      });
      setSelected(data.data);
      setResults((current) => current.map((item) => (item.id === data.data.id ? data.data : item)));
      setSelectedMembers(
        action === 'CHECK_OUT'
          ? []
          : (data.data.familyMembers || []).map((member, index) => (member.checkedIn ? null : index)).filter((index) => index !== null)
      );
      setMessage(action === 'CHECK_IN' ? 'Arrival recorded.' : action === 'CHECK_OUT' ? 'Checkout recorded.' : 'Hotel key status updated.');
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
          <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, phone number, or QR token" />
            <Button type="submit" disabled={loading}><Search className="h-4 w-4" /> Search</Button>
            <Button type="button" variant="outline" onClick={scanning ? stopScanner : startScanner}>
              <Camera className="h-4 w-4" /> {scanning ? 'Stop camera' : 'Scan QR'}
            </Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {[
              ['NOT_ARRIVED', 'Not arrived'],
              ['PARTIALLY_ARRIVED', 'Partially arrived'],
              ['CHECKED_IN', 'Checked in'],
              ['CHECKED_OUT', 'Checked out'],
            ].map(([value, label]) => (
              <Button key={value} type="button" size="sm" variant={statusFilter === value ? 'default' : 'outline'} onClick={() => setStatusFilter(value)}>
                {label}
              </Button>
            ))}
          </div>
          <video ref={videoRef} className={`${scanning ? 'block' : 'hidden'} mx-auto max-h-64 w-full max-w-sm rounded-md bg-black`} muted playsInline />
          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-emerald-700">{message}</p>}
        </CardContent>
      </Card>

      {results.length > 1 && (
        <Card>
          <CardHeader><CardTitle>Matching Registrations</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {results.map((registration) => (
              <button key={registration.id} type="button" onClick={() => selectRegistration(registration)} className={`flex w-full items-center justify-between rounded-md border p-3 text-left hover:bg-accent ${selected?.id === registration.id ? 'border-primary bg-accent' : ''}`}>
                <span><strong>{registration.name}</strong><span className="ml-2 text-sm text-muted-foreground">{registration.mobileNumber} · {registration.comingFrom || 'Place not provided'}</span></span>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(registration.attendanceStatus)}`}>{statusLabel(registration.attendanceStatus)}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {selected && (
        <Card>
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
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>{selected.hotelKeyGiven ? <Check className="mr-1 inline h-3.5 w-3.5 text-emerald-600" /> : <UserX className="mr-1 inline h-3.5 w-3.5" />}Hotel key {selected.hotelKeyGiven ? 'given' : 'not given'}</span>
              <span>{selected.hotelKeyReturned ? 'Hotel key returned' : 'Hotel key not returned'}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
