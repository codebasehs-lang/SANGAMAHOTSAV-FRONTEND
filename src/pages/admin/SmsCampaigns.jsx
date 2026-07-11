import { useEffect, useState, useCallback } from 'react';
import { Send, MessageSquare, Search, X } from 'lucide-react';

import api, { getErrorMessage } from '@/lib/api';
import { formatDate, humanize } from '@/lib/utils';
import { SMS_CAMPAIGN_TYPE } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import StatusBadge from '@/components/StatusBadge';
import { Spinner } from '@/components/Spinner';

export default function SmsCampaigns() {
  const [type, setType] = useState('ACCOMMODATION');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('ALL'); // 'ALL' | 'SELECTED'
  const [selected, setSelected] = useState([]); // [{ id, name, mobileNumber }]

  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadCampaigns() {
    setLoading(true);
    try {
      const { data } = await api.get('/sms/campaigns', { params: { limit: 20 } });
      setCampaigns(data.data);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  const runSearch = useCallback(async () => {
    if (audience !== 'SELECTED' || search.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await api.get('/registrations', {
        params: { search: search.trim(), limit: 10 },
      });
      setResults(data.data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [search, audience]);

  useEffect(() => {
    const t = setTimeout(runSearch, 300);
    return () => clearTimeout(t);
  }, [runSearch]);

  function toggleRecipient(reg) {
    setSelected((prev) =>
      prev.some((r) => r.id === reg.id)
        ? prev.filter((r) => r.id !== reg.id)
        : [
            ...prev,
            { id: reg.id, name: reg.name, mobileNumber: reg.mobileNumber },
          ]
    );
  }

  async function send() {
    setSending(true);
    setError('');
    setResult(null);
    try {
      const payload = { type };
      if (type === 'CUSTOM') payload.message = message;
      if (audience === 'SELECTED')
        payload.registrationIds = selected.map((r) => r.id);

      const { data } = await api.post('/sms/campaigns', payload);
      setResult(data.data);
      setMessage('');
      setSelected([]);
      setSearch('');
      setResults([]);
      loadCampaigns();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  const disableSend =
    sending ||
    (type === 'CUSTOM' && !message.trim()) ||
    (audience === 'SELECTED' && selected.length === 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">SMS Campaigns</h1>

      <Card>
        <CardHeader>
          <CardTitle>Send Bulk SMS</CardTitle>
          <CardDescription>
            Send to all eligible devotees, or search and pick specific
            recipients. Accommodation SMS is sent only to devotees with an
            assigned room.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[240px] space-y-1.5">
              <Label>Campaign Type</Label>
              <Select
                options={SMS_CAMPAIGN_TYPE}
                value={type}
                onChange={(e) => setType(e.target.value)}
              />
            </div>
            <div className="min-w-[240px] space-y-1.5">
              <Label>Recipients</Label>
              <Select
                options={[
                  { value: 'ALL', label: 'All eligible devotees' },
                  { value: 'SELECTED', label: 'Selected recipients' },
                ]}
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            </div>
          </div>

          {type === 'CUSTOM' && (
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea
                rows={4}
                maxLength={1000}
                placeholder="Type your message. Use {{name}} to insert the devotee's name."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {message.length}/1000 characters
              </p>
            </div>
          )}

          {audience === 'SELECTED' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Search by name or phone number</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Type at least 2 characters..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {searching ? (
                <div className="flex justify-center py-3">
                  <Spinner className="h-5 w-5 text-primary" />
                </div>
              ) : (
                results.length > 0 && (
                  <div className="max-h-56 overflow-y-auto rounded-md border">
                    {results.map((r) => {
                      const checked = selected.some((s) => s.id === r.id);
                      return (
                        <label
                          key={r.id}
                          className="flex cursor-pointer items-center gap-3 border-b px-3 py-2 text-sm last:border-b-0 hover:bg-accent"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={checked}
                            onChange={() => toggleRecipient(r)}
                          />
                          <span className="font-medium">{r.name}</span>
                          <span className="ml-auto text-muted-foreground">
                            {r.mobileNumber}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )
              )}

              {selected.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Selected ({selected.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {selected.map((r) => (
                      <Badge key={r.id} variant="secondary" className="gap-1">
                        {r.name} · {r.mobileNumber}
                        <button
                          type="button"
                          onClick={() => toggleRecipient(r)}
                          className="ml-1 rounded-full hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <Button onClick={send} disabled={disableSend}>
              <Send className="h-4 w-4" />
              {sending ? 'Sending...' : 'Send Campaign'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {result && (
        <div className="rounded-md border border-green-500/50 bg-green-50 p-3 text-sm text-green-800">
          Campaign #{result.campaignId} processed — {result.sentCount} sent,{' '}
          {result.failedCount} failed of {result.totalRecipients}.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Recent Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-6 w-6 text-primary" />
            </div>
          ) : campaigns.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground">
              No campaigns sent yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>#{c.id}</TableCell>
                    <TableCell>{humanize(c.type)}</TableCell>
                    <TableCell>{c.totalRecipients}</TableCell>
                    <TableCell>{c.sentCount}</TableCell>
                    <TableCell>{c.failedCount}</TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell>{formatDate(c.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
