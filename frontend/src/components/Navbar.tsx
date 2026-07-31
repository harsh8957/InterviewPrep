import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogIn, UserPlus, LogOut, LayoutDashboard, Sun, Moon, Monitor, BrainCircuit } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const options = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  const current = options.find(o => o.value === theme) || options[2];
  const Icon = current.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="btn btn-ghost btn-icon text-muted-foreground hover:text-foreground"
        aria-label="Toggle theme"
      >
        <Icon size={18} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-36 z-50 rounded-xl border border-border bg-popover shadow-modal animate-scale-in overflow-hidden">
            {options.map(opt => {
              const Ic = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => { setTheme(opt.value); setOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-muted",
                    theme === opt.value ? "text-primary font-semibold" : "text-foreground"
                  )}
                >
                  <Ic size={15} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;
  const dashboardPath = user ? `/${user.role}/dashboard` : '/login';

  const navLinks = user
    ? [
        { to: '/', label: 'Home' },
        { to: dashboardPath, label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
        { to: '/setup', label: 'New Interview' },
      ]
    : [
        { to: '/', label: 'Home' },
      ];

  return (
    <header className="sticky top-0 z-50 glass-panel">
      <div className="container-content">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="InterviewPrep home">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-brand shadow-glow-primary/50 group-hover:shadow-glow-primary transition-shadow duration-200">
              <BrainCircuit size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-gradient hidden sm:block">InterviewPrep</span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex md:items-center md:gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "nav-link flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
                  isActive(link.to)
                    ? "nav-link-active bg-muted font-semibold"
                    : "hover:bg-muted"
                )}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted text-sm text-muted-foreground">
                  <div className="w-6 h-6 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold">
                    {user.firstName?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="font-medium text-foreground">{user.firstName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn btn-outline btn-sm flex items-center gap-1.5"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn btn-ghost btn-sm flex items-center gap-1.5">
                  <LogIn size={14} />
                  <span>Login</span>
                </Link>
                <Link to="/signup" className="btn btn-primary btn-sm flex items-center gap-1.5">
                  <UserPlus size={14} />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border animate-slide-up">
          <div className="container-content py-4">
            <nav className="flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    isActive(link.to)
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}

              <div className="my-2 h-px bg-border" />

              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-outline w-full"
                  >
                    <LogIn size={15} />
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-primary w-full"
                  >
                    <UserPlus size={15} />
                    Sign Up Free
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
