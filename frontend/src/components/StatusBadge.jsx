import { Badge } from '@/components/ui/badge';
import { humanize } from '@/lib/utils';

const VARIANTS = {
  ASSIGNED: 'success',
  PENDING: 'warning',
  NOT_REQUIRED: 'secondary',
  COMPLETED: 'success',
  FAILED: 'destructive',
  PROCESSING: 'warning',
  SENT: 'success',
};

/** Renders an enum status value as a colored badge. */
export default function StatusBadge({ status }) {
  if (!status) return null;
  return <Badge variant={VARIANTS[status] || 'secondary'}>{humanize(status)}</Badge>;
}
