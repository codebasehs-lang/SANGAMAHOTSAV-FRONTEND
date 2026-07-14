import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BedDouble,
  Hotel,
  Building2,
  MessageSquare,
  Star,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/registrations', label: 'Registrations', icon: Users },
  { to: '/admin/accommodation', label: 'Accommodation', icon: BedDouble },
  { to: '/admin/hotels', label: 'Hotels', icon: Hotel },
  { to: '/admin/seminar-hall', label: 'Seminar Hall', icon: Building2 },
  { to: '/admin/sms', label: 'SMS Campaigns', icon: MessageSquare },
  { to: '/admin/feedback', label: 'Feedback', icon: Star },
];

export default function AdminLayout() {
  const { admin, logout, isViewer } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-white md:flex">
        <div className="flex h-16 items-center border-b px-6">
          <span className="text-lg font-bold text-primary">Sanga Mahotsav</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
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
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
          <div className="md:hidden">
            <span className="font-bold text-primary">Sanga Mahotsav</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{admin?.name || admin?.email}</span>
              {isViewer ? (
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
                  View Only
                </span>
              ) : (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  Super Admin
                </span>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-b bg-white px-3 py-2 md:hidden">
          {NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground'
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
