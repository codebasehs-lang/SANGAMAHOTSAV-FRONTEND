import { useEffect, useState } from 'react';
import { Download, X, Share, Sparkles, Wifi, Rocket } from 'lucide-react';

const DISMISS_KEY = 'pwa_install_dismissed';

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    // iOS Safari has no beforeinstallprompt — show manual instructions instead.
    if (isIos()) {
      setIosHint(true);
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }

    function handleBeforeInstall(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    }

    function handleInstalled() {
      setVisible(false);
      setDeferredPrompt(null);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted' || outcome === 'dismissed') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }

  function handleClose() {
    setVisible(false);
  }

  function handleDismiss() {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, '1');
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />

      {/* Modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl shadow-emerald-900/30">
        {/* Header banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 px-6 pb-14 pt-7 text-center text-white">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-teal-300/25 blur-3xl" />
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Install the App
          </div>
          <h3 className="relative mt-3 font-serif text-2xl font-bold">Sanga Mahotsav</h3>
        </div>

        {/* App icon overlapping */}
        <div className="relative -mt-10 flex justify-center">
          <img
            src="/images/Gurudeva.jpg"
            alt="Sanga Mahotsav"
            className="h-20 w-20 rounded-2xl border-4 border-white object-cover object-top shadow-xl"
          />
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Install the <span className="font-semibold text-emerald-800">Sanga Mahotsav</span> app on your{' '}
            {iosHint ? 'iPhone' : 'device'} for a faster, full-screen experience with quick access to your devotee dashboard.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-emerald-50 p-3">
              <Rocket className="mx-auto h-5 w-5 text-emerald-700" />
              <p className="mt-1 text-[11px] font-medium text-emerald-900">Fast launch</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3">
              <Wifi className="mx-auto h-5 w-5 text-emerald-700" />
              <p className="mt-1 text-[11px] font-medium text-emerald-900">Works offline</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3">
              <Download className="mx-auto h-5 w-5 text-emerald-700" />
              <p className="mt-1 text-[11px] font-medium text-emerald-900">Home screen</p>
            </div>
          </div>

          {iosHint ? (
            <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-left text-xs text-emerald-900">
              <p className="font-semibold">To install on iPhone / iPad:</p>
              <p className="mt-1">
                1. Tap the <Share className="inline h-3.5 w-3.5" /> Share button in Safari.
              </p>
              <p>2. Choose “Add to Home Screen”.</p>
              <p>3. Tap “Add”.</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleInstall}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200/60 transition-all hover:from-emerald-800 hover:to-teal-700"
            >
              <Download className="h-4 w-4" />
              Install App
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className="mt-3 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-emerald-800 hover:underline"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
