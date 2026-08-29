import { useEffect, useState, useCallback } from 'react';
import {
  Baby,
  Gift,
  Search,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Users,
  Heart,
  Filter,
} from 'lucide-react';

import api, { getErrorMessage } from '@/lib/api';
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
import Pagination from '@/components/Pagination';
import { Spinner } from '@/components/Spinner';

export default function Children() {
  const { isViewer } = useAuth();
  const [children, setChildren] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState({
    totalChildren: 0,
    giftsGivenCount: 0,
    giftsPendingCount: 0,
    maleCount: 0,
    femaleCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [giftStatus, setGiftStatus] = useState('ALL');
  const [gender, setGender] = useState('ALL');
  const [ageGroup, setAgeGroup] = useState('ALL');
  const [page, setPage] = useState(1);

  const fetchChildren = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/registrations/children', {
        params: {
          search: search.trim() || undefined,
          giftStatus: giftStatus !== 'ALL' ? giftStatus : undefined,
          gender: gender !== 'ALL' ? gender : undefined,
          ageGroup: ageGroup !== 'ALL' ? ageGroup : undefined,
          page,
          limit: 20,
        },
      });

      setChildren(response.data.data || []);
      if (response.data.meta) setMeta(response.data.meta);
      if (response.data.summary) setSummary(response.data.summary);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, giftStatus, gender, ageGroup, page]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  // Reset to page 1 on filter changes
  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
  };

  const handleGiftStatusChange = (val) => {
    setGiftStatus(val);
    setPage(1);
  };

  const handleGenderChange = (val) => {
    setGender(val);
    setPage(1);
  };

  const handleAgeGroupChange = (val) => {
    setAgeGroup(val);
    setPage(1);
  };

  // Toggle Gift Given Status
  const handleToggleGift = async (child) => {
    if (isViewer) return;
    const targetStatus = !child.giftGiven;
    setUpdatingId(child.id);
    setMessage('');

    // Optimistic UI update
    setChildren((prev) =>
      prev.map((c) => (c.id === child.id ? { ...c, giftGiven: targetStatus } : c))
    );
    setSummary((prev) => ({
      ...prev,
      giftsGivenCount: targetStatus ? prev.giftsGivenCount + 1 : Math.max(0, prev.giftsGivenCount - 1),
      giftsPendingCount: targetStatus ? Math.max(0, prev.giftsPendingCount - 1) : prev.giftsPendingCount + 1,
    }));

    try {
      await api.put('/registrations/children/gift-status', {
        registrationId: child.registrationId,
        personType: child.personType,
        memberIndex: child.memberIndex,
        giftGiven: targetStatus,
      });

      setMessage(
        `Gift status for ${child.childName} updated to ${targetStatus ? 'YES (Gift Given)' : 'NO (Pending)'}.`
      );
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      // Revert optimistic update
      setChildren((prev) =>
        prev.map((c) => (c.id === child.id ? { ...c, giftGiven: child.giftGiven } : c))
      );
      setError(getErrorMessage(err));
      fetchChildren();
    } finally {
      setUpdatingId(null);
    }
  };

  // Export Excel
  const handleExport = async () => {
    try {
      const response = await api.get('/registrations/children/export', {
        params: {
          search: search.trim() || undefined,
          giftStatus: giftStatus !== 'ALL' ? giftStatus : undefined,
          gender: gender !== 'ALL' ? gender : undefined,
          ageGroup: ageGroup !== 'ALL' ? ageGroup : undefined,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `children_gifts_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const giftGivenPercentage = summary.totalChildren
    ? Math.round((summary.giftsGivenCount / summary.totalChildren) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            <Baby className="h-7 w-7 text-indigo-600" />
            Children & Gift Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            List of all registered children (Age ≤ 16) for gift distribution tracking.
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2 shadow-sm">
          <Download className="h-4 w-4" />
          Export Children List (Excel)
        </Button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-indigo-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Children (≤16)
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{summary.totalChildren}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Boys: {summary.maleCount} | Girls: {summary.femaleCount}
                </p>
              </div>
              <div className="rounded-full bg-indigo-50 p-3 text-indigo-600">
                <Baby className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Gifts Distributed
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">
                  {summary.giftsGivenCount}{' '}
                  <span className="text-xs font-medium text-emerald-500">({giftGivenPercentage}%)</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">Gift Given = YES</p>
              </div>
              <div className="rounded-full bg-emerald-50 p-3 text-emerald-600">
                <Gift className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Gifts Pending
                </p>
                <p className="mt-1 text-2xl font-bold text-amber-600">
                  {summary.giftsPendingCount}
                </p>
                <p className="mt-1 text-xs text-slate-500">Gift Given = NO</p>
              </div>
              <div className="rounded-full bg-amber-50 p-3 text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Filtered Results
                </p>
                <p className="mt-1 text-2xl font-bold text-purple-600">{meta.total || 0}</p>
                <p className="mt-1 text-xs text-slate-500">Matching criteria</p>
              </div>
              <div className="rounded-full bg-purple-50 p-3 text-purple-600">
                <Sparkles className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-4">
            {/* Search */}
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search child, parent, mobile..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Gift Status Filter */}
            <div>
              <Select
                value={giftStatus}
                onChange={(e) => handleGiftStatusChange(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Gift Statuses' },
                  { value: 'GIVEN', label: 'Gift Given (YES)' },
                  { value: 'PENDING', label: 'Gift Pending (NO)' },
                ]}
              />
            </div>

            {/* Gender Filter */}
            <div>
              <Select
                value={gender}
                onChange={(e) => handleGenderChange(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Genders' },
                  { value: 'MALE', label: 'Prabhuji (Male)' },
                  { value: 'FEMALE', label: 'Mataji (Female)' },
                ]}
              />
            </div>

            {/* Age Group Filter */}
            <div>
              <Select
                value={ageGroup}
                onChange={(e) => handleAgeGroupChange(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Ages (0 - 16 yrs)' },
                  { value: '0-5', label: 'Infants & Toddlers (0 - 5 yrs)' },
                  { value: '6-12', label: 'Kids (6 - 12 yrs)' },
                  { value: '13-16', label: 'Teens (13 - 16 yrs)' },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      {message && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {/* Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner className="h-8 w-8 text-indigo-600" />
            </div>
          ) : children.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
              <Baby className="h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-base font-semibold text-slate-900">No children found</h3>
              <p className="mt-1 text-sm text-slate-500">
                No child details match your current filter criteria or search.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>Child Name</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Type / Relation</TableHead>
                    <TableHead>Parent / Main Devotee</TableHead>
                    <TableHead>Contact Mobile</TableHead>
                    <TableHead>Coming From</TableHead>
                    <TableHead className="text-center">Gift Given?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {children.map((child, idx) => {
                    const rowNumber = (meta.page - 1) * meta.limit + idx + 1;
                    const isUpdating = updatingId === child.id;

                    return (
                      <TableRow key={child.id} className="hover:bg-slate-50/70">
                        <TableCell className="text-center text-xs font-medium text-slate-500">
                          {rowNumber}
                        </TableCell>

                        {/* Child Name */}
                        <TableCell>
                          <div className="font-semibold text-slate-900">{child.childName}</div>
                          {child.devoteeCategory && (
                            <div className="text-xs text-slate-500">{child.devoteeCategory}</div>
                          )}
                        </TableCell>

                        {/* Age */}
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                            {child.age} yrs
                          </span>
                        </TableCell>

                        {/* Gender */}
                        <TableCell className="text-xs">
                          {child.gender === 'MALE' ? (
                            <span className="font-medium text-blue-700">Prabhuji (M)</span>
                          ) : child.gender === 'FEMALE' ? (
                            <span className="font-medium text-pink-700">Mataji (F)</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>

                        {/* Person Type / Relationship */}
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                              child.personType === 'MAIN'
                                ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {child.relationship}
                          </span>
                        </TableCell>

                        {/* Parent Name */}
                        <TableCell>
                          <div className="text-sm font-medium text-slate-800">
                            {child.parentName}
                          </div>
                          <div className="text-xs text-slate-500">Ref ID: #{child.registrationId}</div>
                        </TableCell>

                        {/* Contact Mobile */}
                        <TableCell className="text-xs font-mono text-slate-700">
                          {child.mobileNumber}
                        </TableCell>

                        {/* Coming From */}
                        <TableCell className="text-xs text-slate-600">
                          {child.comingFrom || '—'}
                        </TableCell>

                        {/* Gift Given Yes/No Column with Interactive Action */}
                        <TableCell className="text-center">
                          <button
                            type="button"
                            disabled={isViewer || isUpdating}
                            onClick={() => handleToggleGift(child)}
                            title={
                              isViewer
                                ? 'View-only mode'
                                : `Click to mark gift as ${child.giftGiven ? 'NO (Pending)' : 'YES (Given)'}`
                            }
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all shadow-sm ${
                              child.giftGiven
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 ring-1 ring-emerald-300'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200 ring-1 ring-amber-300'
                            } ${isViewer ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                          >
                            {isUpdating ? (
                              <Spinner className="h-3.5 w-3.5 text-current" />
                            ) : child.giftGiven ? (
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-amber-600" />
                            )}
                            <span>{child.giftGiven ? 'YES (Gift Given)' : 'NO (Pending)'}</span>
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && children.length > 0 && (
            <div className="p-4 border-t border-slate-100">
              <Pagination meta={meta} onPageChange={(p) => setPage(p)} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
