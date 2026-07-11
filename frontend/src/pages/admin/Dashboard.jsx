import { useEffect, useState } from 'react';
import {
  Users,
  BedDouble,
  CheckCircle2,
  Clock,
  MessageSquare,
  Star,
} from 'lucide-react';

import api, { getErrorMessage } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { FullPageSpinner } from '@/components/Spinner';

const CARDS = [
  { key: 'totalRegistrations', label: 'Total Registrations', icon: Users, color: 'text-blue-600 bg-blue-100' },
  { key: 'devoteesRequiringStay', label: 'Requiring Stay', icon: BedDouble, color: 'text-purple-600 bg-purple-100' },
  { key: 'assignedRooms', label: 'Assigned Rooms', icon: CheckCircle2, color: 'text-green-600 bg-green-100' },
  { key: 'pendingAssignments', label: 'Pending Assignments', icon: Clock, color: 'text-yellow-600 bg-yellow-100' },
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
