import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Minimal accessible modal (no external dependency).
 * Renders an overlay + centered panel when `open` is true.
 */
export function Modal({ open, onClose, title, children, className }) {
  React.useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 flex w-full max-w-2xl flex-col rounded-lg border bg-card shadow-lg',
          'max-h-[90vh]',
          className
        )}
      >
        {/* Sticky header */}
        <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
