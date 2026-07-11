import { useEffect, useState, useCallback } from 'react';
import { Search, Download, Star } from 'lucide-react';

import api, { getErrorMessage, tokenStore } from '@/lib/api';
import { formatDate } from '@/lib/utils';
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

const RATINGS = [
  { value: '5', label: '5 Stars' },
  { value: '4', label: '4 Stars' },
  { value: '3', label: '3 Stars' },
  { value: '2', label: '2 Stars' },
  { value: '1', label: '1 Star' },
];

function Stars({ count }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((v) => (
        <Star
          key={v}
          className={
            v <= count
              ? 'h-4 w-4 fill-yellow-400 text-yellow-400'
              : 'h-4 w-4 text-muted-foreground'
          }
        />
      ))}
    </span>
  );
}

export default function FeedbackList() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/feedbacks', {
        params: { search, rating, page, limit: 20 },
      });
      setRows(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, rating, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleExport() {
    const res = await fetch(
      `/api/v1/feedbacks/export?search=${encodeURIComponent(
        search
      )}&rating=${rating}`,
      { headers: { Authorization: `Bearer ${tokenStore.get()}` } }
    );
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'feedback.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Feedback</h1>
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
              placeholder="Search name or mobile..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
          <Select
            className="w-40"
            options={RATINGS}
            placeholder="All ratings"
            value={rating}
            onChange={(e) => {
              setPage(1);
              setRating(e.target.value);
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
              No feedback found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Suggestions</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell>{f.mobileNumber}</TableCell>
                    <TableCell>
                      <Stars count={f.overallRating} />
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {f.suggestions || '-'}
                    </TableCell>
                    <TableCell>{formatDate(f.createdAt)}</TableCell>
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
