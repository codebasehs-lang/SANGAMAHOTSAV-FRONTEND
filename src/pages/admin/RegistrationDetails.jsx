import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import api, { getErrorMessage } from '@/lib/api';
import { humanize, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import StatusBadge from '@/components/StatusBadge';
import { FullPageSpinner } from '@/components/Spinner';

function Row({ label, value }) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b py-2 text-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 font-medium">{value || '-'}</dd>
    </div>
  );
}

export default function RegistrationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reg, setReg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/registrations/${id}`);
        setReg(data.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <FullPageSpinner />;
  if (error) return <p className="text-destructive">{error}</p>;
  if (!reg) return null;

  const services = Array.isArray(reg.services)
    ? reg.services.map(humanize).join(', ')
    : '';
  const family = Array.isArray(reg.familyMembers)
    ? reg.familyMembers.map((m) => `${m.name} (${m.age})`).join(', ')
    : '';

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{reg.name}</h1>
        <StatusBadge status={reg.accommodationStatus} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal & Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <Row label="Name" value={reg.name} />
              <Row label="Age" value={reg.age} />
              {/* <Row label="Initiated Name" value={reg.initiatedName} /> */}
              <Row label="Category" value={humanize(reg.devoteeCategory)} />
              <Row label="Mobile" value={reg.mobileNumber} />
              <Row label="Coming From" value={reg.comingFrom} />
              <Row label="Facilitator" value={reg.facilitatorName} />
              <Row label="Family Members" value={family} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Travel & Accommodation</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <Row label="Arrival" value={`${formatDate(reg.arrivalDate)} ${reg.arrivalTime || ''}`} />
              <Row label="Departure" value={`${formatDate(reg.departureDate)} ${reg.departureTime || ''}`} />
              <Row label="Non Attending" value={humanize(reg.nonAttendingType)} />
              <Row label="Shared Accom." value={humanize(reg.sharedAccommodation)} />
              <Row label="Family Accom." value={humanize(reg.familyAccommodation)} />
              <Row label="Additional Family Accom." value={humanize(reg.additionalFamilyAccommodation)} />
              <Row label="Journey Prasad" value={reg.needJourneyPrasad ? 'Yes' : 'No'} />
              <Row label="Own 4-Wheeler" value={reg.ownFourWheeler ? 'Yes' : 'No'} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seminar & Service</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <Row
                label="Preferred Subject"
                value={
                  reg.preferredSubject === 'OTHER'
                    ? reg.preferredSubjectOther
                    : humanize(reg.preferredSubject)
                }
              />
              <Row label="Services" value={services} />
              <Row label="Amount Paid" value={reg.amountPaid} />
              <Row label="Comments" value={reg.comments} />
            </dl>
          </CardContent>
        </Card>

        {reg.assignment && (
          <Card>
            <CardHeader>
              <CardTitle>Assigned Accommodation</CardTitle>
            </CardHeader>
            <CardContent>
              <dl>
                <Row label="Hotel" value={reg.assignment.hotelName} />
                <Row label="Address" value={reg.assignment.hotelAddress} />
                <Row label="Room" value={reg.assignment.roomNumber} />
                <Row label="Map" value={reg.assignment.hotelMapLink} />
                <Row label="Status" value={humanize(reg.assignment.status)} />
              </dl>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
