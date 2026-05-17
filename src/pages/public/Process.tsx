import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, Droplets, Wrench, Package, CarFront, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import processHeroImage from '../../assets/process-hero-carwash.png';
import processAdvantagesImage from '../../assets/process-advantages-carwash.png';
import { useLanguage } from '../../providers/LanguageProvider';

export default function Process() {
 const { t } = useLanguage();

 return (
 <div className="flex flex-col bg-darker min-h-screen">
 {/* Hero Section */}
 <section className="relative py-24 flex items-center justify-center overflow-hidden border-b border-white/10">
 <div className="absolute inset-0 z-0">
 <img
 src={processHeroImage}
 alt="Car Detailing Process"
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
 {t('process.hero.title')}
 </h1>
 <p className="text-xl text-gray-400 leading-relaxed">
 {t('process.hero.desc')}
 </p>
 </motion.div>
 </div>
 </section>

 {/* The Washing Process */}
 <section className="relative flex min-h-screen min-h-[100svh] items-center bg-dark py-16 sm:py-24">
 <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
 <div className="text-center max-w-3xl mx-auto mb-16">
 <h2 className="text-3xl md:text-4xl font-bold font-display mb-6">{t('process.wash.title')}</h2>
 <p className="text-gray-400 text-lg">
 {t('process.wash.desc')}
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
 {/* Connecting Line */}
 <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 -translate-y-1/2 z-0" />

 {[
 {
 step: '01',
 title: t('process.steps.1.title'),
 desc: t('process.steps.1.desc'),
 icon: Droplets,
 },
 {
 step: '02',
 title: t('process.steps.2.title'),
 desc: t('process.steps.2.desc'),
 icon: ShieldCheck,
 },
 {
 step: '03',
 title: t('process.steps.3.title'),
 desc: t('process.steps.3.desc'),
 icon: Sparkles,
 },
 ].map((item, idx) => (
 <motion.div
 key={idx}
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: idx * 0.2 }}
 className="bg-darker border border-white/10 rounded-3xl p-8 relative z-10 hover:border-primary/30 transition-colors"
 >
 <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
 <item.icon className="w-8 h-8 text-primary" />
 </div>
 <div className="text-5xl font-black font-display text-white/5 absolute top-6 right-6 pointer-events-none">
 {item.step}
 </div>
 <h3 className="text-xl font-bold font-display mb-3">{item.title}</h3>
 <p className="text-gray-400">{item.desc}</p>
 </motion.div>
 ))}
 </div>
 </div>
 </section>

 {/* Advantages */}
 <section className="flex min-h-screen min-h-[100svh] items-center border-y border-white/10 bg-darker py-16 sm:py-24">
 <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
 <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
 <motion.div
 initial={{ opacity: 0, x: -30 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 >
 <img
 src={processAdvantagesImage}
 alt="Detailing Advantages"
 className="rounded-3xl border border-white/10 shadow-2xl"
 referrerPolicy="no-referrer"
 />
 </motion.div>

 <motion.div
 initial={{ opacity: 0, x: 30 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 className="space-y-8"
 >
 <div>
 <h2 className="text-3xl md:text-4xl font-bold font-display mb-6">{t('process.advantages.title')}</h2>
 <p className="text-gray-400 text-lg">
 {t('process.advantages.desc')}
 </p>
 </div>

 <ul className="space-y-6">
 {[
 { title: t('process.adv.1.title'), desc: t('process.adv.1.desc') },
 { title: t('process.adv.2.title'), desc: t('process.adv.2.desc') },
 { title: t('process.adv.3.title'), desc: t('process.adv.3.desc') },
 { title: t('process.adv.4.title'), desc: t('process.adv.4.desc') },
 ].map((adv, idx) => (
 <li key={idx} className="flex gap-4">
 <div className="mt-1">
 <CheckCircle2 className="w-6 h-6 text-primary" />
 </div>
 <div>
 <h4 className="text-lg font-bold text-white mb-1">{adv.title}</h4>
 <p className="text-gray-400">{adv.desc}</p>
 </div>
 </li>
 ))}
 </ul>
 </motion.div>
 </div>
 </div>
 </section>

 {/* Extra Services: Importation & Supply */}
 <section className="relative flex min-h-screen min-h-[100svh] items-center overflow-hidden bg-dark py-16 sm:py-24">
 <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

 <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
 <div className="text-center max-w-3xl mx-auto mb-16">
 <h2 className="text-3xl md:text-4xl font-bold font-display mb-6">{t('process.extra.title')}</h2>
 <p className="text-xl text-gray-400">
 {t('process.extra.desc')}
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 className="bg-gradient-to-b from-darker to-dark border border-white/10 rounded-3xl p-8 hover:border-primary/30 transition-all group"
 >
 <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
 <Wrench className="w-7 h-7 text-white group-hover:text-primary transition-colors" />
 </div>
 <h3 className="text-2xl font-bold font-display mb-4">{t('process.import.parts.title')}</h3>
 <p className="text-gray-400 mb-6">
 {t('process.import.parts.desc')}
 </p>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: 0.1 }}
 className="bg-gradient-to-b from-darker to-dark border border-white/10 rounded-3xl p-8 hover:border-primary/30 transition-all group"
 >
 <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
 <Package className="w-7 h-7 text-white group-hover:text-primary transition-colors" />
 </div>
 <h3 className="text-2xl font-bold font-display mb-4">{t('process.import.products.title')}</h3>
 <p className="text-gray-400 mb-6">
 {t('process.import.products.desc')}
 </p>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: 0.2 }}
 className="bg-gradient-to-b from-darker to-dark border border-white/10 rounded-3xl p-8 hover:border-primary/30 transition-all group"
 >
 <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
 <CarFront className="w-7 h-7 text-white group-hover:text-primary transition-colors" />
 </div>
 <h3 className="text-2xl font-bold font-display mb-4">{t('process.import.cars.title')}</h3>
 <p className="text-gray-400 mb-6">
 {t('process.import.cars.desc')}
 </p>
 </motion.div>
 </div>

 <div className="mt-16 text-center">
 <Link
 to="/contactos"
 className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-[0_0_20px_rgba(0,71,255,0.3)]"
 >
 {t('process.extra.cta')}
 <ArrowRight className="w-5 h-5" />
 </Link>
 </div>
 </div>
 </section>
 </div>
 );
}
