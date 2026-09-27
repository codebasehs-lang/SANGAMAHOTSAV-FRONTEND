import { useEffect, useState, useCallback } from 'react';
import { Send, MessageSquare, Search, X } from 'lucide-react';

import api, { getErrorMessage } from '@/lib/api';
import { formatDate, humanize, currency } from '@/lib/utils';
import { SMS_CAMPAIGN_TYPE } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
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

const MESSAGE_CHANNEL_OPTIONS = [
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'APPLICATION', label: 'Application (Notice Board)' },
  { value: 'SMS', label: 'SMS' },
];

export default function SmsCampaigns() {
  const { isViewer } = useAuth();
  const [type, setType] = useState('ACCOMMODATION');
  const [channel, setChannel] = useState('WHATSAPP');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('ALL'); // 'ALL' | 'SELECTED'
  const [selected, setSelected] = useState([]); // [{ id, name, mobileNumber }]
  const [donationRecipients, setDonationRecipients] = useState([]);
  const [loadingDonationRecipients, setLoadingDonationRecipients] = useState(false);
  const [donationRecipientError, setDonationRecipientError] = useState('');

  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const isApplicationChannel = channel === 'APPLICATION';

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

  useEffect(() => {
    if (type !== 'DONATION') return undefined;

    let active = true;
    setLoadingDonationRecipients(true);
    setDonationRecipientError('');
    api
      .get('/sms/donation-only-recipients')
      .then(({ data }) => {
        if (active) setDonationRecipients(data.data);
      })
      .catch((err) => {
        if (active) {
          setDonationRecipients([]);
          setDonationRecipientError(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (active) setLoadingDonationRecipients(false);
      });

    return () => {
      active = false;
    };
  }, [type]);

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
      const payload = { type, channel };
      if (type === 'CUSTOM' || isApplicationChannel) payload.message = message;
      if (type === 'DONATION' || (!isApplicationChannel && audience === 'SELECTED'))
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
    (isApplicationChannel && !message.trim()) ||
    (type === 'DONATION' &&
      (loadingDonationRecipients || selected.length === 0)) ||
    (audience === 'SELECTED' && selected.length === 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">SMS Campaigns</h1>

      {!isViewer ? (
        <Card>
          <CardHeader>
            <CardTitle>Send Bulk Message</CardTitle>
            <CardDescription>
              Send to all eligible devotees, or search and pick specific
              recipients. Accommodation messages are sent only to devotees with an
              assigned room. Application channel posts directly to Notice Board.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <Select
                options={MESSAGE_CHANNEL_OPTIONS}
                value={channel}
                disabled={type === 'DONATION'}
                onChange={(e) => {
                  const nextChannel = e.target.value;
                  setChannel(nextChannel);
                  if (nextChannel === 'APPLICATION') {
                    setAudience('ALL');
                    setSelected([]);
                    setSearch('');
                    setResults([]);
                  }
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Campaign Type</Label>
              <Select
                options={SMS_CAMPAIGN_TYPE}
                value={type}
                onChange={(e) => {
                  const nextType = e.target.value;
                  setType(nextType);
                  setSelected([]);
                  if (nextType === 'DONATION') {
                    setChannel('WHATSAPP');
                    setAudience('DONATION_ONLY');
                  } else if (type === 'DONATION') {
                    setAudience('ALL');
                  }
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Recipients</Label>
              <Select
                options={[
                  { value: 'ALL', label: 'All eligible devotees' },
                  { value: 'SELECTED', label: 'Selected recipients' },
                  { value: 'DONATION_ONLY', label: 'Approved donors not attending' },
                ]}
                value={audience}
                onChange={(e) => {
                  const nextAudience = e.target.value;
                  setAudience(nextAudience);
                  setSelected([]);
                  if (nextAudience === 'DONATION_ONLY') {
                    setType('DONATION');
                    setChannel('WHATSAPP');
                  } else if (audience === 'DONATION_ONLY') {
                    setType('ACCOMMODATION');
                  }
                }}
                disabled={isApplicationChannel}
              />
            </div>
          </div>

          {type === 'DONATION' && (
            <div className="space-y-3 rounded-md border p-3">
              <div>
                <p className="font-medium">Donation thank-you recipients</p>
                <p className="text-sm text-muted-foreground">
                  Approved registrations marked as not attending, with at least one
                  donation item. Select the people who should receive the Meta
                  donation template.
                </p>
                <p className="mt-2 whitespace-pre-line rounded-md bg-muted p-3 text-sm">
                  {`Hare Krishna! 🙏

Dear {{1}},

Thank you for your generous donation towards Sanga Mahotsav 2026. Though you will not be attending the event, your support is greatly appreciated and helps make this festival possible.

We pray for the blessings of Sri Sri Krishna Balaram upon you and your family.

Sanga Mahotsav Management Committee 🙏`}
                </p>
              </div>
              {donationRecipientError && (
                <p className="text-sm text-destructive">{donationRecipientError}</p>
              )}
              {loadingDonationRecipients ? (
                <div className="flex justify-center py-3">
                  <Spinner className="h-5 w-5 text-primary" />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>
                      Eligible donors: {donationRecipients.length} · Selected:{' '}
                      {selected.length}
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={donationRecipients.length === 0}
                        onClick={() =>
                          setSelected(
                            selected.length === donationRecipients.length
                              ? []
                              : donationRecipients.map(
                                  ({ id, name, mobileNumber }) => ({
                                    id,
                                    name,
                                    mobileNumber,
                                  })
                                )
                          )
                        }
                      >
                        {selected.length === donationRecipients.length &&
                        donationRecipients.length > 0
                          ? 'Clear selection'
                          : 'Select all'}
                      </Button>
                    </div>
                  </div>
                  {donationRecipients.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No approved donation-only recipients found.
                    </p>
                  ) : (
                    <div className="max-h-56 overflow-y-auto rounded-md border">
                      {donationRecipients.map((recipient) => (
                        <label
                          key={recipient.id}
                          className="flex cursor-pointer flex-wrap items-center gap-2 border-b px-3 py-2 text-sm last:border-b-0 hover:bg-accent sm:flex-nowrap"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={selected.some(
                              (entry) => entry.id === recipient.id
                            )}
                            onChange={() => toggleRecipient(recipient)}
                          />
                          <span className="max-w-full truncate font-medium sm:max-w-[45%]">
                            {recipient.name}
                          </span>
                          <span className="text-muted-foreground">
                            {recipient.mobileNumber}
                          </span>
                          <span className="text-muted-foreground sm:ml-auto">
                            Donation: {currency(recipient.donationAmount)}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {(type === 'CUSTOM' || isApplicationChannel) && (
            <div className="space-y-1.5">
              <Label>{isApplicationChannel ? 'Notice Message' : 'Message'}</Label>
              <Textarea
                rows={4}
                maxLength={1000}
                placeholder={
                  isApplicationChannel
                    ? 'Type the notice to display on devotee Notice Board.'
                    : "Type your message. Use {{name}} to insert the devotee's name."
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {message.length}/1000 characters
              </p>
            </div>
          )}

          {!isApplicationChannel && audience === 'SELECTED' && (
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
                          className="flex cursor-pointer flex-wrap items-center gap-2 border-b px-3 py-2 text-sm last:border-b-0 hover:bg-accent sm:flex-nowrap"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={checked}
                            onChange={() => toggleRecipient(r)}
                          />
                          <span className="max-w-full truncate font-medium sm:max-w-[60%]">{r.name}</span>
                          <span className="text-muted-foreground sm:ml-auto">
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
            <Button onClick={send} disabled={disableSend} className="w-full sm:w-auto">
              <Send className="h-4 w-4" />
              {sending
                ? 'Sending...'
                : type === 'DONATION'
                ? `Send donation thank-you (${selected.length})`
                : 'Send Campaign'}
            </Button>
          </div>
        </CardContent>
      </Card>
      ) : (
        <div className="rounded-md border bg-yellow-50 p-4 text-sm text-yellow-700">
          You have view-only access. Sending campaigns is restricted to Admins.
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {result && (
        <div className="rounded-md border border-green-500/50 bg-green-50 p-3 text-sm text-green-800">
          {result.channel === 'WHATSAPP'
            ? 'WhatsApp'
            : result.channel === 'APPLICATION'
            ? 'Application notice'
            : 'SMS'} campaign #{result.campaignId} processed - {result.sentCount} sent,{' '}
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
                  <TableHead>Channel</TableHead>
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
                    <TableCell>{c.channel || 'SMS'}</TableCell>
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
