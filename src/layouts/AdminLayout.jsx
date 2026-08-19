import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BedDouble,
  Hotel,
  Building2,
  MessageSquare,
  Star,
  Heart,
  HandHelping,
  UserCheck,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/registrations', label: 'Registrations', icon: Users },
  { to: '/admin/attendance', label: 'Attendance Desk', icon: UserCheck },
  { to: '/admin/accommodation', label: 'Accommodation', icon: BedDouble },
  { to: '/admin/hotels', label: 'Hotels', icon: Hotel },
  { to: '/admin/seminar-hall', label: 'Seminar Hall', icon: Building2 },
  { to: '/admin/donations', label: 'Donations', icon: Heart },
  { to: '/admin/seva', label: 'Seva', icon: HandHelping },
  { to: '/admin/sms', label: 'SMS Campaigns', icon: MessageSquare },
  { to: '/admin/feedback', label: 'Feedback', icon: Star },
];

function SidebarNav({ onLinkClick }) {
  return (
    <nav className="flex-1 space-y-1 p-3">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onLinkClick}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AdminLayout() {
  const { admin, logout, isViewer } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-white md:flex">
        <div className="flex h-16 items-center border-b px-6">
          <span className="text-lg font-bold text-primary">Sanga Mahotsav</span>
        </div>
        <SidebarNav />
      </aside>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-white transition-transform duration-200 md:hidden',
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <span className="text-lg font-bold text-primary">Sanga Mahotsav</span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarNav onLinkClick={() => setDrawerOpen(false)} />
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-white px-4 md:h-16 md:px-6">
          {/* Hamburger — mobile only */}
          <button
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent md:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <span className="hidden font-bold text-primary md:hidden" />

          <div className="ml-auto flex items-center gap-2 md:gap-4">
            <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
              <span className="max-w-[120px] truncate md:max-w-none">{admin?.name || admin?.email}</span>
              {isViewer ? (
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
                  View Only
                </span>
              ) : (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  Admin
                </span>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
