import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  MessagesSquare,
  Users,
  BarChart3,
  Bot,
  PhoneCall,
  Settings,
  Search,
  LogOut,
  Sparkles,
  Menu,
  X,
  Moon,
  Sun,
  Megaphone,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { NotificationCenter } from '@/components/ui-kit/NotificationCenter';
import { AiStatusControl } from '@/components/layout/AiStatusControl';
import { DemoBanner } from '@/components/ui-kit/DemoBanner';
import { GlobalSearchDropdown, type GlobalSearchHandle } from '@/components/layout/GlobalSearchDropdown';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inbox', label: 'Unified Inbox', icon: MessagesSquare },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/automations', label: 'Automation Builder', icon: Bot },
  { to: '/voice', label: 'Voice Calls', icon: PhoneCall },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<GlobalSearchHandle>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  // Ctrl+K / Cmd+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('omniflow_auth')) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('omniflow_auth');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex text-foreground">
      {/* Desktop Sidebar — Linear/Vercel style */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-3 sticky top-0 h-screen">
        <Brand />
        <NavList pathname={location.pathname} onNavigate={() => setMobileOpen(false)} />
        <UserCard onLogout={logout} />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 26 }}
              className="w-64 h-full bg-sidebar border-r border-sidebar-border p-3 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <Brand />
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <NavList pathname={location.pathname} onNavigate={() => setMobileOpen(false)} />
              <UserCard onLogout={logout} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col">
        <DemoBanner />

        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/60 px-4 lg:px-8 h-16 flex items-center gap-3">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchOpen(false);
                  searchRef.current?.blur();
                }
                if ((e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') && searchOpen) {
                  searchDropdownRef.current?.handleKeyDown(e);
                }
              }}
              placeholder="Search conversations, leads, automations…  (Ctrl+K)"
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-border/60 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
            <GlobalSearchDropdown
              ref={searchDropdownRef}
              query={searchQuery}
              onQueryChange={setSearchQuery}
              isOpen={searchOpen}
              onClose={() => {
                setSearchOpen(false);
                searchRef.current?.blur();
              }}
              inputRef={searchRef}
            />
          </div>

          <button
            onClick={toggle}
            className="p-2.5 rounded-xl glass hover:bg-white/10 transition-all"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-sky-400" />
            )}
          </button>

          <NotificationCenter />

          <AiStatusControl />
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-[1600px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <NavLink to="/dashboard" className="flex items-center gap-2.5 px-2 py-3 mb-2 group">
      <div className="w-9 h-9 rounded-xl grad-primary grid place-items-center ring-glow group-hover:ring-glow-strong transition-all">
        <Sparkles className="w-4.5 h-4.5 text-white" />
      </div>
      <div>
        <div className="font-display font-bold text-lg leading-none grad-text">OmniFlow</div>
        <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 mt-0.5">AI Suite</div>
      </div>
    </NavLink>
  );
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 flex flex-col gap-0.5 py-3">
      {nav.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.to || (item.to !== '/dashboard' && pathname.startsWith(item.to));
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive
                ? 'bg-sidebar-accent text-sidebar-foreground'
                : 'text-muted-foreground/70 hover:text-sidebar-foreground hover:bg-white/5'
            }`}
          >
            {/* Active indicator bar — Linear style */}
            {isActive && (
              <motion.span
                layoutId="activeNav"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full grad-primary"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <Icon className={`w-4 h-4 transition-all ${isActive ? 'text-accent' : ''}`} />
            <span>{item.label}</span>
            {isActive && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary/60 animate-glow-pulse" />
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

function UserCard({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="mt-auto pt-3 border-t border-sidebar-border">
      <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors group">
        <div className="w-9 h-9 rounded-full grad-primary grid place-items-center text-sm font-semibold shrink-0 ring-glow">AM</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate text-sidebar-foreground">Alex Morgan</div>
          <div className="text-xs text-muted-foreground/60 truncate">Pro · Acme Inc</div>
        </div>
        <button
          onClick={onLogout}
          className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
