import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Calendar, History, Star, LogOut, Settings, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../lib/utils';
import logo from '../logo';
import { useAuth } from '../providers/AuthProvider';
import { useLanguage } from '../providers/LanguageProvider';
import { useEffect, useState } from 'react';

const navigation = [
  { key: 'dashboard', href: '/customer/dashboard', icon: User },
  { key: 'profile', href: '/customer/profile', icon: Settings },
  { key: 'appointments', href: '/customer/appointments', icon: Calendar },
  { key: 'history', href: '/customer/history', icon: History },
  { key: 'loyalty', href: '/customer/loyalty', icon: Star },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || 'CL';
}

function SidebarContent({ onClose, isMobile }: { onClose?: () => void; isMobile: boolean }) {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const displayName = profile?.full_name?.trim() || 'Cliente';
  const initials = getInitials(displayName);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
        <Link to="/" className="flex items-center gap-3 transition-transform duration-300 hover:scale-[1.02]"
          onClick={isMobile ? onClose : undefined}>
          <img src={logo} alt="THE DOCTOR 46" className="brand-logo-blue h-11 w-11 object-contain" />
          <div className="flex flex-col leading-none">
            <span className="font-display text-base font-bold tracking-tight text-white">THE DOCTOR 46</span>
            <span className="mt-0.5 font-display text-[10px] font-bold uppercase tracking-[0.28em] text-primary">Car Wash</span>
          </div>
        </Link>
        {isMobile && onClose ? (
          <button type="button" onClick={onClose} aria-label={t('common.menu.close')}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {/* User info */}
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-[10px] uppercase tracking-[0.24em] text-primary">{t('customer.session.active')}</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/20">
            <span className="text-xs font-bold text-primary">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
            <p className="truncate text-xs text-gray-400">{profile?.email ?? t('customer.portal')}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link key={item.key} to={item.href} onClick={isMobile ? onClose : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-white shadow-[0_0_14px_rgba(0,71,255,0.22)]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}>
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{t(`customer.nav.${item.key}`)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-white/10 p-3">
        <button type="button" onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-400 transition-all hover:bg-white/5 hover:text-white">
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="truncate">{t('customer.logout')}</span>
        </button>
      </div>
    </div>
  );
}

export default function CustomerLayout() {
  const location = useLocation();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeItem = navigation.find((item) => item.href === location.pathname);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-darker">
      {/* Desktop sidebar */}
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="hidden md:flex md:w-64 md:shrink-0 md:flex-col bg-dark border-r border-white/10"
      >
        <SidebarContent isMobile={false} />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)} aria-hidden="true" />
            <motion.div key="drawer"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-dark shadow-2xl md:hidden">
              <SidebarContent isMobile onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <motion.header
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-dark/50 px-4 backdrop-blur-md md:h-20 md:px-8"
        >
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen(true)} aria-label={t('common.menu.open')}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white md:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-display text-lg font-semibold md:text-xl">
              {activeItem ? t(`customer.nav.${activeItem.key}`) : t('customer.title.default')}
            </h1>
          </div>
        </motion.header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8">
            <motion.div key={location.pathname}
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}>
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
