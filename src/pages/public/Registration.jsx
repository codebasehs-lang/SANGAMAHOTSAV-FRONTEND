import { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, CheckCircle2, CircleAlert, X, MapPin, CalendarDays } from 'lucide-react';

import api, { getErrorMessage } from '@/lib/api';
import {
  DEVOTEE_CATEGORY,
  NON_ATTENDING_TYPE,
  SHARED_ACCOMMODATION,
  FAMILY_ACCOMMODATION,
  ADDITIONAL_FAMILY_ACCOMMODATION,
  PREFERRED_SUBJECT,
  SERVICES,
  PAYMENT_INFO,
  EVENT_INFO,
  DONATION_ITEMS,
} from '@/lib/constants';

const DORMITORY_OPTION = SHARED_ACCOMMODATION.find((opt) => opt.value === 'DORMITORY');
const SHARED_ACCOMMODATION_PER_DEVOTEE = SHARED_ACCOMMODATION.filter((opt) => opt.value !== 'DORMITORY');

const EXTRA_CHARGE_OPTIONS = [
  { value: 'EXTRA_DEVOTEE', label: 'Add extra devotee - ₹ 3500/-', amount: 3500 },
  { value: 'CHILD_12_PLUS', label: 'Children (+12 years) - ₹ 1000/-', amount: 1000 },
];

const MONTHS_SHORT = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function formatIsoToDisplayDate(isoDate) {
  if (!isoDate || typeof isoDate !== 'string') return '';
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return isoDate;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const monthLabel = MONTHS_SHORT[month - 1];

  if (!monthLabel || day < 1 || day > 31 || year < 1900) return isoDate;

  return `${String(day).padStart(2, '0')}-${monthLabel}-${year}`;
}

function parseDisplayDateToIso(displayDate) {
  if (!displayDate || typeof displayDate !== 'string') return '';
  const match = displayDate.trim().match(/^(\d{1,2})-([a-zA-Z]{3})-(\d{4})$/);
  if (!match) return '';

  const day = Number(match[1]);
  const monthToken = match[2].toLowerCase();
  const year = Number(match[3]);
  const monthIndex = MONTHS_SHORT.findIndex((m) => m.toLowerCase() === monthToken);

  if (monthIndex < 0 || day < 1 || day > 31 || year < 1900) return '';

  const testDate = new Date(year, monthIndex, day);
  if (
    testDate.getFullYear() !== year ||
    testDate.getMonth() !== monthIndex ||
    testDate.getDate() !== day
  ) {
    return '';
  }

  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function normalizeDateForApi(value) {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  return parseDisplayDateToIso(trimmed);
}

// donation items are exported from lib/constants.js

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.coerce.number().min(0).max(120),
  initiatedName: z.string().optional(),
  devoteeCategory: z.enum(['DISCIPLE', 'NON_DISCIPLE', 'BRAHMACHARI']),
  gender: z.enum(['MALE', 'FEMALE'], { required_error: 'Gender is required' }),
  familyMembers: z
    .array(
      z.object({
        name: z.string().optional(),
        age: z.coerce.number().min(0).max(120).optional(),
        devoteeCategory: z.string().min(1, 'Category is required'),
        gender: z.string().min(1, 'Gender is required'),
      })
    )
    .optional(),
  mobileNumber: z.string().regex(/^[0-9]{10,15}$/, 'Enter a valid 10-15 digit number'),
  comingFrom: z.string().min(1, 'This field is required'),
  facilitatorName: z.string().optional(),
  arrivalDate: z.string().optional(),
  arrivalTime: z.string().optional(),
  nonAttendingType: z.string().optional(),
  sharedAccommodation: z.string().optional(),
  familyAccommodation: z.string().optional(),
  additionalFamilyAccommodation: z.string().optional(),
  departureDate: z.string().optional(),
  departureTime: z.string().optional(),
  needJourneyPrasad: z.boolean().optional(),
  preferredSubject: z.string().optional(),
  preferredSubjectOther: z.string().optional(),
  services: z.array(z.string()).max(2, 'You can select up to 2 services only').optional(),
  ownFourWheeler: z.boolean().optional(),
  extraCharges: z.array(z.string()).optional(),
  selectedDonations: z.array(z.string()).optional(),
  customDonationAmount: z.string().optional(),
  customDonationPurpose: z.string().optional(),
  customDonationPurposeAmount: z.string().optional(),
  amountPaid: z.coerce.number({
    required_error: 'Amount paid is required',
    invalid_type_error: 'Amount paid is required',
  }).min(0, 'Amount paid must be at least 0'),
  paymentReferenceId: z.string().max(100).optional(),
  payeeAccountName: z.string().max(150).optional(),
  paymentScreenshot: z.any().optional(),
  comments: z.string().optional(),
});

function Field({ label, error, required, children }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}

function RadioGroup({ label, name, options, selectedValue, onSelect, error, disabled }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={selectedValue === opt.value}
              disabled={disabled}
              onChange={() => !disabled && onSelect(name, opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}

export default function Registration() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const arrivalDatePickerRef = useRef(null);
  const departureDatePickerRef = useRef(null);
  const paymentSectionRef = useRef(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      devoteeCategory: 'DISCIPLE',
      familyMembers: [],
      services: [],
      selectedDonations: [],
      extraCharges: [],
      amountPaid: 0,
      paymentScreenshot: undefined,
      customDonationAmount: '',
      customDonationPurpose: '',
      customDonationPurposeAmount: '',
      needJourneyPrasad: false,
      ownFourWheeler: false,
      arrivalDate: formatIsoToDisplayDate('2026-10-02'),
      arrivalTime: '08:00',
      departureDate: formatIsoToDisplayDate('2026-10-07'),
      departureTime: '14:00',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'familyMembers',
  });

  const preferredSubject = watch('preferredSubject');
  const selectedServices = watch('services') || [];
  const nonAttendingType = watch('nonAttendingType');
  const sharedAccommodation = watch('sharedAccommodation');
  const familyAccommodation = watch('familyAccommodation');
  const isBrahmachari = watch('devoteeCategory') === 'BRAHMACHARI';
  const isNonAttendingMode = Boolean(nonAttendingType);
  const extraCharges = watch('extraCharges') || [];
  const watchedAge = watch('age');
  const watchedFamilyMembers = watch('familyMembers') || [];

  const selectedAccommodation =
    nonAttendingType || sharedAccommodation || familyAccommodation || '';
  const selectedDonations = watch('selectedDonations') || [];
  const customDonationAmount = Number(watch('customDonationAmount') || 0);
  const customDonationPurposeAmount = Number(watch('customDonationPurposeAmount') || 0);

  const extraChargesTotal = EXTRA_CHARGE_OPTIONS.reduce(
    (sum, opt) => (extraCharges.includes(opt.value) ? sum + opt.amount : sum),
    0
  );

  // Comprehensive breakdown of all amount components shown below the total field
  const nonAttendingBreakdown = (() => {
    const parts = [];

    // Accommodation part
    if (nonAttendingType === 'NON_ATTENDING') {
      parts.push('Non attending devotee contribution ₹2,000');
    } else if (nonAttendingType === 'ATTENDING_NOT_STAYING') {
      parts.push('Attending but not staying ₹3,500');
    } else {
      const PRICES = {
        DORMITORY: 5000,
        NON_AC_SHARING: 6000,
        AC_SHARING: 7000,
        DELUXE_AC: 18000,
        PREMIUM_AC: 19500,
      };
      const accom = nonAttendingType || sharedAccommodation || familyAccommodation;
      if (accom && PRICES[accom]) parts.push(`Accommodation ₹${PRICES[accom].toLocaleString('en-IN')}`);
    }

    // Donation items
    for (const id of selectedDonations) {
      if (id === 'vyaspuja-dakshina') {
        const amt = Number(customDonationAmount) || 0;
        if (amt > 0) parts.push(`Vyaspuja Dakshina ₹${amt.toLocaleString('en-IN')}`);
      } else if (id === 'custom-purpose-donation') {
        const amt = Number(customDonationPurposeAmount) || 0;
        const purpose = (watch('customDonationPurpose') || '').trim();
        if (amt > 0) parts.push(`${purpose || 'Purpose'} ₹${amt.toLocaleString('en-IN')}`);
      } else {
        const item = DONATION_ITEMS.find((d) => d.id === id);
        if (item) parts.push(`${item.service} ₹${item.value.toLocaleString('en-IN')}`);
      }
    }

    // Extra charges
    for (const opt of EXTRA_CHARGE_OPTIONS) {
      if (extraCharges.includes(opt.value)) parts.push(`${opt.label} ₹${opt.amount.toLocaleString('en-IN')}`);
    }

    return parts.length ? parts.join(' + ') : null;
  })();

  function getDonationTotal(selectedIds, customAmount, customPurposeAmountValue) {
    return DONATION_ITEMS.reduce((sum, item) => {
      if (!selectedIds.includes(item.id)) return sum;
      if (item.id === 'vyaspuja-dakshina') {
        return sum + (Number(customAmount) || 0);
      }
      if (item.id === 'custom-purpose-donation') {
        return sum + (Number(customPurposeAmountValue) || 0);
      }
      return sum + item.value;
    }, 0);
  }

  const selectedDonationsTotal = getDonationTotal(selectedDonations, customDonationAmount, customDonationPurposeAmount);

  // When Brahmachari is selected, clear/disable unrelated fields
  useEffect(() => {
    if (isBrahmachari) {
      setValue('familyMembers', []);
      setValue('nonAttendingType', '');
      setValue('sharedAccommodation', '');
      setValue('familyAccommodation', '');
      setValue('extraCharges', []);
    }
  }, [isBrahmachari, setValue]);

  useEffect(() => {
    if (isNonAttendingMode) {
      setValue('sharedAccommodation', '');
      setValue('familyAccommodation', '');
      setValue('extraCharges', []);
      paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isNonAttendingMode, setValue]);

  useEffect(() => {
    const PRICES = {
      ATTENDING_NOT_STAYING: 3500,
      NON_ATTENDING: 2000,
      DORMITORY: 5000,
      NON_AC_SHARING: 6000,
      AC_SHARING: 7000,
      DELUXE_AC: 18000,
      PREMIUM_AC: 19500,
    };

    let total = 0;

    if (nonAttendingType === 'NON_ATTENDING') {
      total = PRICES.NON_ATTENDING;
    } else if (nonAttendingType === 'ATTENDING_NOT_STAYING') {
      total = PRICES.ATTENDING_NOT_STAYING;
    } else if (nonAttendingType) {
      total = PRICES[nonAttendingType] ?? 0;
    } else if (sharedAccommodation) {
      total = PRICES[sharedAccommodation] ?? 0;
    } else if (familyAccommodation) {
      total = PRICES[familyAccommodation] ?? 0;
    }

    const donationTotal = getDonationTotal(
      selectedDonations,
      Number(watch('customDonationAmount') || 0),
      Number(watch('customDonationPurposeAmount') || 0)
    );

    if (isBrahmachari) {
      setValue('amountPaid', donationTotal, { shouldDirty: true, shouldValidate: true });
      return;
    }

    total += donationTotal;
    total += extraChargesTotal;

    if (total > 0) {
      setValue('amountPaid', total, { shouldDirty: true, shouldValidate: true });
    } else {
      setValue('amountPaid', undefined, { shouldDirty: true, shouldValidate: true });
    }
  }, [
    nonAttendingType,
    sharedAccommodation,
    familyAccommodation,
    isBrahmachari,
    selectedDonations,
    customDonationAmount,
    customDonationPurposeAmount,
    extraChargesTotal,
    setValue,
  ]);

  function selectAccommodation(fieldName, value) {
    setValue('nonAttendingType', fieldName === 'nonAttendingType' ? value : '');
    setValue(
      'sharedAccommodation',
      fieldName === 'sharedAccommodation' ? value : ''
    );
    setValue(
      'familyAccommodation',
      fieldName === 'familyAccommodation' ? value : ''
    );
  }

  function openNativeDatePicker(inputRef) {
    if (!inputRef?.current) return;
    if (typeof inputRef.current.showPicker === 'function') {
      inputRef.current.showPicker();
      return;
    }
    inputRef.current.click();
  }

  async function onSubmit(values) {
    setServerError('');
    setShowErrorToast(false);
    try {
      const arrivalDateApi = normalizeDateForApi(values.arrivalDate);
      const departureDateApi = normalizeDateForApi(values.departureDate);

      if (values.arrivalDate && !arrivalDateApi) {
        setServerError('Please enter Arrival Date in dd-mon-yyyy format (example: 02-oct-2026).');
        setShowErrorToast(true);
        return;
      }

      if (values.departureDate && !departureDateApi) {
        setServerError('Please enter Departure Date in dd-mon-yyyy format (example: 07-oct-2026).');
        setShowErrorToast(true);
        return;
      }

      const formData = new FormData();

      // Append all scalar fields, skipping empty/undefined
      const skip = new Set(['familyMembers', 'services', 'paymentScreenshot', 'selectedDonations', 'extraCharges']);
      for (const [key, val] of Object.entries(values)) {
        if (skip.has(key)) continue;
        if (val === '' || val === undefined || val === null) continue;

        if (key === 'arrivalDate') {
          formData.append('arrivalDate', arrivalDateApi);
          continue;
        }

        if (key === 'departureDate') {
          formData.append('departureDate', departureDateApi);
          continue;
        }

        formData.append(key, val);
      }

      // Array fields
      const members = (values.familyMembers || []).filter((m) => m.name);
      formData.append('familyMembers', JSON.stringify(members));
      const services = values.services || [];
      formData.append('services', JSON.stringify(services));

      // Donation items: convert selected donation ids into objects with id + amount
      const selected = values.selectedDonations || [];
      if (selected.includes('vyaspuja-dakshina')) {
        const customAmount = Number(values.customDonationAmount);
        if (!Number.isFinite(customAmount) || customAmount <= 0) {
          setServerError('Please enter a valid amount for Vyaspuja Dakshina.');
          setShowErrorToast(true);
          return;
        }
      }
      if (selected.includes('custom-purpose-donation')) {
        const customAmount = Number(values.customDonationPurposeAmount);
        const purpose = (values.customDonationPurpose || '').trim();
        if (!Number.isFinite(customAmount) || customAmount <= 0) {
          setServerError('Please enter a valid amount for the custom purpose donation.');
          setShowErrorToast(true);
          return;
        }
        if (!purpose) {
          setServerError('Please enter a purpose for the custom purpose donation.');
          setShowErrorToast(true);
          return;
        }
      }

      const donationItems = selected.flatMap((id) => {
        if (id === 'vyaspuja-dakshina') {
          const customAmount = Number(values.customDonationAmount);
          if (!Number.isFinite(customAmount) || customAmount <= 0) {
            return [];
          }
          return [{ id, amount: customAmount }];
        }
        if (id === 'custom-purpose-donation') {
          const customAmount = Number(values.customDonationPurposeAmount);
          const purpose = (values.customDonationPurpose || '').trim();
          if (!Number.isFinite(customAmount) || customAmount <= 0 || !purpose) {
            return [];
          }
          return [{ id, amount: customAmount, purpose }];
        }

        const item = DONATION_ITEMS.find((d) => d.id === id);
        return item ? [{ id, amount: item.value }] : [];
      });
      if (donationItems.length) {
        formData.append('donationItems', JSON.stringify(donationItems));
      }
      const extraCharges = values.extraCharges || [];
      if (extraCharges.length) {
        formData.append('extraCharges', JSON.stringify(extraCharges));
      }

      // File
      if (values.paymentScreenshot instanceof File) {
        formData.append('paymentScreenshot', values.paymentScreenshot);
      }

      await api.post('/registrations', formData);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const details = err?.response?.data?.error?.details;
      if (Array.isArray(details) && details.length) {
        setServerError(
          details.map((d) => `${d.field}: ${d.message}`).join('  •  ')
        );
      } else {
        setServerError(getErrorMessage(err));
      }
      setShowErrorToast(true);
    }
  }

  if (submitted) {
    return (
      <div className="container max-w-2xl py-16">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
            <h2 className="text-2xl font-bold">Registration Submitted</h2>
            <p className="text-muted-foreground">
              Hare Krishna! Your registration has been received. You will receive
              your accommodation details via SMS.
            </p>
            <Button onClick={() => setSubmitted(false)}>
              Submit Another Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-10">
      {showErrorToast && serverError && (
        <div className="fixed right-4 top-20 z-50 w-[min(92vw,520px)] rounded-lg border border-destructive/40 bg-white p-3 shadow-xl">
          <div className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-destructive">Submission error</p>
              <p className="mt-0.5 break-words text-sm text-destructive">{serverError}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowErrorToast(false)}
              className="rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Close error popup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Devotee Registration</h1>
        <p className="text-muted-foreground">
          Please fill in your details for Sanga Mahotsav.
        </p>
      </div>

      <div className="relative mb-6 rounded-xl border bg-primary/5 p-4 text-center registration-card-with-corners">
        <div className="hero-top-corner hero-top-corner-left">
          <img src="/images/srilagurudev.png" alt="Sri Lal Gurudev" />
        </div>
        <div className="hero-top-corner hero-top-corner-right">
          <img src="/images/prabhupad.png" alt="Prabhupad" />
        </div>
        <p className="font-bold text-xl leading-tight text-primary">
          {EVENT_INFO.title}
        </p>
        <p className="text-sm font-medium text-emerald-700">{EVENT_INFO.gurudeva}</p>
        <p className="mt-2 text-sm font-semibold text-amber-900">
          {EVENT_INFO.startDate} ({EVENT_INFO.startTime}) &ndash;{' '}
          {EVENT_INFO.endDate} ({EVENT_INFO.endTime})
        </p>
        <button
          type="button"
          onClick={() => setShowMapModal(true)}
          className="mt-2 inline-flex items-center justify-center gap-2 text-sm font-medium text-sky-700 rounded border border-sky-200 px-3 py-1 hover:bg-sky-50 transition-colors"
        >
          <MapPin className="h-4 w-4 text-sky-700" />
          <span>{EVENT_INFO.venue}</span>
        </button>
      </div>

      {serverError && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Name" required error={errors.name}>
              <Input {...register('name')} placeholder="If Initiated, Please mention the initiated Name" />
            </Field>
            <Field label="Age" required error={errors.age}>
              <Input type="number" {...register('age')} />
            </Field>
            {/* <Field
              label="Initiated Name (if initiated)"
              error={errors.initiatedName}
            >
              <Input {...register('initiatedName')} />
            </Field> */}
            <Field label="Devotee Category" required error={errors.devoteeCategory}>
              <Select options={DEVOTEE_CATEGORY} {...register('devoteeCategory')} />
            </Field>
            <Field label="Mobile Number" required error={errors.mobileNumber}>
              <Input {...register('mobileNumber')} placeholder="10-digit mobile" />
            </Field>
            <Field label="Coming From (Place)" required error={errors.comingFrom}>
              <Input {...register('comingFrom')} />
            </Field>
            <Field label="Facilitator Name" error={errors.facilitatorName}>
              <Input {...register('facilitatorName')} placeholder="Name of the facilitator (optional)" />
            </Field>
            <Field label="Gender" required error={errors.gender}>
              <select
                {...register('gender')}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select</option>
                <option value="MALE">Prabhuji</option>
                <option value="FEMALE">Mataji</option>
              </select>
            </Field>
            <div className="space-y-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-4 py-3">
              <Label>Attendance Type</Label>
              <div className="flex flex-col gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="attendanceType"
                    checked={!isNonAttendingMode}
                    onChange={() =>
                      setValue('nonAttendingType', '', {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                  Regular attendee
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="attendanceType"
                    checked={nonAttendingType === 'NON_ATTENDING'}
                    onChange={() =>
                      setValue('nonAttendingType', 'NON_ATTENDING', {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                  Non attending devotee contribution - ₹ 2,000/-
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="attendanceType"
                    checked={nonAttendingType === 'ATTENDING_NOT_STAYING'}
                    onChange={() =>
                      setValue('nonAttendingType', 'ATTENDING_NOT_STAYING', {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                  Attending but not staying - ₹ 3,500/-
                </label>
              </div>
              <p className="text-xs text-emerald-800">
                Choosing a no-stay option skips accommodation selection and moves you to payment.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Family members */}
        <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Family Members / Relatives</CardTitle>
              <CardDescription>Add names along with age.</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: '', age: '', devoteeCategory: '', gender: '' })}
              disabled={isBrahmachari}
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No family members added.
              </p>
            )}
            {fields.map((f, i) => (
              <div key={f.id} className="grid grid-cols-1 gap-2 rounded-md border p-3 sm:grid-cols-[1fr_5rem_8rem_8rem_auto]">
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input {...register(`familyMembers.${i}.name`)} disabled={isBrahmachari} />
                </div>
                <div>
                  <Label className="text-xs">Age</Label>
                  <Input type="number" {...register(`familyMembers.${i}.age`)} disabled={isBrahmachari} />
                </div>
                <div>
                  <Label className="text-xs">Category</Label>
                  <select
                    {...register(`familyMembers.${i}.devoteeCategory`)}
                    disabled={isBrahmachari}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  >
                    <option value="">Select</option>
                    <option value="DISCIPLE">Disciple</option>
                    <option value="NON_DISCIPLE">Non-Disciple</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Gender</Label>
                  <select
                    {...register(`familyMembers.${i}.gender`)}
                    disabled={isBrahmachari}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  >
                    <option value="">Select</option>
                    <option value="MALE">Prabhuji</option>
                    <option value="FEMALE">Mataji</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(i)}
                    disabled={isBrahmachari}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Travel */}
        <Card>
          <CardHeader>
            <CardTitle>Travel Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Arrival Date" error={errors.arrivalDate}>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="dd-mon-yyyy"
                  value={watch('arrivalDate') || ''}
                  onChange={(e) =>
                    setValue('arrivalDate', e.target.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  onBlur={(e) => {
                    const normalized = normalizeDateForApi(e.target.value);
                    if (normalized) {
                      setValue('arrivalDate', formatIsoToDisplayDate(normalized), {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  }}
                />
                <input
                  ref={arrivalDatePickerRef}
                  type="date"
                  tabIndex={-1}
                  value={normalizeDateForApi(watch('arrivalDate')) || ''}
                  onChange={(e) =>
                    setValue('arrivalDate', formatIsoToDisplayDate(e.target.value), {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  className="pointer-events-none absolute h-0 w-0 opacity-0"
                  aria-hidden="true"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => openNativeDatePicker(arrivalDatePickerRef)}
                  aria-label="Open arrival date calendar"
                >
                  <CalendarDays className="h-4 w-4" />
                </button>
              </div>
            </Field>
            <Field label="Arrival Time" error={errors.arrivalTime}>
              <Input type="time" {...register('arrivalTime')} />
            </Field>
            <Field label="Departure Date" error={errors.departureDate}>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="dd-mon-yyyy"
                  value={watch('departureDate') || ''}
                  onChange={(e) =>
                    setValue('departureDate', e.target.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  onBlur={(e) => {
                    const normalized = normalizeDateForApi(e.target.value);
                    if (normalized) {
                      setValue('departureDate', formatIsoToDisplayDate(normalized), {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  }}
                />
                <input
                  ref={departureDatePickerRef}
                  type="date"
                  tabIndex={-1}
                  value={normalizeDateForApi(watch('departureDate')) || ''}
                  onChange={(e) =>
                    setValue('departureDate', formatIsoToDisplayDate(e.target.value), {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  className="pointer-events-none absolute h-0 w-0 opacity-0"
                  aria-hidden="true"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => openNativeDatePicker(departureDatePickerRef)}
                  aria-label="Open departure date calendar"
                >
                  <CalendarDays className="h-4 w-4" />
                </button>
              </div>
            </Field>
            <Field label="Departure Time" error={errors.departureTime}>
              <Input type="time" {...register('departureTime')} />
            </Field>
          </CardContent>
        </Card>

        {/* Seminar interest */}
        <Card>
          <CardHeader>
            <CardTitle>Choose A Seminar Topic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              label="Which subject would you like to hear from Gurudev?"
              error={errors.preferredSubject}
            >
              <Select
                options={PREFERRED_SUBJECT}
                placeholder="Select a subject"
                {...register('preferredSubject')}
              />
            </Field>
            {preferredSubject === 'OTHER' && (
              <Field label="Other subject" error={errors.preferredSubjectOther}>
                <Input {...register('preferredSubjectOther')} />
              </Field>
            )}
            <CardTitle>Services For The Pleasure of Guru and Gauranga</CardTitle>
            <div>
              <Label>Service you want to engage in (Select up to 2 only)</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                You can choose a maximum of 2 services.
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {SERVICES.map((s) => (
                  <label key={s.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      value={s.value}
                      disabled={
                        selectedServices.length >= 2 &&
                        !selectedServices.includes(s.value)
                      }
                      {...register('services')}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
              {errors.services && (
                <p className="mt-1 text-xs text-destructive">{errors.services.message}</p>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('needJourneyPrasad')} />
              Need Journey Prasad
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('ownFourWheeler')} />
              Coming with own 4-wheeler
            </label>
          </CardContent>
        </Card>

        

        {/* Accommodation */}
        <Card className={isNonAttendingMode ? 'opacity-60' : ''}>
          <CardHeader>
            <CardTitle>Accommodation Preferences</CardTitle>
            <CardDescription>
              {isNonAttendingMode
                ? 'Accommodation is disabled because non attending devotee contribution is selected.'
                : 'Please select only one option from the 7 accommodation choices.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <RadioGroup
                label="Dormitory (Prabhuji & Mataji)"
                name="sharedAccommodation"
                options={DORMITORY_OPTION ? [DORMITORY_OPTION] : []}
                selectedValue={selectedAccommodation}
                onSelect={selectAccommodation}
                disabled={isBrahmachari || isNonAttendingMode}
                error={errors.sharedAccommodation}
              />
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
                <p className="text-sm font-semibold text-amber-800">
                  📢 Important Note — Dormitory (Prabhuji &amp; Mataji)
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  Dormitory accommodation is <span className="font-semibold">gender-separated</span> (separate halls for Prabhuji &amp; Mataji).
                  Husband and wife <span className="font-semibold">must register individually</span> — each submitting their own separate registration form and selecting Dormitory.
                  Please do <span className="font-semibold">not</span> add your spouse as a family member if both of you are choosing Dormitory.<span className="font-semibold text-amber-900"> Brahmacharis</span> also <span className="font-semibold">must register individually</span> with their own separate registration form.
                </p>
              </div>
            </div>
            <RadioGroup
              label="Shared Accommodation Per Devotee (3 devotees per room Common utility + Prasadam)"
              name="sharedAccommodation"
              options={SHARED_ACCOMMODATION_PER_DEVOTEE}
              selectedValue={selectedAccommodation}
              onSelect={selectAccommodation}
              disabled={isBrahmachari || isNonAttendingMode}
              error={errors.sharedAccommodation}
            />

            <RadioGroup
              label="Family Accommodation (2 devotees Per Room Common utility + Prasadam)"
              name="familyAccommodation"
              options={FAMILY_ACCOMMODATION}
              selectedValue={selectedAccommodation}
              onSelect={selectAccommodation}
              disabled={isBrahmachari || isNonAttendingMode}
              error={errors.familyAccommodation}
            />
            {familyAccommodation && !isNonAttendingMode && (
              <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50/80 px-4 py-3 shadow-sm">
                {EXTRA_CHARGE_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-3 text-sm text-amber-950">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border border-slate-400 bg-white text-amber-600 accent-amber-600 focus:ring-2 focus:ring-amber-300"
                      value={opt.value}
                      {...register('extraCharges')}
                    />
                    <span className="font-medium">{opt.label}</span>
                  </label>
                ))}
                <p className="text-xs text-amber-700">
                  Select any additional charges for extra devotees or children over 12 years.
                </p>
              </div>
            )}
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
              <p className="font-semibold text-amber-900">Note:</p>
              <p className="mt-1 text-sm text-amber-800">
                One additional devotee may stay in AC Deluxe or Premium Rooms by paying only the Common Utility &amp; Prasadam charges. No extra accommodation charge will apply.
              </p>
            </div>
             {/* <div className="space-y-1.5">
              <Label>
                Additional Family Accommodation (charges only, for one
                additional devotee)
              </Label>
              <div className="flex flex-col gap-2">
                {ADDITIONAL_FAMILY_ACCOMMODATION.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={additionalFamilyAccommodation === opt.value}
                      onChange={(e) =>
                        setValue(
                          'additionalFamilyAccommodation',
                          e.target.checked ? opt.value : ''
                        )
                      }
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
               {errors.additionalFamilyAccommodation && (
                <p className="text-xs text-destructive">
                  {errors.additionalFamilyAccommodation.message}
                </p>
              )} 
            </div>  */}
          </CardContent>
        </Card>

        {/* Payment */}
        <div ref={paymentSectionRef}>
        <Card>
          <CardHeader>
            <CardTitle></CardTitle>
            <CardDescription>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="payment-summary-card">
              <div className="payment-summary-header">
                <span className="payment-summary-badge">Payment Details</span>
                <p className="payment-summary-description">
                  Use the below bank / UPI details to complete your registration payment.
                </p>
              </div>
              <div className="payment-details-grid">
                <div className="payment-detail-row">
                  <span className="payment-detail-label">Bank Account Number</span>
                  <span className="payment-detail-value">{PAYMENT_INFO.bankAccountNumber}</span>
                </div>
                <div className="payment-detail-row">
                  <span className="payment-detail-label">Bank Name</span>
                  <span className="payment-detail-value">{PAYMENT_INFO.bankName}</span>
                </div>
                <div className="payment-detail-row">
                  <span className="payment-detail-label">Branch Name</span>
                  <span className="payment-detail-value">{PAYMENT_INFO.branchName}</span>
                </div>
                <div className="payment-detail-row">
                  <span className="payment-detail-label">Account Name</span>
                  <span className="payment-detail-value">{PAYMENT_INFO.accountName}</span>
                </div>
                <div className="payment-detail-row">
                  <span className="payment-detail-label">IFSC Code</span>
                  <span className="payment-detail-value">{PAYMENT_INFO.ifscCode}</span>
                </div>
                <div className="payment-detail-row">
                  <span className="payment-detail-label">PhonePe / UPI Number</span>
                  <span className="payment-detail-value">{PAYMENT_INFO.phonePeUpiMobileNumber}</span>
                </div>
              </div>
              <p className="payment-note">
                Please pay the exact amount and keep your UTR / transaction reference for upload below.
              </p>
            </div>

            <Modal
              open={showMapModal}
              onClose={() => setShowMapModal(false)}
              title={EVENT_INFO.venue}
              className="max-w-2xl"
            >
              <div className="flex flex-col gap-3">
                <iframe
                  title="Venue Location"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(EVENT_INFO.venue)}&output=embed`}
                  className="w-full rounded border"
                  style={{ height: '400px' }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <a
                  href="https://maps.app.goo.gl/V2PUK7jpneTwQ5t8A"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-sky-700 hover:underline"
                >
                  <MapPin className="h-4 w-4" />
                  Open in Google Maps
                </a>
              </div>
            </Modal>

            <Modal
              open={showQrModal}
              onClose={() => setShowQrModal(false)}
              title="Scan and Pay"
              className="qr-modal"
            >
              <div className="qr-modal-content">
                <div className="qr-modal-header">
                  <p className="qr-modal-title">Scan to Pay</p>
                  <p className="qr-modal-subtitle">
                    Pay securely via PhonePe / UPI and support Sangamahotsav.
                  </p>
                </div>

                <div className="qr-modal-account-card">
                  <p className="qr-modal-account-label">Account Name</p>
                  <p className="qr-modal-account-value">Sandeep Kumar Gupta</p>
                  <p className="qr-modal-account-note">
                    Confirm this name in your UPI app before making the payment.
                  </p>
                </div>

                <img
                  src="/images/QR.png"
                  alt="PhonePe / UPI QR code"
                  className="qr-modal-image"
                />

                <p className="qr-modal-text">
                  Open PhonePe or any UPI app, scan the QR code above, and complete your donation.
                </p>
              </div>
            </Modal>

            <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">SANGA MAHOTSAVA / SEVA OPPORTUNITIES FOR OCT – 2026</p>
                  <p className="text-xs text-muted-foreground">Select any donation items to add to your registration amount.</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
                  Selected ₹{selectedDonationsTotal.toLocaleString()}
                </span>
              </div>
              <div className="grid gap-3">
                {DONATION_ITEMS.map((item) => {
                  const isCustomDonation = item.id === 'vyaspuja-dakshina';
                  const isCustomPurposeDonation = item.id === 'custom-purpose-donation';
                  const isSelected = (selectedDonations || []).includes(item.id);
                  const allowedForBrahmachari = ['vyaspuja-dakshina', 'custom-purpose-donation'];
                  const donationDisabled = isBrahmachari && !allowedForBrahmachari.includes(item.id);

                  return (
                    <label
                      key={item.id}
                      className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-slate-300"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold">{item.service}</p>
                          <p className="text-sm text-muted-foreground">{item.note}</p>
                        </div>
                        <span className="text-sm font-semibold">{item.amount}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            value={item.id}
                            {...register('selectedDonations')}
                            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                            disabled={donationDisabled}
                          />
                          <span className="text-sm">Add this donation</span>
                        </div>
                        {isCustomDonation && isSelected && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="Enter amount"
                              className="h-8 w-32"
                              {...register('customDonationAmount')}
                            />
                            <span className="text-xs text-muted-foreground">₹</span>
                          </div>
                        )}
                        {isCustomPurposeDonation && isSelected && (
                          <div className="flex flex-wrap items-center gap-2">
                            <Input
                              placeholder="Enter purpose"
                              className="h-8 w-40"
                              {...register('customDonationPurpose')}
                            />
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="Enter amount"
                              className="h-8 w-32"
                              {...register('customDonationPurposeAmount')}
                            />
                            <span className="text-xs text-muted-foreground">₹</span>
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Total Amount to be Paid <span className="text-destructive">*</span>
              </label>
              <div className="flex gap-3">
                <Input
                  type="number"
                  step="0.01"
                  {...register('amountPaid')}
                  className="flex-1 border-amber-300 bg-amber-50 text-amber-900 focus:border-amber-500 focus:ring-amber-200"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowQrModal(true)}
                  className="shrink-0 bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-lg shadow-amber-200/60 hover:from-orange-600 hover:to-amber-500"
                >
                  Scan and Pay
                </Button>
              </div>
              {nonAttendingBreakdown && (
                <p className="text-xs font-bold text-red-600">
                  Breakdown: {nonAttendingBreakdown}
                </p>
              )}
              {errors.amountPaid && (
                <p className="text-xs text-destructive">{errors.amountPaid.message}</p>
              )}
            </div>
            <Field label="Payment Reference ID" error={errors.paymentReferenceId}>
              <Input
                {...register('paymentReferenceId')}
                placeholder="Transaction / UTR reference number"
              />
            </Field>
            <Field
              label="Payee Account Name (Name as per bank account)"
              error={errors.payeeAccountName}
            >
              <Input
                {...register('payeeAccountName')}
                placeholder="Name as it appears in your bank account"
              />
            </Field>
            <Field label="Payment Screenshot" error={errors.paymentScreenshot}>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setValue('paymentScreenshot', file || undefined);
                  setScreenshotPreview(file ? URL.createObjectURL(file) : null);
                }}
              />
              {screenshotPreview && (
                <img
                  src={screenshotPreview}
                  alt="Payment screenshot preview"
                  className="mt-2 max-h-48 rounded-md border object-contain"
                />
              )}
            </Field>
            <Field label="Comments / Suggestions" error={errors.comments}>
              <Textarea rows={3} {...register('comments')} />
            </Field>
          </CardContent>
        </Card>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Registration'}
        </Button>
      </form>
    </div>
  );
}
