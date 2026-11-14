import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';
import {
  type LucideIcon,
  BrainCircuit,
  LayoutDashboard,
  Bot,
  CheckCircle2,
  Map,
  Code2,
  FileCode2,
  Cpu,
  Boxes,
  Building2,
  Lightbulb,
  FileText,
  User,
  CalendarPlus,
  Users,
  Shield,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Compass
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: 'primary' | 'secondary' | 'warning' | 'outline';
  isExternal?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export const AppShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Desktop sidebar collapsed state persisted in localStorage
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('ip-sidebar-collapsed') === 'true';
  });

  // Mobile drawer open state
  const [mobileOpen, setMobileOpen] = useState(false);

  // User menu dropdown
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('ip-sidebar-collapsed', String(next));
      return next;
    });
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setThemeMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const role = user?.role || 'candidate';

  // Role-specific navigation sections
  const getNavSections = (): NavSection[] => {
    if (role === 'admin') {
      return [
        {
          title: 'Management',
          items: [
            { to: '/admin/dashboard', label: 'Admin Console', icon: Shield },
            { to: '/results', label: 'Candidate Results', icon: CheckCircle2 },
          ]
        },
        {
          title: 'Public Content',
          items: [
            { to: '/blog', label: 'Career Blog', icon: FileText },
            { to: '/faq', label: 'Platform FAQs', icon: HelpCircle },
            { to: '/privacy-policy', label: 'Privacy & Policies', icon: FileText },
          ]
        },
        {
          title: 'System & Account',
          items: [
            { to: '/profile', label: 'Admin Profile', icon: User },
          ]
        }
      ];
    }

    if (role === 'hr') {
      return [
        {
          title: 'Recruiter Hub',
          items: [
            { to: '/hr/dashboard', label: 'HR Dashboard', icon: LayoutDashboard },
            { to: '/results', label: 'Candidate Results', icon: Users },
          ]
        },
        {
          title: 'Resources',
          items: [
            { to: '/resume-guide', label: 'Resume Review Guide', icon: FileText },
            { to: '/interview-tips', label: 'Interview Tips & Rubrics', icon: Lightbulb },
          ]
        },
        {
          title: 'Account',
          items: [
            { to: '/profile', label: 'My Profile', icon: User },
          ]
        }
      ];
    }

    // Default: Candidate Navigation
    return [
      {
        title: 'Core Practice',
        items: [
          { to: '/candidate/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/setup', label: 'AI Mock Interview', icon: Bot },
          { to: '/results', label: 'Past Results & Feedback', icon: CheckCircle2 },
        ]
      },
      {
        title: 'Preparation Tracks',
        items: [
          { to: '/roadmap', label: 'DSA Roadmap', icon: Map, badge: 'Phase 3', badgeVariant: 'secondary' },
          { to: '/problems', label: 'Problem Bank', icon: Code2, badge: 'Phase 3', badgeVariant: 'secondary' },
          { to: '/assessments', label: 'Coding Assessments', icon: FileCode2, badge: 'Phase 4', badgeVariant: 'outline' },
          { to: '/core-cs', label: 'Core CS Subjects', icon: Cpu, badge: 'Phase 5', badgeVariant: 'outline' },
          { to: '/system-design', label: 'System Design', icon: Boxes, badge: 'Phase 5', badgeVariant: 'outline' },
          { to: '/companies', label: 'Company Guides', icon: Building2, badge: 'Phase 7', badgeVariant: 'outline' },
        ]
      },
      {
        title: 'Career Resources',
        items: [
          { to: '/interview-tips', label: 'Interview Coach & Tips', icon: Lightbulb },
          { to: '/resume-guide', label: 'ATS Resume Review', icon: FileText },
          { to: '/blog', label: 'Engineering Blog', icon: Compass },
        ]
      },
      {
        title: 'Account',
        items: [
          { to: '/profile', label: 'Profile & Settings', icon: User },
        ]
      }
    ];
  };

  const navSections = getNavSections();

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];
  const CurrentThemeIcon = themeOptions.find(t => t.value === theme)?.icon || Monitor;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-card/60 backdrop-blur-md transition-all duration-300 ease-in-out z-30 select-none",
          collapsed ? "w-20" : "w-64"
        )}
        aria-label="Sidebar navigation"
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link
            to={role === 'admin' ? '/admin/dashboard' : role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard'}
            className="flex items-center gap-3 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-glow-primary/40">
              <BrainCircuit size={20} />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-gradient leading-none">
                  InterviewPrep
                </span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-1">
                  {role === 'admin' ? 'Admin Console' : role === 'hr' ? 'Recruiter Hub' : 'Dev Workspace'}
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={toggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!collapsed && section.title && (
                <div className="px-3 pb-1 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to + '/'));
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      )}
                    >
                      <Icon
                        size={18}
                        className={cn(
                          "shrink-0 transition-transform duration-150 group-hover:scale-105",
                          isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      {!collapsed && (
                        <div className="flex flex-1 items-center justify-between overflow-hidden">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span
                              className={cn(
                                "ml-2 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none",
                                isActive
                                  ? "bg-white/20 text-white"
                                  : item.badgeVariant === 'secondary'
                                  ? "bg-secondary/15 text-secondary dark:bg-secondary/25"
                                  : "border border-border text-muted-foreground"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="border-t border-border p-3 bg-muted/20">
          <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "justify-between")}>
            <Link
              to="/profile"
              className={cn(
                "flex items-center gap-3 rounded-xl p-1.5 hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary overflow-hidden",
                collapsed ? "justify-center w-10 h-10" : "flex-1"
              )}
              title="View profile"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-white font-bold text-sm shadow-sm">
                {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              {!collapsed && (
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="text-sm font-semibold truncate text-foreground leading-tight">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate capitalize">
                    {role} account
                  </span>
                </div>
              )}
            </Link>

            {!collapsed && (
              <button
                onClick={handleLogout}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ─── MOBILE DRAWER (SLIDE-OVER) ─── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-card border-r border-border shadow-2xl z-10 animate-slide-right overflow-hidden">
            {/* Drawer Header */}
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand text-white">
                  <BrainCircuit size={18} />
                </div>
                <span className="font-bold text-gradient text-lg">InterviewPrep</span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close navigation"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
              {navSections.map((section, idx) => (
                <div key={idx} className="space-y-1">
                  {section.title && (
                    <div className="px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {section.title}
                    </div>
                  )}
                  <div className="space-y-1">
                    {section.items.map(item => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.to;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <Icon size={18} />
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-border p-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand text-white font-bold text-xs">
                    {user?.firstName?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-medium text-foreground">{user?.firstName}</span>
                    <span className="text-xs text-muted-foreground capitalize">{role}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"
                  aria-label="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN WORKSPACE COLUMN ─── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Workspace Top Bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/40 backdrop-blur-md px-4 sm:px-6 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Open mobile navigation"
            >
              <Menu size={20} />
            </button>

            {/* Quick Breadcrumb / Location tag */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline-block font-medium capitalize text-foreground">
                {role === 'admin' ? 'Admin Portal' : role === 'hr' ? 'Recruiter Portal' : 'Preparation Workspace'}
              </span>
              <span className="hidden sm:inline-block text-muted-foreground/50">/</span>
              <span className="font-semibold text-foreground truncate max-w-[180px] sm:max-w-xs">
                {navSections.flatMap(s => s.items).find(i => i.to === location.pathname)?.label || 'Workspace'}
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5">
            {/* Quick Action Button */}
            {role === 'candidate' && (
              <Link
                to="/setup"
                className="btn btn-primary btn-sm hidden sm:inline-flex items-center gap-1.5 shadow-sm"
              >
                <Bot size={15} />
                <span>Practice Interview</span>
              </Link>
            )}

            {role === 'hr' && (
              <Link
                to="/hr/dashboard"
                className="btn btn-primary btn-sm hidden sm:inline-flex items-center gap-1.5 shadow-sm"
              >
                <CalendarPlus size={15} />
                <span>Schedule Interview</span>
              </Link>
            )}

            {/* Theme Toggle Dropdown */}
            <div className="relative">
              <button
                onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Switch theme"
                title="Theme options"
              >
                <CurrentThemeIcon size={18} />
              </button>

              {themeMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setThemeMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-36 z-50 rounded-xl border border-border bg-popover shadow-modal animate-scale-in overflow-hidden p-1">
                    {themeOptions.map(opt => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setTheme(opt.value);
                            setThemeMenuOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                            theme === opt.value
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          <Icon size={15} />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-xl p-1 text-sm font-medium text-foreground hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="User menu"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-brand text-white font-bold text-xs shadow-sm">
                  {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 z-50 rounded-2xl border border-border bg-popover shadow-modal animate-scale-in p-2 space-y-1">
                    <div className="px-3 py-2 border-b border-border mb-1">
                      <p className="text-sm font-semibold text-foreground truncate">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      <span className="mt-1.5 inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary capitalize">
                        {role} account
                      </span>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <User size={15} className="text-muted-foreground" />
                      <span>Profile & Settings</span>
                    </Link>

                    {role === 'candidate' && (
                      <Link
                        to="/candidate/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <LayoutDashboard size={15} className="text-muted-foreground" />
                        <span>Candidate Dashboard</span>
                      </Link>
                    )}

                    {role === 'hr' && (
                      <Link
                        to="/hr/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <LayoutDashboard size={15} className="text-muted-foreground" />
                        <span>Recruiter Dashboard</span>
                      </Link>
                    )}

                    {role === 'admin' && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <Shield size={15} className="text-muted-foreground" />
                        <span>Admin Console</span>
                      </Link>
                    )}

                    <div className="h-px bg-border my-1" />

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut size={15} />
                      <span>Log Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Main Workspace Area */}
        <main className="flex-1 overflow-y-auto bg-background focus:outline-none">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
