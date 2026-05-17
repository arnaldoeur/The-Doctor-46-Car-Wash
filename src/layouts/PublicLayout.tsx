import { Outlet, Link, useLocation } from 'react-router-dom';
import logo from '../logo';
import { Menu, X, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '../providers/LanguageProvider';

export default function PublicLayout() {
 const [isMenuOpen, setIsMenuOpen] = useState(false);
 const location = useLocation();
 const { t, language, setLanguage } = useLanguage();

 useEffect(() => {
 setIsMenuOpen(false);
 }, [location.pathname]);

 const toggleLanguage = () => {
 setLanguage(language === 'pt' ? 'en' : 'pt');
 };

 return (
 <div className="flex min-h-screen flex-col bg-dark">
 {/* Header */}
 <motion.header
 initial={{ opacity: 0, y: -18 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.45, ease: 'easeOut' }}
 className="sticky top-0 z-50 border-b border-white/10 bg-darker/80 backdrop-blur-md"
 >
 <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
 <div className="flex h-20 items-center justify-between">
 <Link to="/" className="flex items-center gap-4 transition-transform duration-300 hover:scale-[1.02]">
 <img
 src={logo}
 alt="THE DOCTOR 46"
 className="brand-logo-blue h-14 w-14 object-contain"
 />
 <div className="flex flex-col leading-none">
 <span className="font-display text-xl font-bold tracking-tight text-white">
 THE DOCTOR 46
 </span>
 <span className="mt-1 font-display text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
 Car Wash
 </span>
 </div>
 </Link>

 <nav className="hidden items-center gap-8 md:flex">
 <Link to="/" className="text-sm font-medium text-gray-300 transition-all duration-300 hover:-translate-y-0.5 hover:text-white">
 {t('nav.home')}
 </Link>
 <Link to="/about" className="text-sm font-medium text-gray-300 transition-all duration-300 hover:-translate-y-0.5 hover:text-white">
 {t('nav.about')}
 </Link>
 <Link to="/processo" className="text-sm font-medium text-gray-300 transition-all duration-300 hover:-translate-y-0.5 hover:text-white">
 {t('nav.process')}
 </Link>
 <Link to="/services" className="text-sm font-medium text-gray-300 transition-all duration-300 hover:-translate-y-0.5 hover:text-white">
 {t('nav.services')}
 </Link>
 <Link to="/contactos" className="text-sm font-medium text-gray-300 transition-all duration-300 hover:-translate-y-0.5 hover:text-white">
 {t('nav.contacts')}
 </Link>
 </nav>

 <div className="hidden items-center gap-4 md:flex">
 <button
 onClick={toggleLanguage}
 className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-sm font-medium text-gray-300 transition-all duration-300 hover:border-primary/40 hover:bg-white/5 hover:text-white"
 title={language === 'pt' ? t('common.language.toggle.en') : t('common.language.toggle.pt')}
 aria-label={language === 'pt' ? t('common.language.toggle.en') : t('common.language.toggle.pt')}
 >
 {language === 'pt' ? (
 <>
 <span className="text-lg">🇵🇹</span>
 <span>PT</span>
 </>
 ) : (
 <>
 <span className="text-lg">🇬🇧</span>
 <span>EN</span>
 </>
 )}
 </button>
 <Link
 to="/login"
 className="flex items-center gap-2 text-sm font-medium text-gray-300 transition-all duration-300 hover:-translate-y-0.5 hover:text-white"
 >
 <User className="h-4 w-4" />
 {t('nav.login')}
 </Link>
 <Link
 to="/booking"
 className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 shadow-[0_0_20px_rgba(0,71,255,0.3)] hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-[0_0_28px_rgba(0,71,255,0.5)]"
 >
 {t('nav.booking')}
 </Link>
 </div>

 <div className="flex items-center gap-4 md:hidden">
 <button
 onClick={toggleLanguage}
 className="flex items-center gap-2 rounded-full border border-white/10 px-2.5 py-1 text-xs font-medium text-gray-300"
 >
 {language === 'pt' ? '🇵🇹 PT' : '🇬🇧 EN'}
 </button>
 <button
 className="text-gray-300 transition-colors hover:text-white"
 onClick={() => setIsMenuOpen((open) => !open)}
 aria-label={t('common.menu.open')}
 >
 {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
 </button>
 </div>
 </div>
 </div>

 <AnimatePresence>
 {isMenuOpen && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 transition={{ duration: 0.28, ease: 'easeOut' }}
 className="overflow-hidden border-b border-white/10 bg-darker md:hidden"
 >
 <div className="space-y-4 px-4 pt-2 pb-6">
 <Link to="/" className="block text-base font-medium text-gray-300 transition-colors hover:text-white">
 {t('nav.home')}
 </Link>
 <Link to="/about" className="block text-base font-medium text-gray-300 transition-colors hover:text-white">
 {t('nav.about')}
 </Link>
 <Link to="/processo" className="block text-base font-medium text-gray-300 transition-colors hover:text-white">
 {t('nav.process')}
 </Link>
 <Link to="/services" className="block text-base font-medium text-gray-300 transition-colors hover:text-white">
 {t('nav.services')}
 </Link>
 <Link to="/contactos" className="block text-base font-medium text-gray-300 transition-colors hover:text-white">
 {t('nav.contacts')}
 </Link>
 <div className="flex flex-col gap-3 pt-4">
 <Link
 to="/login"
 className="flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:border-primary/40 hover:bg-white/5"
 >
 <User className="h-4 w-4" />
 {t('nav.client_login')}
 </Link>
 <Link
 to="/booking"
 className="rounded-full bg-primary px-6 py-2.5 text-center text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-hover"
 >
 {t('nav.booking')}
 </Link>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.header>

 <main className="flex-grow">
 <motion.div
 key={`${location.pathname}${location.search}`}
 initial={{ opacity: 0, y: 18 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.36, ease: 'easeOut' }}
 >
 <Outlet />
 </motion.div>
 </main>

 <motion.footer
 initial={{ opacity: 0, y: 24 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, amount: 0.15 }}
 transition={{ duration: 0.45, ease: 'easeOut' }}
 className="border-t border-white/10 bg-darker py-12"
 >
 <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
 <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
 <div className="col-span-1 md:col-span-2">
 <Link to="/" className="mb-4 flex items-center gap-4 transition-transform duration-300 hover:scale-[1.02]">
 <img
 src={logo}
 alt="THE DOCTOR 46"
 className="brand-logo-blue h-12 w-12 object-contain"
 />
 <div className="flex flex-col leading-none">
 <span className="font-display text-lg font-bold tracking-tight text-white">
 THE DOCTOR 46
 </span>
 <span className="mt-1 font-display text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
 Car Wash
 </span>
 </div>
 </Link>
 <p className="max-w-sm text-sm text-gray-metallic">
 {t('footer.description')}
 </p>
 </div>
 <div>
 <h4 className="mb-4 font-semibold">{t('footer.quick_links')}</h4>
 <ul className="space-y-2 text-sm text-gray-metallic">
 <li><Link to="/processo" className="transition-colors hover:text-primary">{t('nav.process')}</Link></li>
 <li><Link to="/services" className="transition-colors hover:text-primary">{t('nav.services')}</Link></li>
 <li><Link to="/booking" className="transition-colors hover:text-primary">{t('nav.booking')}</Link></li>
 <li><Link to="/customer" className="transition-colors hover:text-primary">{t('nav.client_login')}</Link></li>
 </ul>
 </div>
 <div>
 <h4 className="mb-4 font-semibold">{t('footer.contact')}</h4>
 <ul className="space-y-2 text-sm text-gray-metallic">
 <li>+258 87 412 4865</li>
 <li>+258 84 927 8497</li>
 <li>geral@carwash46.com</li>
 <li>Bairro Medeiros, Lichinga, Niassa</li>
 <li>Moçambique</li>
 </ul>
 </div>
 </div>
 <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-gray-metallic">
 &copy; {new Date().getFullYear()} The Doctor 46 Car Wash. {t('footer.rights')}
 </div>
 </div>
 </motion.footer>
 </div>
 );
}
