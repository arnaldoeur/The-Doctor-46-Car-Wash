import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { useLanguage } from '../../providers/LanguageProvider';

export default function Contact() {
 const { t } = useLanguage();

 return (
 <div className="flex flex-col bg-darker min-h-screen">
 {/* Hero Section */}
 <section className="relative py-24 flex items-center justify-center overflow-hidden border-b border-white/10">
 <div className="absolute inset-0 z-0">
 <img
 src="https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=2000"
 alt="Contact Us"
 className="w-full h-full object-cover opacity-20"
 referrerPolicy="no-referrer"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-darker via-darker/80 to-transparent" />
 </div>

 <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.8 }}
 className="max-w-3xl mx-auto"
 >
 <h1 className="text-5xl md:text-7xl font-bold font-display leading-tight mb-6">
 {t('contact.hero.title')}
 </h1>
 <p className="text-xl text-gray-400 leading-relaxed">
 {t('contact.hero.desc')}
 </p>
 </motion.div>
 </div>
 </section>

 {/* Contact Content */}
 <section className="py-24 bg-dark relative">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
 {/* Contact Info */}
 <motion.div
 initial={{ opacity: 0, x: -30 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 className="space-y-12"
 >
 <div>
 <h2 className="text-3xl font-bold font-display mb-6">{t('contact.info.title')}</h2>
 <p className="text-gray-400 text-lg">
 {t('contact.info.desc')}
 </p>
 </div>

 <div className="space-y-8">
 <a
 href="https://ww.google.com/maps/search/?api=1&query=Bairro+Medeiros+Lichinga+Niassa+Mozambique"
 target="_blank"
 rel="noreferrer"
 className="flex items-start gap-4 rounded-2xl transition-colors hover:bg-white/5"
 >
 <div className="mt-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
 <MapPin className="w-6 h-6 text-primary" />
 </div>
 <div>
 <h3 className="text-xl font-bold font-display mb-2">{t('contact.info.location')}</h3>
 <p className="text-gray-400">Bairro Medeiros<br />Lichinga, Niassa<br />Moçambique</p>
 </div>
 </a>

 <div className="flex items-start gap-4">
 <div className="mt-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
 <Phone className="w-6 h-6 text-primary" />
 </div>
 <div>
 <h3 className="text-xl font-bold font-display mb-2">{t('contact.info.phone')}</h3>
 <p className="text-gray-400">
 <a href="tel:+258874124865" className="transition-colors hover:text-primary">
 +258 87 412 4865
 </a>
 <br />
 <a href="tel:+258849278497" className="transition-colors hover:text-primary">
 +258 84 927 8497
 </a>
 </p>
 </div>
 </div>

 <div className="flex items-start gap-4">
 <div className="mt-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
 <Mail className="w-6 h-6 text-primary" />
 </div>
 <div>
 <h3 className="text-xl font-bold font-display mb-2">{t('contact.info.email')}</h3>
 <p className="text-gray-400">
 <a href="mailto:geral@carwash46.com" className="transition-colors hover:text-primary">
 geral@carwash46.com
 </a>
 </p>
 </div>
 </div>

 <div className="flex items-start gap-4">
 <div className="mt-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
 <Clock className="w-6 h-6 text-primary" />
 </div>
 <div>
 <h3 className="text-xl font-bold font-display mb-2">{t('contact.info.hours')}</h3>
 <p className="text-gray-400">{t('contact.hours.week')}<br />{t('contact.hours.sat')}<br />{t('contact.hours.sun')}</p>
 </div>
 </div>
 </div>
 </motion.div>

 {/* Contact Form */}
 <motion.div
 initial={{ opacity: 0, x: 30 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 className="bg-darker border border-white/10 rounded-3xl p-8 md:p-10"
 >
 <h3 className="text-2xl font-bold font-display mb-6">{t('contact.form.title')}</h3>
 <form className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="text-sm font-medium text-gray-300">{t('contact.form.name')}</label>
 <input
 type="text"
 placeholder={t('contact.form.name_placeholder')}
 className="w-full bg-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
 />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium text-gray-300">{t('contact.form.phone')}</label>
 <input
 type="tel"
 placeholder={t('contact.form.phone_placeholder')}
 className="w-full bg-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
 />
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium text-gray-300">{t('contact.form.email')}</label>
 <input
 type="email"
 placeholder={t('contact.form.email_placeholder')}
 className="w-full bg-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
 />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium text-gray-300">{t('contact.form.subject')}</label>
 <select className="w-full bg-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors appearance-none">
 <option value="">{t('contact.form.subject_default')}</option>
 <option value="agendamento">{t('contact.form.subject_booking')}</option>
 <option value="orcamento">{t('contact.form.subject_quote')}</option>
 <option value="pecas">{t('contact.form.subject_parts')}</option>
 <option value="outros">{t('contact.form.subject_others')}</option>
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium text-gray-300">{t('contact.form.message')}</label>
 <textarea
 rows={4}
 placeholder={t('contact.form.message_placeholder')}
 className="w-full bg-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none"
 ></textarea>
 </div>
 <button
 type="button"
 className="w-full bg-primary hover:bg-primary-hover text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,71,255,0.3)]"
 >
 <Send className="w-5 h-5" />
 {t('contact.form.send')}
 </button>
 </form>
 </motion.div>
 </div>
 </div>
 </section>
 </div>
 );
}
