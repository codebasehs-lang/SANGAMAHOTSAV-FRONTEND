import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function SplashScreen({ onClose }) {
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-gradient-to-b from-amber-50/95 via-orange-50/90 to-white/95 p-4 backdrop-blur-sm">
      <div className="pointer-events-none absolute -left-24 top-[-120px] h-80 w-80 rounded-full bg-amber-300/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-[-80px] h-72 w-72 rounded-full bg-orange-300/30 blur-3xl" />

      <div className="relative mx-auto w-full max-w-3xl rounded-3xl border border-amber-900/15 bg-white/80 p-5 text-slate-900 shadow-2xl backdrop-blur-md md:p-8">
        <div className="grid items-center gap-6 md:grid-cols-[220px_1fr] md:gap-8">
          <div className="mx-auto w-full max-w-[220px]">
            {!photoLoadFailed ? (
              <img
                src="/images/Gurudeva.png"
                alt="Gurudeva"
                onError={() => setPhotoLoadFailed(true)}
                className="h-[280px] w-full rounded-2xl object-cover ring-2 ring-amber-400/60"
              />
            ) : (
              <div className="flex h-[280px] w-full items-center justify-center rounded-2xl border border-dashed border-amber-500/35 bg-amber-50/70 px-4 text-center text-sm text-amber-900/80">
                Gurudeva Photo Placeholder
                <br />
                (you can add later)
              </div>
            )}
          </div>

          <div className="text-center md:text-left">
            <p className="text-xs uppercase tracking-[0.22em] text-amber-700">
              Welcome
            </p>
            <div className="mt-3 space-y-2">
              <p className="text-lg font-semibold leading-tight text-amber-800 md:text-xl">
                9th Sanga Mohatsav
              </p>
              <p className="text-2xl font-bold leading-tight text-slate-900 md:text-[2rem]">
                5th Vyasa Puja
              </p>
              <p className="text-lg font-semibold leading-tight text-slate-800 md:text-xl md:whitespace-nowrap">
                56th Holy Appearance Day Celebration
              </p>
            </div>
            <p className="mt-4 text-sm text-slate-700 md:text-base">
              A sacred gathering of devotion, learning, and seva.
            </p>
            <div className="mt-6 h-1.5 w-40 rounded-full bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 md:mx-0 mx-auto" />
            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-amber-600 hover:to-orange-600 hover:shadow-lg active:scale-95"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}