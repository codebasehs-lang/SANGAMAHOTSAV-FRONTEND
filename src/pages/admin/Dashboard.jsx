import { useEffect, useState } from 'react';
import {
  Users,
  BedDouble,
  CheckCircle2,
  Clock,
  MessageSquare,
  Star,
  IndianRupee,
} from 'lucide-react';

import api, { getErrorMessage } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { FullPageSpinner } from '@/components/Spinner';

const CARDS = [
  { key: 'devoteesRequiringStay', label: 'Requiring Stay', icon: BedDouble, color: 'text-purple-600 bg-purple-100' },
  { key: 'assignedRooms', label: 'Assigned Rooms', icon: CheckCircle2, color: 'text-green-600 bg-green-100' },
  { key: 'pendingAssignments', label: 'Pending Assignments', icon: Clock, color: 'text-yellow-600 bg-yellow-100' },
  { key: 'paymentsNeedingApproval', label: 'Payments Pending Approval', icon: IndianRupee, color: 'text-red-600 bg-red-100' },
  { key: 'smsSent', label: 'SMS Sent', icon: MessageSquare, color: 'text-orange-600 bg-orange-100' },
  { key: 'feedbackReceived', label: 'Feedback Received', icon: Star, color: 'text-pink-600 bg-pink-100' },
];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/dashboard/summary');
        setSummary(data.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <FullPageSpinner />;
  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of Sangamahotsav.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Registrations — with Disciple / Non-Disciple breakdown */}
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg p-3 text-blue-600 bg-blue-100">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary?.totalRegistrations ?? 0}</p>
              <p className="text-sm text-muted-foreground">Total Registrations</p>
              <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                <span>
                  Disciple:{' '}
                  <span className="font-semibold text-foreground">
                    {summary?.discipleRegistrations ?? 0}
                  </span>
                </span>
                <span>
                  Non-Disciple:{' '}
                  <span className="font-semibold text-foreground">
                    {summary?.nonDiscipleRegistrations ?? 0}
                  </span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Laxmi Received — total approved amount */}
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg p-3 text-emerald-600 bg-emerald-100">
              <IndianRupee className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                ₹ {Number(summary?.totalAmountReceived ?? 0).toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-muted-foreground">Laxmi Received</p>
              <p className="text-xs text-muted-foreground">(Approved payments only)</p>
            </div>
          </CardContent>
        </Card>

        {CARDS.map(({ key, label, icon: Icon, color }) => (
          <Card key={key}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`rounded-lg p-3 ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary?.[key] ?? 0}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
