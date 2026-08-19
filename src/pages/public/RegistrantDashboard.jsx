import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage, tokenStore } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Eye,
  EyeOff,
  User,
  MapPin,
  Menu,
  BadgeInfo,
  Building2,
  ListChecks,
  Wallet,
  KeyRound,
  Bell,
  Camera,
  Receipt,
  MessageSquare,
  Star,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { cn, currency } from '@/lib/utils';
import QRCode from 'qrcode';

const FAMILY_RELATIONSHIPS = [
  'Spouse',
  'Father',
  'Mother',
  'Son',
  'Daughter',
  'Brother',
  'Sister',
  'Friend',
  'God Brother',
  'God Sister',
  'Relative',
  'Other',
];

export default function RegistrantDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [activeSection, setActiveSection] = useState('notice');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [showProfilePhotoModal, setShowProfilePhotoModal] = useState(false);
  const [photoMessage, setPhotoMessage] = useState('');
  const [relationshipValues, setRelationshipValues] = useState({});
  const [relationshipSaving, setRelationshipSaving] = useState({});
  const [relationshipMessage, setRelationshipMessage] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [screenshotMessage, setScreenshotMessage] = useState('');
  const [feedbackForm, setFeedbackForm] = useState({ name: '', mobileNumber: '', overallRating: 0, suggestions: '' });
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const photoInputRef = useRef(null);
  const screenshotRef1 = useRef(null);
  const screenshotRef2 = useRef(null);
  const screenshotRef3 = useRef(null);

  const sections = [
    { key: 'basic', label: 'Basic Details', icon: BadgeInfo },
    { key: 'accommodation', label: 'Accommodation', icon: Building2 },
    { key: 'selections', label: 'Services', icon: ListChecks },
    { key: 'payment', label: 'Payment', icon: Wallet },
    { key: 'password', label: 'Change Password', icon: KeyRound },
    { key: 'notice', label: 'Notice Board', icon: Bell },
    { key: 'feedback', label: 'Feedback', icon: MessageSquare },
  ];
  const activeSectionMeta = sections.find((section) => section.key === activeSection) || sections[0];
  const cardClassName = 'border-emerald-100/80 bg-white/85 shadow-lg shadow-emerald-100/50 backdrop-blur';

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const { data } = await api.get('/registrant-auth/me');
        setProfile(data.data);
        if (data.data.checkinToken) {
          setQrCodeUrl(await QRCode.toDataURL(data.data.checkinToken, { width: 240, margin: 2 }));
        }
        const nextPhoto = data.data.profilePhoto || '';
        setProfilePhoto(nextPhoto);
        setShowProfilePhotoModal(!nextPhoto);
      } catch (err) {
        setError(getErrorMessage(err));
        tokenStore.clear();
        navigate('/registrant/login', { replace: true });
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [navigate]);

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordLoading(true);

    try {
      await api.put('/registrant-auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMessage('Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPasswordMessage(getErrorMessage(err));
    } finally {
      setPasswordLoading(false);
    }
  }

  function handleLogout() {
    tokenStore.clear();
    navigate('/registrant/login', { replace: true });
  }

  function selectSection(sectionKey) {
    setActiveSection(sectionKey);
    setIsNavOpen(false);
    if (sectionKey === 'feedback' && profile && !feedbackSubmitted) {
      setFeedbackForm((prev) => ({
        ...prev,
        name: prev.name || profile.initiatedName || profile.name || '',
        mobileNumber: prev.mobileNumber || profile.mobileNumber || '',
      }));
    }
  }

  function handlePickPhoto() {
    photoInputRef.current?.click();
  }

  function handlePickScreenshot() {
    screenshotInputRef.current?.click();
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoMessage('');

    if (!file.type.startsWith('image/')) {
      setPhotoMessage('Please select an image file.');
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setPhotoMessage('Please select an image up to 2 MB.');
      e.target.value = '';
      return;
    }

    try {
      const formData = new FormData();
      formData.append('profilePhoto', file);

      const { data } = await api.put('/registrant-auth/profile-photo', formData);
      const nextPhoto = data?.data?.profilePhoto || '';
      setProfilePhoto(nextPhoto);
      setProfile((prev) => (prev ? { ...prev, profilePhoto: nextPhoto } : prev));
      setPhotoMessage('Profile photo updated.');
      setShowProfilePhotoModal(false);
    } catch (err) {
      setPhotoMessage(getErrorMessage(err));
    }

    e.target.value = '';
  }

  function handleRelationshipChange(memberIndex, relationship) {
    setRelationshipValues((current) => ({ ...current, [memberIndex]: relationship }));
  }

  async function handleRelationshipSave(memberIndex) {
    const relationship = relationshipValues[memberIndex];
    if (!relationship) return;

    setRelationshipMessage('');
    setRelationshipSaving((current) => ({ ...current, [memberIndex]: true }));

    try {
      const { data } = await api.put('/registrant-auth/family-member-relationship', {
        memberIndex,
        relationship,
      });
      setProfile((current) => (current ? { ...current, familyMembers: data.data.familyMembers } : current));
      setRelationshipValues((current) => {
        const next = { ...current };
        delete next[memberIndex];
        return next;
      });
      setRelationshipMessage('Relationship updated successfully.');
    } catch (err) {
      setRelationshipMessage(getErrorMessage(err));
    } finally {
      setRelationshipSaving((current) => ({ ...current, [memberIndex]: false }));
    }
  }

  async function handleScreenshotChange(e, installmentNumber) {
    const file = e.target.files?.[0];
    if (!file) return;

    setScreenshotMessage('');

    if (!file.type.startsWith('image/')) {
      setScreenshotMessage('Please select an image file.');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setScreenshotMessage('Please select an image up to 5 MB.');
      e.target.value = '';
      return;
    }

    try {
      const formData = new FormData();
      formData.append(`paymentScreenshot${installmentNumber}`, file);

      const { data } = await api.put('/registrant-auth/payment-screenshot', formData);
      const updatedProfile = { ...profile };
      updatedProfile[`paymentScreenshot${installmentNumber}`] = data?.data?.[`paymentScreenshot${installmentNumber}`] || '';
      updatedProfile.allowPaymentScreenshotUpdate = Boolean(data?.data?.allowPaymentScreenshotUpdate);
      setProfile(updatedProfile);
      setScreenshotMessage(`Installment ${installmentNumber} screenshot updated.`);
    } catch (err) {
      setScreenshotMessage(getErrorMessage(err));
    }

    e.target.value = '';
  }

  function handlePickScreenshot(installmentNumber) {
    if (installmentNumber === 1) {
      screenshotRef1.current?.click();
    } else if (installmentNumber === 2) {
      screenshotRef2.current?.click();
    } else {
      screenshotRef3.current?.click();
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Loading your registration details...</div>;
  }
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-100">
      <Modal
        open={showProfilePhotoModal}
        onClose={() => setShowProfilePhotoModal(false)}
        title="Add your profile photo"
        className="max-w-md"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <User className="h-12 w-12" />
          </div>
          <p className="text-sm text-muted-foreground">
            Upload a profile photo to personalize your dashboard.
          </p>
          <Button type="button" variant="success" onClick={handlePickPhoto}>
            <Camera className="h-4 w-4" />
            Upload profile photo
          </Button>
          {photoMessage && <p className="text-xs text-destructive">{photoMessage}</p>}
        </div>
      </Modal>

      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-80 w-80 rounded-full bg-sky-300/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-teal-200/35 blur-3xl" />

      <div className="relative mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        <Card className="border-emerald-100/80 bg-white/85 shadow-xl shadow-emerald-100/60 backdrop-blur">
          <CardContent className="p-4 sm:p-6">
            {/* Header row: [menu?] [avatar] [name/details] ... [logout] */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden"
                  onClick={() => setIsNavOpen(true)}
                  aria-label="Open section menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="relative shrink-0">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-700 to-emerald-500 text-white shadow-lg shadow-emerald-200/50 ring-1 ring-emerald-100 sm:h-16 sm:w-16">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-7 w-7" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handlePickPhoto}
                    className="absolute -bottom-1 -right-1 rounded-full border border-emerald-100 bg-white p-1.5 text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50"
                    aria-label="Change profile photo"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="min-w-0 hidden md:block">
                  <p className="text-xs font-medium uppercase tracking-widest text-emerald-500">Welcome back 🙏</p>
                  <h1 className="truncate text-xl font-serif text-emerald-900 sm:text-3xl">
                    {profile?.initiatedName || profile?.name}
                  </h1>
                  <p className="mt-0.5 truncate text-xs text-emerald-600">{profile?.devoteeCategory} · {profile?.comingFrom}</p>
                  <button
                    type="button"
                    onClick={handlePickPhoto}
                    className="mt-1 text-xs font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
                  >
                    Change photo
                  </button>
                  {photoMessage && <p className="mt-1 text-xs text-emerald-700">{photoMessage}</p>}
                </div>
              </div>
              <Button variant="success" className="shrink-0" onClick={handleLogout}>Logout</Button>
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            {photoMessage && <p className="mt-2 text-xs text-emerald-700 md:hidden">{photoMessage}</p>}

            <div className="mt-4 flex items-center gap-2 rounded-md border border-emerald-100 bg-emerald-50/70 p-2 md:hidden">
              <activeSectionMeta.icon className="h-4 w-4 text-emerald-700" />
              <p className="text-sm font-medium text-emerald-900">{activeSectionMeta.label}</p>
            </div>
          </CardContent>
        </Card>

        {isNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              onClick={() => setIsNavOpen(false)}
              aria-label="Close section menu"
            />
            <div className="absolute left-0 top-0 h-full w-72 border-r border-emerald-100 bg-white shadow-2xl flex flex-col">
              {/* Profile strip */}
              <div className="bg-gradient-to-br from-emerald-700 to-emerald-500 px-4 pb-5 pt-5">
                <div className="flex items-center gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white/20 ring-2 ring-white/40">
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-white">
                          <User className="h-7 w-7" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-emerald-100">Welcome back 🙏</p>
                      <p className="truncate font-serif text-base font-semibold text-white">
                        {profile?.initiatedName || profile?.name}
                      </p>
                      <p className="truncate text-xs text-emerald-200">{profile?.devoteeCategory} · {profile?.comingFrom}</p>
                    </div>
                  </div>
              </div>
              {/* Nav links */}
              <div className="flex-1 overflow-y-auto p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-600">Sections</p>
              <div className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.key;
                  return (
                    <button
                      key={section.key}
                      type="button"
                      onClick={() => selectSection(section.key)}
                      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        isActive
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'bg-emerald-50/60 text-emerald-900 hover:bg-emerald-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{section.label}</span>
                    </button>
                  );
                })}
              </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <Card className={`hidden md:block ${cardClassName}`}>
            <CardHeader>
              <CardTitle>Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.key;
                return (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => selectSection(section.key)}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'bg-emerald-50/60 text-emerald-900 hover:bg-emerald-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {activeSection === 'basic' && (
              <Card className={cardClassName}>
                <CardHeader>
                  <CardTitle>Basic Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
                      <div>
                      <p className="text-muted-foreground text-xs">Name</p>
                      <p className="font-medium">{profile?.name}</p>
                      </div>
                      <div>
                      <p className="text-muted-foreground text-xs">Initiated Name</p>
                      <p className="font-medium">{profile?.initiatedName || '-'}</p>
                      </div>
                      <div>
                      <p className="text-muted-foreground text-xs">Age</p>
                      <p className="font-medium">{profile?.age}</p>
                      </div>
                      <div>
                      <p className="text-muted-foreground text-xs">Category</p>
                      <p className="font-medium">{profile?.devoteeCategory}</p>
                      </div>
                      <div>
                      <p className="text-muted-foreground text-xs">Mobile</p>
                      <p className="font-medium">{profile?.mobileNumber}</p>
                      </div>
                      <div>
                      <p className="text-muted-foreground text-xs">Coming From</p>
                      <p className="font-medium">{profile?.comingFrom}</p>
                      </div>
                    </div>

                  {qrCodeUrl && (
                    <details className="rounded-md border border-emerald-200 bg-emerald-50/50 p-3 text-center">
                      <summary className="cursor-pointer list-none font-semibold text-emerald-800">
                        Event Check-in QR
                        <span className="ml-2 text-xs font-normal text-emerald-700">(Show at registration desk)</span>
                      </summary>
                      <div className="mt-3 flex flex-col items-center gap-2 border-t border-emerald-200 pt-3">
                        <p className="text-xs text-muted-foreground">Expand this section when you arrive for quick check-in.</p>
                        <img src={qrCodeUrl} alt="Event check-in QR code" className="h-48 w-48 rounded border bg-white p-2" />
                      </div>
                    </details>
                  )}

                  </div>
                  
                    {profile?.familyMembers && profile.familyMembers.length > 0 && (
                      <div className="mt-6 space-y-3 border-t pt-4">
                        <p className="font-semibold text-slate-700">Family Members</p>
                        <div className="space-y-2">
                          {profile.familyMembers.map((member, index) => (
                            <div key={index} className="rounded-md border border-emerald-100 bg-emerald-50/60 p-3">
                              <div className="grid gap-2 sm:grid-cols-5">
                                <div>
                                  <p className="text-muted-foreground text-xs">Name</p>
                                  <p className="font-medium text-sm">{member.name}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">Age</p>
                                  <p className="font-medium text-sm">{member.age}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">Category</p>
                                  <p className="font-medium text-sm">{member.devoteeCategory}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">Gender</p>
                                  <p className="font-medium text-sm">{member.gender === 'MALE' ? 'Prabhuji' : 'Mataji'}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">Relationship</p>
                                  <select
                                    value={relationshipValues[index] ?? member.relationship ?? ''}
                                    onChange={(event) => handleRelationshipChange(index, event.target.value)}
                                    className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                                  >
                                    <option value="">Select relationship</option>
                                    {FAMILY_RELATIONSHIPS.map((relationship) => (
                                      <option key={relationship} value={relationship}>{relationship}</option>
                                    ))}
                                  </select>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="mt-2 h-7 w-full px-2 text-xs"
                                    disabled={!relationshipValues[index] || relationshipSaving[index]}
                                    onClick={() => handleRelationshipSave(index)}
                                  >
                                    {relationshipSaving[index] ? 'Saving...' : 'Save'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {relationshipMessage && (
                          <p className="text-xs text-emerald-700">{relationshipMessage}</p>
                        )}
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

            {activeSection === 'accommodation' && (
              <Card className={cardClassName}>
                <CardHeader>
                  <CardTitle>Accommodation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground text-xs">Status</span>
                    <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${profile?.accommodationStatus === 'ASSIGNED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {profile?.accommodationStatus}
                    </span>
                  </p>
                  {profile?.assignment ? (
                    <>
                      <p className="text-sm"><strong>Hotel:</strong> {profile.assignment.hotelName}</p>
                      <p className="text-sm"><strong>Room:</strong> {profile.assignment.roomNumber}</p>
                      <p className="text-sm"><strong>Address:</strong> {profile.assignment.hotelAddress}</p>
                      {profile.assignment.hotelMapLink && <a href={profile.assignment.hotelMapLink} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-2"><MapPin className="h-4 w-4"/>Open map</a>}
                    </>
                  ) : (
                    <p className="text-sm">No accommodation assigned yet.</p>
                  )}

                  <div className="mt-4 rounded-md border border-emerald-100 bg-emerald-50/40 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                      Seminar Hall (Common)
                    </p>
                    {profile?.seminarHall ? (
                      <>
                        <p className="text-sm"><strong>Hall:</strong> {profile.seminarHall.hallName}</p>
                        <p className="text-sm"><strong>Address:</strong> {profile.seminarHall.hallAddress}</p>
                        {profile.seminarHall.hallMapLink && (
                          <a
                            href={profile.seminarHall.hallMapLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary inline-flex items-center gap-2"
                          >
                            <MapPin className="h-4 w-4" />
                            Open seminar hall map
                          </a>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Seminar hall details will be updated soon.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'selections' && (
              <Card className={cardClassName}>
                <CardHeader>
                  <CardTitle>Services</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Services:</strong> {profile?.services?.length ? profile.services.join(', ') : '-'}</p>
                  <p><strong>Donation Items:</strong> {profile?.donationItems?.length ? profile.donationItems.map((item) => item?.id || item?.label || JSON.stringify(item)).join(', ') : '-'}</p>
                </CardContent>
              </Card>
            )}

            {activeSection === 'payment' && (
              <Card className={cardClassName}>
                <CardHeader>
                  <CardTitle>Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground text-xs">Status</span> <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${profile?.paymentStatus === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{profile?.paymentStatus}</span></p>
                  <p className="mt-2"><strong>Amount Paid:</strong> {currency(profile?.amountPaid || 0)}</p>
                  <p><strong>Reference:</strong> {profile?.paymentReferenceId || '-'}</p>
                  
                  <div className="mt-4 space-y-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                      Payment Screenshots <span className="text-muted-foreground">(Upload up to 3 installments)</span>
                    </p>
                    
                    {[1, 2, 3].map((installmentNumber) => (
                      <div key={installmentNumber} className="rounded-md border border-emerald-100 bg-emerald-50/40 p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-700">
                              Installment {installmentNumber} {installmentNumber > 1 && <span className="text-xs text-muted-foreground">(Optional)</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {profile?.[`paymentScreenshot${installmentNumber}`]
                                ? 'Screenshot uploaded'
                                : 'No screenshot yet'}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handlePickScreenshot(installmentNumber)}
                            disabled={profile?.[`paymentScreenshot${installmentNumber}`] && !profile?.allowPaymentScreenshotUpdate}
                            className="w-full sm:w-auto"
                            size="sm"
                          >
                            <Receipt className="h-4 w-4" />
                            {profile?.[`paymentScreenshot${installmentNumber}`] ? 'Update' : 'Upload'}
                          </Button>
                        </div>

                        <input
                          ref={installmentNumber === 1 ? screenshotRef1 : installmentNumber === 2 ? screenshotRef2 : screenshotRef3}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleScreenshotChange(e, installmentNumber)}
                        />

                        {profile?.[`paymentScreenshot${installmentNumber}`] ? (
                          <a
                            href={profile[`paymentScreenshot${installmentNumber}`]}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 block overflow-hidden rounded border border-emerald-100 bg-white"
                          >
                            <img
                              src={profile[`paymentScreenshot${installmentNumber}`]}
                              alt={`Installment ${installmentNumber} screenshot`}
                              className="max-h-[200px] w-full object-contain bg-white"
                            />
                          </a>
                        ) : null}
                      </div>
                    ))}
                    
                    {screenshotMessage && (
                      <p className="mt-2 text-xs text-emerald-700">{screenshotMessage}</p>
                    )}

                    {profile?.allowPaymentScreenshotUpdate === false && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Screenshot updates are currently disabled. Contact admin if this needs to be changed.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'password' && (
              <Card className={cardClassName}>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Current Password</Label>
                      <div className="relative">
                        <Input type={showCurrent ? 'text' : 'password'} value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))} required />
                        <button type="button" aria-label={showCurrent ? 'Hide password' : 'Show password'} onClick={() => setShowCurrent((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                          {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>New Password</Label>
                      <div className="relative">
                        <Input type={showNew ? 'text' : 'password'} value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} required />
                        <button type="button" aria-label={showNew ? 'Hide password' : 'Show password'} onClick={() => setShowNew((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                          {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    {passwordMessage && <p className="text-sm text-muted-foreground">{passwordMessage}</p>}
                    <Button type="submit" variant="success" disabled={passwordLoading}>
                      {passwordLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeSection === 'notice' && (
              <Card className={cardClassName}>
                <CardHeader>
                  <CardTitle>Notice Board</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile?.noticeBoardMessages?.length ? (
                    <div className="space-y-3">
                      {profile.noticeBoardMessages.map((notice) => (
                        <div key={notice.id} className="rounded-md border border-emerald-100 bg-emerald-50/60 p-3">
                          <p className="whitespace-pre-wrap text-sm text-emerald-900">{notice.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No notices from admin yet.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === 'feedback' && (
              <Card className={cardClassName}>
                <CardHeader>
                  <CardTitle>Seminar Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  {feedbackSubmitted ? (
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                      <MessageSquare className="h-12 w-12 text-emerald-600" />
                      <p className="text-lg font-semibold text-emerald-900">Thank You!</p>
                      <p className="text-sm text-muted-foreground">Your feedback has been submitted. Hare Krishna!</p>
                    </div>
                  ) : (
                    <form
                      className="space-y-4"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setFeedbackMessage('');
                        if (!feedbackRating) {
                          setFeedbackMessage('Please select a rating.');
                          return;
                        }
                        setFeedbackLoading(true);
                        try {
                          await api.post('/feedbacks', {
                            name: feedbackForm.name,
                            mobileNumber: feedbackForm.mobileNumber,
                            overallRating: feedbackRating,
                            suggestions: feedbackForm.suggestions || undefined,
                          });
                          setFeedbackSubmitted(true);
                        } catch (err) {
                          setFeedbackMessage(getErrorMessage(err));
                        } finally {
                          setFeedbackLoading(false);
                        }
                      }}
                    >
                      <div className="space-y-1.5">
                        <Label>Name <span className="text-destructive">*</span></Label>
                        <Input
                          value={feedbackForm.name}
                          onChange={(e) => setFeedbackForm((p) => ({ ...p, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Mobile Number <span className="text-destructive">*</span></Label>
                        <Input
                          value={feedbackForm.mobileNumber}
                          onChange={(e) => setFeedbackForm((p) => ({ ...p, mobileNumber: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Overall Experience <span className="text-destructive">*</span></Label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setFeedbackRating(v)}
                              aria-label={`${v} star`}
                            >
                              <Star
                                className={cn(
                                  'h-8 w-8 transition-colors',
                                  v <= feedbackRating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-muted-foreground'
                                )}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Suggestions</Label>
                        <Textarea
                          rows={4}
                          value={feedbackForm.suggestions}
                          onChange={(e) => setFeedbackForm((p) => ({ ...p, suggestions: e.target.value }))}
                        />
                      </div>
                      {feedbackMessage && (
                        <p className="text-sm text-destructive">{feedbackMessage}</p>
                      )}
                      <Button type="submit" className="w-full" disabled={feedbackLoading}>
                        {feedbackLoading ? 'Submitting...' : 'Submit Feedback'}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
