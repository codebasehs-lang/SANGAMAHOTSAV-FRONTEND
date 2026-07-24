import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, CheckCircle2, CircleAlert, X } from 'lucide-react';

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
} from '@/lib/constants';
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
  devoteeCategory: z.enum(['DISCIPLE', 'NON_DISCIPLE']),
  familyMembers: z
    .array(
      z.object({
        name: z.string().optional(),
        age: z.coerce.number().min(0).max(120).optional(),
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
  amountPaid: z.coerce.number().min(0).optional(),
  paymentReferenceId: z.string().max(100).optional(),
  payeeAccountName: z.string().max(150).optional(),
  paymentScreenshot: z.instanceof(File).optional(),
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

function RadioGroup({ label, name, options, selectedValue, onSelect, error }) {
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
              onChange={() => onSelect(name, opt.value)}
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
      needJourneyPrasad: false,
      ownFourWheeler: false,
      arrivalDate: '2026-10-02',
      arrivalTime: '08:00',
      departureDate: '2026-10-07',
      departureTime: '14:00',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'familyMembers',
  });

  const preferredSubject = watch('preferredSubject');
  const additionalFamilyAccommodation = watch('additionalFamilyAccommodation');
  const selectedServices = watch('services') || [];
  const nonAttendingType = watch('nonAttendingType');
  const sharedAccommodation = watch('sharedAccommodation');
  const familyAccommodation = watch('familyAccommodation');

  const selectedAccommodation =
    nonAttendingType || sharedAccommodation || familyAccommodation || '';

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

  async function onSubmit(values) {
    setServerError('');
    setShowErrorToast(false);
    try {
      const formData = new FormData();

      // Append all scalar fields, skipping empty/undefined
      const skip = new Set(['familyMembers', 'services', 'paymentScreenshot']);
      for (const [key, val] of Object.entries(values)) {
        if (skip.has(key)) continue;
        if (val === '' || val === undefined || val === null) continue;
        formData.append(key, val);
      }

      // Array fields
      const members = (values.familyMembers || []).filter((m) => m.name);
      formData.append('familyMembers', JSON.stringify(members));
      const services = values.services || [];
      formData.append('services', JSON.stringify(services));

      // File
      if (values.paymentScreenshot instanceof File) {
        formData.append('paymentScreenshot', values.paymentScreenshot);
      }

      await api.post('/registrations', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
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
    <div className="container max-w-3xl py-10">
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

      <div className="mb-6 rounded-xl border bg-primary/5 p-4 text-center">
        <p className="font-semibold text-primary">{EVENT_INFO.title}</p>
        <p className="text-sm text-muted-foreground">{EVENT_INFO.gurudeva}</p>
        <p className="mt-2 text-sm">
          {EVENT_INFO.startDate} ({EVENT_INFO.startTime}) &ndash;{' '}
          {EVENT_INFO.endDate} ({EVENT_INFO.endTime})
        </p>
        <p className="text-sm text-muted-foreground">{EVENT_INFO.venue}</p>
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
              onClick={() => append({ name: '', age: '' })}
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
              <div key={f.id} className="flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-xs">Name</Label>
                  <Input {...register(`familyMembers.${i}.name`)} />
                </div>
                <div className="w-24">
                  <Label className="text-xs">Age</Label>
                  <Input type="number" {...register(`familyMembers.${i}.age`)} />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(i)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
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
              <Input type="date" {...register('arrivalDate')} />
            </Field>
            <Field label="Arrival Time" error={errors.arrivalTime}>
              <Input type="time" {...register('arrivalTime')} />
            </Field>
            <Field label="Departure Date" error={errors.departureDate}>
              <Input type="date" {...register('departureDate')} />
            </Field>
            <Field label="Departure Time" error={errors.departureTime}>
              <Input type="time" {...register('departureTime')} />
            </Field>
          </CardContent>
        </Card>

        {/* Accommodation */}
        <Card>
          <CardHeader>
            <CardTitle>Accommodation Preferences</CardTitle>
            <CardDescription>
              Please select only one option from the 7 accommodation choices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              label="Without Accommodation / Non Attending"
              name="nonAttendingType"
              options={NON_ATTENDING_TYPE}
              selectedValue={selectedAccommodation}
              onSelect={selectAccommodation}
              error={errors.nonAttendingType}
            />
            <div className="space-y-2">
              <RadioGroup
                label="Shared Accommodation (Common utility + Prasadam)"
                name="sharedAccommodation"
                options={SHARED_ACCOMMODATION}
                selectedValue={selectedAccommodation}
                onSelect={selectAccommodation}
                error={errors.sharedAccommodation}
              />
              {/* Dormitory note — always visible under shared options */}
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
              label="Family Accommodation (Common utility + Prasadam)"
              name="familyAccommodation"
              options={FAMILY_ACCOMMODATION}
              selectedValue={selectedAccommodation}
              onSelect={selectAccommodation}
              error={errors.familyAccommodation}
            />
            <div className="space-y-1.5">
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

        {/* Seminar interest */}
        <Card>
          <CardHeader>
            <CardTitle>Seminar & Service</CardTitle>
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
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
            <CardDescription>
              Please make your payment using the details below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-primary/10 p-4 text-sm space-y-2">
              <p>
                <span className="font-semibold">Bank Account Number:</span>{' '}
                {PAYMENT_INFO.bankAccountNumber}
              </p>
              <p>
                <span className="font-semibold">Account Name:</span>{' '}
                {PAYMENT_INFO.accountName}
              </p>
              <p>
                <span className="font-semibold">IFSC Code:</span>{' '}
                {PAYMENT_INFO.ifscCode}
              </p>
              <p>
                <span className="font-semibold">PhonePe / UPI Mobile Number:</span>{' '}
                {PAYMENT_INFO.phonePeUpiMobileNumber}
              </p>
            </div>

            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowQrModal(true)}
                className="w-full sm:w-auto"
              >
                Scan and Pay
              </Button>
            </div>

            <Modal
              open={showQrModal}
              onClose={() => setShowQrModal(false)}
              title="Scan and Pay"
              className="qr-modal"
            >
              <div className="qr-modal-content">
                <p className="qr-modal-text">
                  Scan the QR code below to donate via PhonePe / UPI.
                </p>
                <img
                  src="/images/QR.png"
                  alt="PhonePe / UPI QR code"
                  className="qr-modal-image"
                />
              </div>
            </Modal>

            <Field label="Amount Paid" error={errors.amountPaid}>
              <Input type="number" step="0.01" {...register('amountPaid')} />
            </Field>
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

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Registration'}
        </Button>
      </form>
    </div>
  );
}
