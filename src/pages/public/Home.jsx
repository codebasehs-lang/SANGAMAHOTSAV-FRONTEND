import { useState } from "react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import {
  CalendarCheck,
  MapPin,
  MessageSquareHeart,
  CalendarDays,
  Building2,
  Droplets,
  HandHeart,
  Megaphone,
  Sparkles,
  Stethoscope,
  UtensilsCrossed,
  Baby,
} from "lucide-react";
import { EVENT_INFO, PAYMENT_INFO } from "@/lib/constants";

const DONATION_ITEMS = [
  {
    service: "Deity Garlands & Flowers",
    amount: "₹20,000 for Seminar",
    note: "(per day ₹4,000 / Altar & Outfit)",
    icon: Sparkles,
  },
  {
    service: "Arcana Seva",
    amount: "₹3,000",
    note: "(for five days)",
    icon: Sparkles,
  },
  {
    service: "Dinner Prasadam",
    amount: "₹30,000",
    note: "for 400 devotees (one time)",
    icon: UtensilsCrossed,
  },
  {
    service: "Lunch Prasadam Seva",
    amount: "₹40,000",
    note: "for 400 devotees (one time)",
    icon: UtensilsCrossed,
  },
  {
    service: "Sweet Item for Lunch / Breakfast / Dinner",
    amount: "₹6,000",
    note: "per time",
    icon: Sparkles,
  },
  {
    service: "Maha Feast on Last Day",
    amount: "₹50,000",
    note: "for 400 devotees (one time)",
    icon: UtensilsCrossed,
  },
  {
    service: "Drinking Water",
    amount: "₹15,000",
    note: "(₹3,000 per day)",
    icon: Droplets,
  },
  {
    service: "Sound System",
    amount: "₹25,000",
    note: "(₹5,000 per day)",
    icon: Megaphone,
  },
  {
    service: "Seminar Hall",
    amount: "₹75,000",
    note: "(₹15,000 per day)",
    icon: Building2,
  },
  {
    service: "Cleaning Supplies",
    amount: "₹5,000",
    note: "(₹1,000 per day)",
    icon: Sparkles,
  },
  {
    service: "Children Activities Supplies",
    amount: "₹5,000",
    note: "(₹1,000 per day)",
    icon: Baby,
  },
  {
    service: "Medical Supplies",
    amount: "₹5,000",
    note: "(Surplus will be used by Brahmachari Devotees)",
    icon: Stethoscope,
  },
  {
    service: "Juice Prasadam",
    amount: "₹5,000",
    note: "per one time",
    icon: Droplets,
  },
  {
    service: "Dry Prasadam",
    amount: "₹5,000",
    note: "per one time",
    icon: UtensilsCrossed,
  },
  {
    service: "Children's Special Prasad – 100 Plates",
    amount: "₹5,000",
    note: "",
    icon: Baby,
  },
];

export default function Home() {
  const [showQrModal, setShowQrModal] = useState(false);

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url('/images/2.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />


        <section className="hero">
          <div className="hero-grid">
            <div className="hero-left">
              <div className="eyebrow-leaf"></div>
              <h1 className="headline">
                Welcome to
                <span className="accent">9th Sangamahotsav</span>
              </h1>

              <div className="divider">
                <span className="line"></span>
                <span className="line right"></span>
              </div>

              <p className="subtext">
                Register for the festival, receive your accommodation details, and join us in a celebration of devotion and community.
              </p>

              <div className="info-card">
                <div className="info-title"> {EVENT_INFO.title}</div>
                <div className="info-sub">
                  {EVENT_INFO.gurudeva}
                </div>

                <div className="info-details">
                  <div className="info-item">
                    <div className="icon-circle">📅</div>

                    <span>
                      {EVENT_INFO.startDate} ({EVENT_INFO.startTime}) –{" "}
                      {EVENT_INFO.endDate} ({EVENT_INFO.endTime})
                    </span>
                  </div>

                  <div className="info-divider-v"></div>

                  <div className="info-item">
                    <div className="icon-circle">📍</div>
                    <span>{EVENT_INFO.venue}</span>
                  </div>
                </div>
              </div>

              <div className="cta-row">
                <Link to="/register" className="btn btn-primary">
                  Register Now
                </Link>

                <a
                  href="#donation-services"
                  className="btn btn-outline"
                  onClick={(event) => {
                    event.preventDefault();
                    const section = document.getElementById('donation-services');
                    if (section) {
                      section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                  }}
                >
                  Donate for Sangamahotsav Services
                </a>
              </div>
            </div>


          </div>


        </section>



        <div style={{ display: "none" }}>
          {/* White Overlay */}
          <div className="absolute inset-0 z-10 " />

          {/* Content */}
          <div className="container relative z-20 flex min-h-screen flex-col items-center justify-center py-20 text-center">
            <h1 className="mdh max-w-3xl text-4xl font-bold tracking-tight text-gray-900 md:text-6xl">
              Hare Krishna!
            </h1>
            <h2 className="mdh" > Welcome to Sangamahotsav </h2>

            <div className="mt-8 max-w-3xl rounded-2xl bg-white/85 p-6 shadow-xl backdrop-blur-md">
              <p className="text-xl font-semibold text-primary">
                {EVENT_INFO.title}
              </p>

              <p className="mt-2 text-muted-foreground">

              </p>

              <div className="mt-6 flex flex-col gap-4 md:flex-row md:justify-center">
                <div className="flex items-center gap-2">

                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />

                </div>
              </div>
            </div>

            <p className="mt-8 max-w-2xl text-lg text-gray-700">
              Register for the festival, receive your accommodation details, and
              join us in a celebration of devotion and community.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">


              <Link
                to="/feedback"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                })}
              >
                Share Feedback
              </Link>
            </div>



            <section className="container grid gap-6 py-12 md:grid-cols-3">
              {[
                {
                  icon: CalendarCheck,
                  title: "Easy Registration",
                  text: "Fill a simple form with your details and accommodation preferences.",
                },
                {
                  icon: MapPin,
                  title: "Accommodation & Maps",
                  text: "Get your hotel, room number and Google Map links via SMS.",
                },
                {
                  icon: MessageSquareHeart,
                  title: "Share Your Experience",
                  text: "After the seminar, tell us how we did through feedback.",
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


        </div>
      </section>

      <section
        id="donation-services"
        className="donation-section"
        tabIndex="-1"
        aria-labelledby="donation-services-title"
      >
        <div className="donation-intro">
          <span className="eyebrow-leaf">🙏</span>
          <h2 id="donation-services-title">SANGA MAHOTSAVA</h2>
          <p>
            SEVA  OPPORTUNITIES FOR APRIL – 2026
          </p>
        </div>

        <div className="donation-table-wrap">
          <table className="donation-table">
            <thead>
              <tr>
                <th>Sponsorship Area</th>
                <th>Lakshmi</th>
              </tr>
            </thead>
            <tbody>
              {DONATION_ITEMS.map((item) => {
                const Icon = item.icon;

                return (
                  <tr key={`${item.service}-${item.amount}`}>
                    <td>
                      <div className="service-cell">
                        <span className="service-icon">
                          <Icon size={16} />
                        </span>
                        <span>{item.service}</span>
                      </div>
                    </td>
                    <td>
                      <div className="amount-cell">
                        <strong>{item.amount}</strong>
                        {item.note ? <span>{item.note}</span> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}

              <tr className="note-row">
                <td colSpan="2">
                  <div className="note-row-content">
                    <span className="service-icon">
                      <HandHeart size={16} />
                    </span>
                    <span>Any innovative seva from devotees are welcome.</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="donation-cta">
          <p>
            Please contact the seva team directly for contribution support using the number below.
          </p>
          <button
            type="button"
            className="btn btn-primary donation-btn"
            onClick={() => setShowQrModal(true)}
          >
            Support via PhonePe / UPI
          </button>
        </div>
      </section>

      <Modal
        open={showQrModal}
        onClose={() => setShowQrModal(false)}
        title="Scan to Donate"
        className="qr-modal"
      >
        <div className="qr-modal-content">
          <p className="qr-modal-text">
            Scan the QR code below to donate via PhonePe / UPI.
          </p>
          <img
            src="/images/QR.png"
            alt="PhonePe / UPI donation QR code"
            className="qr-modal-image"
          />
        </div>
      </Modal>

      {/* Features */}

    </div>
  );
}