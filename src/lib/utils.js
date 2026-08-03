import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes conditionally (shadcn convention). */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Format an ISO date string as a readable local date. */
export function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Convert an ENUM_KEY to a Title Case label. */
export function humanize(value) {
  if (!value) return '';
  return value
    .toString()
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Format a number as Indian Rupee currency. */
export function currency(value) {
  if (!value && value !== 0) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
