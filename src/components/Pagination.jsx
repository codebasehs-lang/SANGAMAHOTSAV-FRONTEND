import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Pagination control driven by a meta object. */
export default function Pagination({ meta, onPageChange }) {
  if (!meta) return null;

  const { page, totalPages, total } = meta;
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);
  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);

  return (
    <div className="flex flex-col gap-3 px-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages} · {total} total
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.hasPrevPage}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Prev
        </Button>

        {pageNumbers.map((pageNumber) => (
          <Button
            key={pageNumber}
            variant={pageNumber === page ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(page + 1)}
        >
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
