import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarCheck, MapPin, MessageSquareHeart, CalendarDays } from 'lucide-react';
import { EVENT_INFO } from '@/lib/constants';

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background banner image (frontend/public/images/hero banner.png) */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/hero%20banner.png')" }}
          aria-hidden
        />
        {/* Readability overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/80 to-white/90" />

        <div className="container relative flex flex-col items-center py-20 text-center">
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
            Welcome to Sangamahotsav
          </h1>

          <div className="mt-6 max-w-2xl rounded-xl border bg-white/80 p-5 shadow-sm backdrop-blur">
            <p className="text-lg font-semibold text-primary">
              {EVENT_INFO.title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {EVENT_INFO.gurudeva}
            </p>
            <div className="mt-4 flex flex-col items-center gap-2 text-sm text-foreground sm:flex-row sm:justify-center sm:gap-6">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-primary" />
                {EVENT_INFO.startDate} ({EVENT_INFO.startTime}) &ndash;{' '}
                {EVENT_INFO.endDate} ({EVENT_INFO.endTime})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                {EVENT_INFO.venue}
              </span>
            </div>
          </div>

          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Register for the festival, receive your accommodation details, and
            join us in a celebration of devotion and community.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/register" className={buttonVariants({ size: 'lg' })}>
              Register Now
            </Link>
            <Link
              to="/feedback"
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
            >
              Share Feedback
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container grid gap-6 py-12 md:grid-cols-3">
        {[
          {
            icon: CalendarCheck,
            title: 'Easy Registration',
            text: 'Fill a simple form with your details and accommodation preferences.',
          },
          {
            icon: MapPin,
            title: 'Accommodation & Maps',
            text: 'Get your hotel, room number and Google Map links via SMS.',
          },
          {
            icon: MessageSquareHeart,
            title: 'Share Your Experience',
            text: 'After the seminar, tell us how we did through feedback.',
          },
        ].map(({ icon: Icon, title, text }) => (
          <Card key={title}>
            <CardContent className="flex flex-col items-start gap-3 pt-6">
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{text}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
