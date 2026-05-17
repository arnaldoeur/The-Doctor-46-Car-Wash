import { ArrowRight, Star, Shield, Clock, CheckCircle2, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { featuredHomeServices, serviceCatalog } from '../../lib/serviceCatalog';
import { buildWhatsAppLink } from '../../lib/whatsapp';
import { useLanguage } from '../../providers/LanguageProvider';
import { getTranslatedCatalog } from '../../lib/i18n-services';

export default function Home() {
 const { t, language } = useLanguage();

 const highlightedServices = featuredHomeServices
 .map((id) => serviceCatalog.find((service) => service.id === id))
 .filter((s): s is any => !!s);

 const translatedHighlightedServices = getTranslatedCatalog(highlightedServices, t);

 return (
 <div className="flex flex-col">
 <section className="relative flex min-h-screen min-h-[100svh] items-center justify-center overflow-hidden py-24 sm:py-28">
 <div className="absolute inset-0 z-0">
 <img
 src="https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=2000"
 alt="Car Wash"
 className="h-full w-full object-cover opacity-30"
 referrerPolicy="no-referrer"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/80 to-transparent" />
 <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/50 to-transparent" />
 </div>

 <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
 <motion.div
 initial={{ opacity: 0, y: 30 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.8 }}
 className="w-full max-w-3xl"
 >
 <h1 className="mb-6 text-4xl font-bold font-display leading-tight sm:text-5xl md:text-6xl lg:text-7xl">
 {t('home.hero.title')} <br />
 <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
 {t('home.hero.subtitle')}
 </span>
 </h1>
 <p className="mb-10 max-w-2xl text-base leading-relaxed text-gray-400 sm:text-lg md:text-xl">
 {t('home.hero.description')}
 </p>
 <div className="flex flex-col gap-4 sm:flex-row">
 <Link
 to="/booking"
 className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-semibold text-white shadow-[0_0_30px_rgba(0,71,255,0.4)] transition-all hover:-translate-y-1 hover:bg-primary-hover hover:shadow-[0_0_40px_rgba(0,71,255,0.6)] sm:w-auto"
 >
 {t('home.hero.cta.book')}
 <ArrowRight className="h-5 w-5" />
 </Link>
 <Link
 to="/services"
 className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-lg font-semibold text-white transition-all backdrop-blur-md hover:bg-white/10 sm:w-auto"
 >
 {t('home.hero.cta.services')}
 </Link>
 </div>
 </motion.div>
 </div>
 </section>

 <section className="relative bg-darker py-24">
 <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
 <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
 {[
 {
 icon: Shield,
 title: t('process.adv.2.title'),
 desc: t('process.adv.2.desc'),
 },
 {
 icon: Clock,
 title: t('process.steps.2.title'),
 desc: t('process.steps.2.desc'),
 },
 {
 icon: Star,
 title: t('process.adv.3.title'),
 desc: t('process.adv.3.desc'),
 },
 ].map((feature, idx) => (
 <motion.div
 key={idx}
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: idx * 0.2 }}
 className="group rounded-3xl border border-white/5 bg-dark p-8 transition-colors hover:border-primary/30"
 >
 <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/20">
 <feature.icon className="h-7 w-7 text-primary" />
 </div>
 <h3 className="mb-3 text-xl font-bold font-display">{feature.title}</h3>
 <p className="leading-relaxed text-gray-400">{feature.desc}</p>
 </motion.div>
 ))}
 </div>
 </div>
 </section>

 <section className="relative flex min-h-screen min-h-[100svh] items-center overflow-hidden bg-dark py-16 sm:py-24">
 <div className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />

 <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
 <div className="mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
 <div>
 <h2 className="mb-4 text-3xl font-bold font-display sm:text-4xl">{t('home.services.title')}</h2>
 <p className="max-w-xl text-gray-400">
 {t('services.desc')}
 </p>
 </div>
 <Link
 to="/services"
 className="inline-flex items-center gap-2 font-medium text-primary transition-colors hover:text-white"
 >
 {t('home.services.view_all')} <ArrowRight className="h-4 w-4" />
 </Link>
 </div>

 <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
 {translatedHighlightedServices.map((service) => (
 <motion.article
 key={service.id}
 whileHover={{ y: -6 }}
 transition={{ duration: 0.22, ease: 'easeOut' }}
 className={cn(
 'relative flex h-full flex-col overflow-hidden rounded-[2rem] border px-6 py-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] transition-all sm:px-7',
 service.highlight === 'popular'
 ? 'scale-[1.02] border-primary/50 bg-[linear-gradient(180deg,rgba(0,71,255,0.14),rgba(7,10,18,0.96))] shadow-[0_24px_80px_rgba(0,71,255,0.18)] lg:scale-[1.05]'
 : 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(7,10,18,0.98))] hover:border-white/15'
 )}
 >
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)] opacity-50" />
 {service.highlight === 'popular' && (
 <div className="absolute left-6 top-5 rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
 {language === 'pt' ? 'Mais Popular' : 'Most Popular'}
 </div>
 )}
 <div className={cn('relative flex h-full flex-col', service.highlight === 'popular' ? 'pt-10' : '')}>
 <div className="mb-5">
 <span className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-gray-400">
 {service.category}
 </span>
 </div>

 <div className="mb-5 space-y-4">
 <h3 className="max-w-[11ch] text-[1.75rem] font-bold font-display leading-[1.08] tracking-tight text-white sm:text-[1.95rem]">
 {service.name}
 </h3>
 <div className="inline-flex w-fit max-w-full self-start rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 backdrop-blur-sm">
 <div className="whitespace-nowrap text-[1.25rem] font-semibold leading-none tracking-tight text-white sm:text-[1.4rem]">
 {service.price}
 </div>
 </div>
 </div>

 <p className="mb-6 max-w-[30ch] text-sm leading-7 text-gray-400">
 {service.description}
 </p>

 <ul className="mb-7 flex-grow space-y-3">
 {service.features.slice(0, 3).map((feature) => (
 <li key={feature} className="flex items-start gap-3 text-sm text-gray-300">
 <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" />
 <span className="leading-6">{feature}</span>
 </li>
 ))}
 </ul>

 <div className="mt-auto border-t border-white/8 pt-5">
 <Link
 to={`/booking?service=${service.id}`}
 className={cn(
 'inline-flex h-12 w-full items-center justify-center rounded-xl px-4 text-center text-sm font-semibold text-white transition-all hover:-translate-y-0.5',
 service.highlight === 'popular'
 ? 'bg-primary shadow-[0_14px_30px_rgba(0,71,255,0.28)] hover:bg-primary-hover'
 : 'bg-white/7 hover:bg-white/12'
 )}
 >
 {t('nav.booking')}
 </Link>
 </div>
 </div>
 </motion.article>
 ))}
 </div>
 </div>
 </section>

 <a
 href={buildWhatsAppLink(language === 'pt' ? 'Ola, gostaria de agendar um servico na The Doctor 46 Car Wash. Podem ajudar-me?' : 'Hello, I would like to book a service at The Doctor 46 Car Wash. Can you help me?')}
 target="_blank"
 rel="noreferrer"
 className="fixed bottom-5 right-5 z-40 inline-flex h-14 items-center justify-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500 px-5 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(16,185,129,0.28)] transition-all hover:-translate-y-1 hover:bg-emerald-400 sm:bottom-6 sm:right-6"
 aria-label={t('home.whatsapp.cta')}
 >
 <MessageCircle className="h-5 w-5" />
 <span className="hidden sm:inline">WhatsApp</span>
 </a>
 </div>
 );
}
