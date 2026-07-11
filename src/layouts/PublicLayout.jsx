import { Link, Outlet } from 'react-router-dom';

/** Public site shell with a simple header and footer. */
export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">Sangamahotsav</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/register" className="hover:text-primary">
              Register
            </Link>
            <Link to="/feedback" className="hover:text-primary">
              Feedback
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 bg-muted/30">
        <Outlet />
      </main>

      <footer className="border-t bg-white py-6">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Sangamahotsav. Hare Krishna.
        </div>
      </footer>
    </div>
  );
}
