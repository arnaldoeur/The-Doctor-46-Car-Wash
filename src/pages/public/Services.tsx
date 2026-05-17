import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Info, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { groupedServices } from '../../lib/serviceCatalog';
import { buildServiceWhatsAppLink } from '../../lib/whatsapp';
import { useLanguage } from '../../providers/LanguageProvider';
import { getTranslatedGroupedServices } from '../../lib/i18n-services';

export default function Services() {
 const { t } = useLanguage();
 const translatedGroups = getTranslatedGroupedServices(groupedServices, t);

 return (
 <div className="min-h-screen bg-darker py-20">
 <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
 <div className="mx-auto mb-20 max-w-3xl text-center">
 <h1 className="mb-6 text-4xl font-bold font-display md:text-5xl">{t('services.title')}</h1>
 <p className="text-lg text-gray-400">
 {t('services.desc')}
 </p>
 </div>

 <div className="space-y-24">
 {translatedGroups.map((group, idx) => (
 <div key={idx}>
 <h2 className="mb-10 flex items-center gap-4 border-b border-white/10 pb-4 text-3xl font-bold font-display">
 <span className="h-1 w-8 rounded-full bg-primary" />
 {group.category}
 </h2>

 <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
 {group.items.map((service, sIdx) => (
 <motion.div
 key={service.id}
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: sIdx * 0.08 }}
 className="flex flex-col rounded-3xl border border-white/10 bg-dark p-8 transition-colors hover:border-primary/30"
 >
 <div className="mb-4 flex items-start justify-between gap-6">
 <h3 className="text-2xl font-bold font-display">{service.name}</h3>
 <div className="text-right">
 <div className="text-3xl font-bold text-primary">{service.price}</div>
 <div className="mt-1 flex items-center gap-1 text-sm text-gray-400">
 <Clock className="h-4 w-4" />
 {service.duration}
 </div>
 </div>
 </div>

 <p className="mb-8 flex-grow text-gray-400">{service.description}</p>

 <div className="mb-8">
 <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-300">
 <Info className="h-4 w-4" /> {t('services.includes')}
 </h4>
 <ul className="grid grid-cols-2 gap-3">
 {service.features.map((feature) => (
 <li key={feature} className="flex items-center gap-2 text-sm text-gray-400">
 <CheckCircle2 className="h-4 w-4 text-primary" />
 {feature}
 </li>
 ))}
 </ul>
 </div>

 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 <Link
 to={`/booking?service=${service.id}`}
 className="w-full rounded-xl border border-white/10 bg-white/5 py-4 text-center font-semibold transition-all hover:border-primary hover:bg-primary hover:text-white"
 >
 {t('services.book')} {service.name}
 </Link>
 <a
 href={buildServiceWhatsAppLink(service.name)}
 target="_blank"
 rel="noreferrer"
 className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-4 text-center font-semibold text-emerald-300 transition-all hover:border-emerald-400 hover:bg-emerald-500/20 hover:text-white"
 >
 <MessageCircle className="h-4 w-4" />
 {t('services.whatsapp')}
 </a>
 </div>
 </motion.div>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}
