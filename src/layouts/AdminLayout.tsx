import { Outlet, Link, useLocation } from 'react-router-dom';
import logo from '../logo';
import {
  LayoutDashboard,
  ShoppingCart,
  ListOrdered,
  Package,
  Users,
  Settings,
  LogOut,
  Calendar,
  Wallet,
  FileText,
  History,
  FolderOpen,
  BookOpen,
  FileBadge2,
  Languages,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { getProfileDisplayName } from '../lib/adminData';
import { useAuth } from '../providers/AuthProvider';
import { useLanguage } from '../providers/LanguageProvider';
import { useEffect, useState } from 'react';

const navigation = [
  { key: 'dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { key: 'agenda', href: '/admin/agenda', icon: Calendar },
  { key: 'pos', href: '/admin/pos', icon: ShoppingCart },
  { key: 'queue', href: '/admin/queue', icon: ListOrdered },
  { key: 'inventory', href: '/admin/inventory', icon: Package },
  { key: 'catalog', href: '/admin/catalog', icon: BookOpen },
  { key: 'documents', href: '/admin/documents', icon: FileBadge2 },
  { key: 'finance', href: '/admin/finance', icon: Wallet },
  { key: 'billing', href: '/admin/billing', icon: FileText },
  { key: 'repository', href: '/admin/repository', icon: FolderOpen },
  { key: 'history', href: '/admin/history', icon: History },
  { key: 'team', href: '/admin/team', icon: Users },
  { key: 'settings', href: '/admin/settings', icon: Settings },
] as const;

function SidebarContent({
  onClose,
  isMobile,
}: {
  onClose?: () => void;
  isMobile: boolean;
}) {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const toggleLanguage = () => setLanguage(language === 'pt' ? 'en' : 'pt');
  const displayName = getProfileDisplayName(profile);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
        <Link
          to="/"
          className="flex items-center gap-3 transition-transform duration-300 hover:scale-[1.02]"
          onClick={isMobile ? onClose : undefined}
        >
          <img src={logo} alt="THE DOCTOR 46" className="brand-logo-blue h-11 w-11 object-contain" />
          <div className="flex flex-col leading-none">
            <span className="font-display text-base font-bold tracking-tight text-white">
              THE DOCTOR 46
            </span>
            <span className="mt-0.5 font-display text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
              Car Wash
            </span>
          </div>
        </Link>
        {isMobile && onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.menu.close')}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {/* User Card */}
      <div className="border-b border-white/10 px-5 py-4">
        <div className="relative flex items-center gap-3 rounded-xl bg-white/5 p-3.5 shadow-lg shadow-primary/5 backdrop-blur-sm">
          <div className="relative">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 border border-primary/30 text-white font-semibold text-lg">
              {displayName.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || 'SA'}
            </div>
            <motion.div
              className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-darker"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            />
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-white">Super Admin</div>
            <div className="text-xs uppercase tracking-wider text-gray-400 mt-0.5">
              Administrador Geral do Sistema
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 custom-scrollbar">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <motion.div key={item.key} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
              <Link
                to={item.href}
                onClick={isMobile ? onClose : undefined}
                className={cn(
                  'group relative flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-300',
                  isActive
                    ? 'bg-gradient-to-r from-primary/25 via-primary/15 to-transparent text-white shadow-[0_0_20px_rgba(0,102,255,0.25)] border-l-4 border-primary font-semibold'
                    : 'text-gray-400 hover:bg-white/[0.04] hover:text-white border-l-4 border-transparent'
                )}
              >
                <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-300 shadow-sm", isActive ? "bg-primary/20 text-primary shadow-[0_0_15px_rgba(0,102,255,0.4)]" : "bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white")}>
                  <item.icon className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                </div>
                <span className="truncate tracking-wide">{t(`admin.nav.${item.key}`)}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_#0066ff]"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="border-t border-white/10 p-4 space-y-2">
        <motion.button
          type="button"
          onClick={toggleLanguage}
          title={language === 'pt' ? t('common.language.toggle.en') : t('common.language.toggle.pt')}
          aria-label={language === 'pt' ? t('common.language.toggle.en') : t('common.language.toggle.pt')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex w-full h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-semibold text-gray-400 transition-all hover:bg-white/5 hover:text-primary hover:border-primary/30"
        >
          <Languages className="h-4 w-4" />
          <span>{language === 'pt' ? 'EN' : 'PT'}</span>
        </motion.button>
        <motion.button
          type="button"
          onClick={() => void signOut()}
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
          whileTap={{ scale: 0.98 }}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-400 transition-all hover:text-red-400 hover:bg-red-500/5"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="truncate">{t('admin.logout')}</span>
        </motion.button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const location = useLocation();
  const { t } = useLanguage();
  const { profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeNav = navigation.find((n) => n.href === location.pathname);

  // Compute initials at component top level (not inside JSX)
  const displayName = getProfileDisplayName(profile);
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || 'ST';

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-darker">
      {/* ─── Desktop Sidebar (md+) ─── */}
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="hidden md:flex md:w-64 md:shrink-0 md:flex-col bg-dark/50 backdrop-blur-sm border-r border-white/10 shadow-xl"
      >
        <SidebarContent isMobile={false} />
      </motion.aside>

      {/* ─── Mobile Drawer Overlay ─── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-dark/95 shadow-2xl md:hidden"
            >
              <SidebarContent isMobile onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Main Content ─── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-dark/40 backdrop-blur-md md:h-20 md:px-8 px-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <motion.button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={t('common.menu.open')}
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.95 }}
              className="rounded-lg p-2 text-gray-400 transition-colors md:hidden"
            >
              <Menu className="h-5 w-5" />
            </motion.button>
            <h1 className="text-lg font-semibold font-display md:text-xl text-white">
              {activeNav ? t(`admin.nav.${activeNav.key}`) : t('admin.title.default')}
            </h1>
          </div>

          {/* Header right — desktop only (avatar shown in sidebar on all sizes) */}
          <motion.div 
            className="hidden items-center gap-3 md:flex"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div 
              className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 cursor-pointer hover:border-primary/50 hover:bg-primary/30"
              whileHover={{ boxShadow: '0 0 20px rgba(0, 87, 255, 0.3)' }}
            >
              <span className="text-primary font-bold text-sm">
                {initials}
              </span>
            </motion.div>
          </motion.div>
        </motion.header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-darker/30">
          <div className="min-h-full p-4 md:p-8">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              exit={{ opacity: 0, y: -18 }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}

