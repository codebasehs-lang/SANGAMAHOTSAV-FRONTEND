import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, Eye } from 'lucide-react';

import api, { getErrorMessage, tokenStore } from '@/lib/api';
import { humanize, formatDate } from '@/lib/utils';
import { ACCOMMODATION_STATUS, DEVOTEE_CATEGORY } from '@/lib/constants';
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

export default function Registrations() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="space-y-4">
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
                  <TableHead>Status</TableHead>
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
                      <StatusBadge status={r.accommodationStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/registrations/${r.id}`)}
                      >
                        <Eye className="h-4 w-4" /> View
                      </Button>
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
