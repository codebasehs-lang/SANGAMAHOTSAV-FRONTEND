import { useEffect, useState } from 'react';
import { HandHelping, Users, LayoutGrid, List, Download } from 'lucide-react';
import api, { getErrorMessage, tokenStore } from '@/lib/api';
import { SERVICES } from '@/lib/constants';
import { humanize } from '@/lib/utils';
import { FullPageSpinner } from '@/components/Spinner';

const GENDER_LABEL = { MALE: 'Prabhuji', FEMALE: 'Mataji' };
const sevaLabel = (val) => SERVICES.find((s) => s.value === val)?.label ?? humanize(val);

// Cycle through a palette of soft accent colors per card
const CARD_ACCENTS = [
  { border: 'border-violet-200', header: 'bg-violet-50', badge: 'bg-violet-100 text-violet-700', count: 'text-violet-600', dot: 'bg-violet-400' },
  { border: 'border-sky-200',    header: 'bg-sky-50',    badge: 'bg-sky-100 text-sky-700',    count: 'text-sky-600',    dot: 'bg-sky-400'    },
  { border: 'border-emerald-200',header: 'bg-emerald-50',badge: 'bg-emerald-100 text-emerald-700',count:'text-emerald-600',dot:'bg-emerald-400'},
  { border: 'border-amber-200',  header: 'bg-amber-50',  badge: 'bg-amber-100 text-amber-700',  count: 'text-amber-600',  dot: 'bg-amber-400'  },
  { border: 'border-rose-200',   header: 'bg-rose-50',   badge: 'bg-rose-100 text-rose-700',   count: 'text-rose-600',   dot: 'bg-rose-400'   },
  { border: 'border-cyan-200',   header: 'bg-cyan-50',   badge: 'bg-cyan-100 text-cyan-700',   count: 'text-cyan-600',   dot: 'bg-cyan-400'   },
];

function initials(name) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function DevoteeRow({ devotee, accentDot }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-black/[0.03] transition-colors">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${accentDot}`}>
        {initials(devotee.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-800">{devotee.name}</p>
        <p className="text-xs text-muted-foreground">
          {GENDER_LABEL[devotee.gender] ?? devotee.gender ?? '—'} &middot; {devotee.mobileNumber}
        </p>
      </div>
    </div>
  );
}

export default function Seva() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('bySeva');
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/v1/seva/export', {
        headers: { Authorization: `Bearer ${tokenStore.get()}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seva_assignments_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    api.get('/seva/summary')
      .then(({ data: res }) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <FullPageSpinner />;
  if (error) return <p className="text-destructive">{error}</p>;

  const sevaEntries = Object.entries(data.bySeva).sort((a, b) => b[1].length - a[1].length);
  const totalSevas = sevaEntries.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Seva Assignments</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Overview of all volunteer sevas chosen by registered devotees
          </p>
        </div>
        {/* Toggle + Export */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border bg-white p-1 shadow-sm gap-1">
            <button
              onClick={() => setView('bySeva')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                view === 'bySeva' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> By Seva
            </button>
            <button
              onClick={() => setView('byDevotion')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                view === 'byDevotion' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <List className="h-3.5 w-3.5" /> By Devotee
            </button>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent disabled:opacity-60 transition-colors"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting…' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-2/3">
        <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm">
          <div className="rounded-lg bg-primary/10 p-2">
            <HandHelping className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold">{totalSevas}</p>
            <p className="text-xs text-muted-foreground">Seva Types</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm">
          <div className="rounded-lg bg-emerald-100 p-2">
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold">{data.totalWithSeva}</p>
            <p className="text-xs text-muted-foreground">Volunteers</p>
          </div>
        </div>
      </div>

      {/* By Seva — card grid */}
      {view === 'bySeva' && (
        <>
          {sevaEntries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <HandHelping className="h-10 w-10 opacity-30" />
              <p>No seva assignments yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sevaEntries.map(([seva, devotees], idx) => {
                const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length];
                return (
                  <div
                    key={seva}
                    className={`flex flex-col rounded-xl border-2 bg-white shadow-sm overflow-hidden ${accent.border}`}
                  >
                    {/* Card header */}
                    <div className={`flex items-center justify-between px-4 py-3 ${accent.header}`}>
                      <h3 className="text-sm font-semibold text-gray-800 leading-snug">{sevaLabel(seva)}</h3>
                      <span className={`ml-2 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${accent.badge}`}>
                        {devotees.length}
                      </span>
                    </div>
                    {/* Devotee list */}
                    <div className="flex flex-col py-1">
                      {devotees.map((d) => (
                        <DevoteeRow key={d.id} devotee={d} accentDot={accent.dot} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* By Devotee — table */}
      {view === 'byDevotion' && (
        <div className="max-h-[65vh] overflow-auto rounded-xl border bg-white shadow-sm [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-max text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">#</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Name</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Gender</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Mobile</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Chosen Sevas</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.byDevotion.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No seva assignments yet.
                  </td>
                </tr>
              )}
              {data.byDevotion.map((d, idx) => (
                <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {initials(d.name)}
                      </div>
                      <span className="font-medium">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{GENDER_LABEL[d.gender] ?? d.gender ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.mobileNumber}</td>
                  <td className="px-4 py-3 max-w-md">
                    <div className="flex flex-wrap gap-1">
                      {d.services.map((s, si) => {
                        const accent = CARD_ACCENTS[si % CARD_ACCENTS.length];
                        return (
                          <span key={s} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${accent.badge}`}>
                            {sevaLabel(s)}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
