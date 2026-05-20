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
  ChevronLeft,
  ChevronRight,
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
  isCollapsed = false,
  onToggleCollapse,
}: {
  onClose?: () => void;
  isMobile: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const toggleLanguage = () => setLanguage(language === 'pt' ? 'en' : 'pt');
  const displayName = getProfileDisplayName(profile);
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || 'SA';

  const roleLabel = profile?.role === 'super_admin' ? 'Super Admin' : profile?.role === 'admin' ? 'Admin' : 'Staff';

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className={cn("flex h-20 shrink-0 items-center border-b border-white/[0.05]", isCollapsed ? "justify-center px-0" : "justify-between px-5")}>
        <Link
          to="/"
          className={cn("flex items-center gap-3 transition-transform duration-300 hover:scale-[1.02]", isCollapsed && "justify-center")}
          onClick={isMobile ? onClose : undefined}
        >
          <img src={logo} alt="THE DOCTOR 46" className="brand-logo-blue h-10 w-10 object-contain drop-shadow-[0_0_15px_rgba(0,71,255,0.4)]" />
          {!isCollapsed && (
            <div className="flex flex-col leading-none">
              <span className="font-display text-base font-bold tracking-tight text-white">
                THE DOCTOR 46
              </span>
              <span className="mt-0.5 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Car Wash
              </span>
            </div>
          )}
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
      <div className={cn("border-b border-white/[0.05] py-4", isCollapsed ? "px-2" : "px-5")}>
        <div className={cn("relative flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/[0.05] shadow-sm backdrop-blur-md transition-all", isCollapsed ? "p-2 justify-center" : "p-3.5")}>
          <div className="relative shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-white font-medium text-sm shadow-[0_0_10px_rgba(0,71,255,0.15)]">
              {initials}
            </div>
            <motion.div
              className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-darker"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold tracking-tight text-white/90">{displayName || 'Administrador'}</div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mt-0.5">
                {roleLabel}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-5 custom-scrollbar">
        {navigation.filter((item) => {
          const role = profile?.role || 'operational';
          const isFullAdmin = role === 'super_admin' || role === 'admin';
          if (!isFullAdmin) {
            return !['finance', 'billing', 'team', 'settings'].includes(item.key);
          }
          return true;
        }).map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.key}
              to={item.href}
              onClick={isMobile ? onClose : undefined}
              className={cn(
                'group relative flex items-center rounded-xl transition-all duration-300',
                isCollapsed ? 'justify-center p-2.5' : 'gap-3.5 px-3 py-2.5',
                isActive
                  ? 'bg-primary/[0.08] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] ring-1 ring-primary/20'
                  : 'text-gray-400 hover:bg-white/[0.04] hover:text-white'
              )}
            >
              <div className={cn("flex items-center justify-center transition-colors duration-300", 
                isActive ? "text-primary drop-shadow-[0_0_8px_rgba(0,71,255,0.5)]" : "text-gray-400 group-hover:text-white"
              )}>
                <item.icon className={cn("shrink-0 transition-transform duration-300 group-hover:scale-110", isCollapsed ? "h-5 w-5" : "h-[18px] w-[18px]")} />
              </div>
              
              {!isCollapsed && (
                <span className={cn("truncate text-[13px] font-medium tracking-wide", isActive ? "font-semibold" : "")}>
                  {t(`admin.nav.${item.key}`)}
                </span>
              )}

              {/* Tooltip on Collapsed */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-white/10">
                  {t(`admin.nav.${item.key}`)}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className={cn("border-t border-white/[0.05] p-3 space-y-2", isCollapsed && "items-center flex flex-col")}>
        <button
          type="button"
          onClick={toggleLanguage}
          title={language === 'pt' ? t('common.language.toggle.en') : t('common.language.toggle.pt')}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl border border-white/[0.05] text-xs font-semibold text-gray-400 transition-all hover:bg-white/5 hover:text-primary",
            isCollapsed ? "h-10 w-10" : "h-9 w-full gap-2 px-3"
          )}
        >
          <Languages className="h-4 w-4" />
          {!isCollapsed && <span>{language === 'pt' ? 'EN' : 'PT'}</span>}
        </button>

        <button
          type="button"
          onClick={() => void signOut()}
          className={cn(
            "flex items-center rounded-xl text-sm font-medium text-gray-400 transition-all hover:text-red-400 hover:bg-red-500/10",
            isCollapsed ? "justify-center h-10 w-10" : "w-full gap-3 px-3 py-2"
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!isCollapsed && <span className="truncate">{t('admin.logout')}</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-red-500/90 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
              {t('admin.logout')}
            </div>
          )}
        </button>

        {!isMobile && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex absolute -right-3 top-10 h-6 w-6 items-center justify-center rounded-full bg-dark border border-white/10 text-gray-400 hover:text-white hover:border-primary transition-all z-50 shadow-md"
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const location = useLocation();
  const { t } = useLanguage();
  const { profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  
  const activeNav = navigation.find((n) => n.href === location.pathname);

  const displayName = getProfileDisplayName(profile);
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || 'SA';

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    if (sidebarOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#030303]">
      {/* ─── Desktop Sidebar (md+) ─── */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 260 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="hidden md:flex md:shrink-0 md:flex-col bg-[#0A0A0A]/80 backdrop-blur-2xl border-r border-white/[0.04] shadow-[4px_0_24px_rgba(0,0,0,0.2)] relative z-20"
      >
        <SidebarContent 
          isMobile={false} 
          isCollapsed={isCollapsed} 
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)} 
        />
      </motion.aside>

      {/* ─── Mobile Drawer Overlay ─── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] bg-[#0A0A0A] shadow-2xl border-r border-white/[0.05] md:hidden"
            >
              <SidebarContent isMobile onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Main Content ─── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden relative">
        {/* Glow effect at the top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/10 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-screen" />

        {/* Top Header */}
        <header
          className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/[0.04] bg-[#0A0A0A]/40 backdrop-blur-xl px-4 md:px-8 relative z-10"
        >
          <div className="flex items-center gap-4">
            <motion.button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={t('common.menu.open')}
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
              whileTap={{ scale: 0.95 }}
              className="rounded-lg p-2.5 text-gray-400 transition-colors md:hidden border border-white/[0.05] bg-white/[0.02]"
            >
              <Menu className="h-[18px] w-[18px]" />
            </motion.button>
            <h1 className="text-xl font-semibold tracking-tight text-white/95">
              {activeNav ? t(`admin.nav.${activeNav.key}`) : t('admin.title.default')}
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {/* Quick action or extra info could go here */}
            <motion.div 
              className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(0,71,255,0.15)] cursor-pointer"
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0, 71, 255, 0.3)' }}
            >
              <span className="text-primary font-bold text-xs">
                {initials}
              </span>
            </motion.div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-10">
          <div className="min-h-full p-4 md:p-8 max-w-[1600px] mx-auto w-full">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              exit={{ opacity: 0 }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
