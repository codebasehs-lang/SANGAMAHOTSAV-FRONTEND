import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Simple pagination control driven by a meta object. */
export default function Pagination({ meta, onPageChange }) {
  if (!meta) return null;
  const { page, totalPages, total } = meta;

  return (
    <div className="flex items-center justify-between px-2 py-3">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.hasPrevPage}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(page + 1)}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
