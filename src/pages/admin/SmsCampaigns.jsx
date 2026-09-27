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

const isTargetedTemplate = (type) =>
  type === 'DONATION' || type === 'NOT_STAYING';

export default function SmsCampaigns() {
  const { isViewer } = useAuth();
  const [type, setType] = useState('ACCOMMODATION');
  const [channel, setChannel] = useState('WHATSAPP');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('ALL');
  const [selected, setSelected] = useState([]); // [{ id, name, mobileNumber }]
  const [targetedRecipients, setTargetedRecipients] = useState([]);
  const [loadingTargetedRecipients, setLoadingTargetedRecipients] = useState(false);
  const [targetedRecipientError, setTargetedRecipientError] = useState('');

  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const isApplicationChannel = channel === 'APPLICATION';
  const isAnyDevotee = audience === 'ANY_DEVOTEE';
  const isCategoryAudience = isTargetedTemplate(type) && !isAnyDevotee;

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
    if (!isCategoryAudience) return undefined;

    let active = true;
    setLoadingTargetedRecipients(true);
    setTargetedRecipientError('');
    setTargetedRecipients([]);
    api
      .get(type === 'DONATION'
        ? '/sms/donation-only-recipients'
        : '/sms/not-staying-recipients')
      .then(({ data }) => {
        if (active) setTargetedRecipients(data.data);
      })
      .catch((err) => {
        if (active) {
          setTargetedRecipients([]);
          setTargetedRecipientError(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (active) setLoadingTargetedRecipients(false);
      });

    return () => {
      active = false;
    };
  }, [type, isCategoryAudience]);

  const runSearch = useCallback(async () => {
    if ((audience !== 'SELECTED' && !isAnyDevotee) || search.trim().length < 2) {
      setResults([]);
      setSearchError('');
      return;
    }
    setSearching(true);
    setSearchError('');
    try {
      const { data } = await api.get('/registrations', {
        params: { search: search.trim(), limit: 10 },
      });
      setResults(data.data);
    } catch (err) {
      setResults([]);
      setSearchError(getErrorMessage(err));
    } finally {
      setSearching(false);
    }
  }, [search, audience, isAnyDevotee]);

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
      if (isAnyDevotee) payload.recipientMode = 'ANY_DEVOTEE';
      if (isTargetedTemplate(type) || (!isApplicationChannel && (audience === 'SELECTED' || isAnyDevotee)))
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
    (isCategoryAudience &&
      (loadingTargetedRecipients || !!targetedRecipientError || selected.length === 0)) ||
    ((audience === 'SELECTED' || isAnyDevotee) && selected.length === 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">SMS Campaigns</h1>

      {!isViewer ? (
        <Card>
          <CardHeader>
            <CardTitle>Send Bulk Message</CardTitle>
            <CardDescription>
              Send to all eligible devotees, or search and pick specific
              recipients. Choose Any Devotee to send the selected campaign template
              to individually selected registrations regardless of category.
              Accommodation messages normally require an assigned room.
              Application channel posts directly to Notice Board.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <Select
                options={MESSAGE_CHANNEL_OPTIONS}
                value={channel}
                disabled={isTargetedTemplate(type)}
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
                  if (isTargetedTemplate(nextType)) {
                    setChannel('WHATSAPP');
                    if (!isAnyDevotee) {
                      setAudience(nextType === 'DONATION' ? 'DONATION_ONLY' : 'NOT_STAYING_ONLY');
                    }
                  } else if (isTargetedTemplate(type)) {
                    if (!isAnyDevotee) setAudience('ALL');
                  }
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Recipients</Label>
              <Select
                options={isTargetedTemplate(type)
                  ? [{
                      value: type === 'DONATION' ? 'DONATION_ONLY' : 'NOT_STAYING_ONLY',
                      label: type === 'DONATION'
                        ? 'All donors'
                        : 'All devotees attending without accommodation',
                    }, { value: 'ANY_DEVOTEE', label: 'Any Devotee (select individually)' }]
                  : [
                      { value: 'ALL', label: 'All eligible devotees' },
                      { value: 'SELECTED', label: 'Selected recipients' },
                      { value: 'DONATION_ONLY', label: 'All donors' },
                      { value: 'NOT_STAYING_ONLY', label: 'All devotees attending without accommodation' },
                      { value: 'ANY_DEVOTEE', label: 'Any Devotee (select individually)' },
                    ]}
                value={audience}
                onChange={(e) => {
                  const nextAudience = e.target.value;
                  setAudience(nextAudience);
                  setSelected([]);
                  if (nextAudience === 'DONATION_ONLY' || nextAudience === 'NOT_STAYING_ONLY') {
                    setType(nextAudience === 'DONATION_ONLY' ? 'DONATION' : 'NOT_STAYING');
                    setChannel('WHATSAPP');
                  } else if (isTargetedTemplate(type) && nextAudience !== 'ANY_DEVOTEE') {
                    setType('ACCOMMODATION');
                  }
                }}
                disabled={isApplicationChannel}
              />
            </div>
          </div>

          {isCategoryAudience && (
            <div className="space-y-3 rounded-md border p-3">
              <div>
                <p className="font-medium">
                  {type === 'DONATION'
                    ? 'Donation thank-you recipients'
                    : 'Attending without accommodation recipients'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {type === 'DONATION'
                    ? 'All devotees with at least one donation item, regardless of attendance or payment status (same list as the Donations page). Select the people who should receive the Meta donation template.'
                    : 'All devotees marked "Attending but not staying" on registration, regardless of payment status. Select the people who should receive the Meta non-staying confirmation template (requires an active seminar hall with a map link).'}
                </p>
                <p className="mt-2 whitespace-pre-line rounded-md bg-muted p-3 text-sm">
                  {type === 'DONATION' ? `Hare Krishna! 🙏

Dear {{1}},

Thank you for your generous donation towards Sanga Mahotsav 2026. Your support is greatly appreciated and helps make this festival possible.

We pray for the blessings of Sri Sri Krishna Balaram upon you and your family.

Sanga Mahotsav Management Committee 🙏` : `Hare Krishna!

Please accept our humble obeisances.

Dear {{1}},

Your registration for Sanga Mahotsav 2026 has been confirmed.

Seminar Hall Details
Hall: {{2}}
Map: {{3}}

We look forward to your participation in the seminar sessions and pray for a spiritually enriching experience.

Your Servants,
Sanga Mahotsav Management Committee`}
                </p>
              </div>
              {targetedRecipientError && (
                <p className="text-sm text-destructive">{targetedRecipientError}</p>
              )}
              {loadingTargetedRecipients ? (
                <div className="flex justify-center py-3">
                  <Spinner className="h-5 w-5 text-primary" />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>
                      Eligible {type === 'DONATION' ? 'donors' : 'non-staying devotees'}: {targetedRecipients.length} · Selected:{' '}
                      {selected.length}
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={targetedRecipients.length === 0}
                        onClick={() =>
                          setSelected(
                            selected.length === targetedRecipients.length
                              ? []
                              : targetedRecipients.map(
                                  ({ id, name, mobileNumber }) => ({
                                    id,
                                    name,
                                    mobileNumber,
                                  })
                                )
                          )
                        }
                      >
                        {selected.length === targetedRecipients.length &&
                        targetedRecipients.length > 0
                          ? 'Clear selection'
                          : 'Select all'}
                      </Button>
                    </div>
                  </div>
                  {targetedRecipients.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {type === 'DONATION'
                        ? 'No donation records found.'
                        : 'No non-staying devotees found.'}
                    </p>
                  ) : (
                    <div className="max-h-56 overflow-y-auto rounded-md border">
                      {targetedRecipients.map((recipient) => (
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
                          {type === 'DONATION' && (
                            <span className="text-muted-foreground sm:ml-auto">
                              Donation: {currency(recipient.donationAmount)}
                            </span>
                          )}
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

          {!isApplicationChannel && (audience === 'SELECTED' || isAnyDevotee) && (
            <div className="space-y-3">
              {isAnyDevotee && (
                <p className="text-sm text-muted-foreground">
                  Only the devotees you select below will receive this campaign.
                  Category and payment filters do not apply in Any Devotee mode.
                </p>
              )}
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

              {searchError && (
                <p className="text-sm text-destructive">{searchError}</p>
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
                : type === 'NOT_STAYING'
                ? `Send non-staying confirmation (${selected.length})`
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
