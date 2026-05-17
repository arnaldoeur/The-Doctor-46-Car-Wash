import { motion } from 'framer-motion';
import { Target, Zap, Award, Settings, Flag, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import aboutHeroImage from '../../assets/about-hero-carwash.png';
import aboutDetailImage from '../../assets/about-detail-carwash.png';
import { useLanguage } from '../../providers/LanguageProvider';

export default function About() {
 const { t } = useLanguage();

 return (
 <div className="flex flex-col bg-darker min-h-screen">
 {/* Hero Section */}
 <section className="relative py-24 flex items-center justify-center overflow-hidden border-b border-white/10">
 <div className="absolute inset-0 z-0">
 <img
 src={aboutHeroImage}
 alt="Performance Cars"
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
 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold text-sm mb-8">
 <Flag className="w-4 h-4" />
 {t('about.hero.tag')}
 </div>
 <h1 className="text-5xl md:text-7xl font-bold font-display leading-tight mb-6">
 {t('about.hero.title')}
 </h1>
 <p className="text-xl text-gray-400 leading-relaxed">
 {t('about.hero.desc')}
 </p>
 </motion.div>
 </div>
 </section>

 {/* The Inspiration Section */}
 <section className="relative flex min-h-screen min-h-[100svh] items-center bg-dark py-16 sm:py-24">
 <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
 <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
 <motion.div
 initial={{ opacity: 0, x: -30 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 className="space-y-6"
 >
 <h2 className="text-3xl md:text-4xl font-bold font-display">{t('about.inspiration.title')}</h2>
 <p className="text-gray-400 text-lg leading-relaxed">
 {t('about.inspiration.p1')}
 </p>
 <p className="text-gray-400 text-lg leading-relaxed">
 {t('about.inspiration.p2')}
 </p>
 </motion.div>
 <motion.div
 initial={{ opacity: 0, scale: 0.9 }}
 whileInView={{ opacity: 1, scale: 1 }}
 viewport={{ once: true }}
 className="relative"
 >
 <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-3xl transform translate-x-4 translate-y-4" />
 <img
 src={aboutDetailImage}
 alt="Detailing"
 className="relative rounded-3xl border border-white/10 shadow-2xl"
 referrerPolicy="no-referrer"
 />
 </motion.div>
 </div>
 </div>
 </section>

 {/* Why Doctor Section */}
 <section className="relative flex min-h-screen min-h-[100svh] items-center overflow-hidden bg-darker py-16 sm:py-24">
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

 <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
 <div className="text-center max-w-3xl mx-auto mb-16">
 <h2 className="text-4xl font-bold font-display mb-6">{t('about.why.title')}</h2>
 <p className="text-xl text-gray-400">
 {t('about.why.desc')}
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
 {[
 { title: t('about.steps.diagnosis.title'), desc: t('about.steps.diagnosis.desc'), icon: Target },
 { title: t('about.steps.treatment.title'), desc: t('about.steps.treatment.desc'), icon: Settings },
 { title: t('about.steps.attention.title'), desc: t('about.steps.attention.desc'), icon: Zap },
 { title: t('about.steps.result.title'), desc: t('about.steps.result.desc'), icon: Award },
 ].map((step, idx) => (
 <motion.div
 key={idx}
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: idx * 0.1 }}
 className="bg-dark border border-white/10 rounded-3xl p-8 text-center hover:border-primary/30 transition-colors"
 >
 <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
 <step.icon className="w-8 h-8 text-primary" />
 </div>
 <h3 className="text-xl font-bold font-display mb-3">{step.title}</h3>
 <p className="text-gray-400">{step.desc}</p>
 </motion.div>
 ))}
 </div>

 <div className="mt-16 text-center">
 <p className="text-2xl font-display font-bold text-white italic">
 {t('about.quote')}
 </p>
 </div>
 </div>
 </section>

 {/* Number 46 & Mission */}
 <section className="relative flex min-h-screen min-h-[100svh] items-center bg-dark py-16 sm:py-24">
 <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
 <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
 {/* Number 46 */}
 <motion.div
 initial={{ opacity: 0, x: -20 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 className="bg-gradient-to-br from-primary/20 to-darker border border-primary/30 rounded-3xl p-10 md:p-12 relative overflow-hidden"
 >
 <div className="absolute -right-10 -bottom-10 text-[200px] font-display font-black text-white/5 leading-none pointer-events-none">
 46
 </div>
 <h2 className="text-3xl font-bold font-display mb-6 relative z-10">{t('about.meaning.title')}</h2>
 <p className="text-gray-300 mb-8 relative z-10">
 {t('about.meaning.desc')}
 </p>
 <ul className="space-y-4 relative z-10">
 {[
 t('about.meaning.list.1'),
 t('about.meaning.list.2'),
 t('about.meaning.list.3'),
 t('about.meaning.list.4')
 ].map((item, idx) => (
 <li key={idx} className="flex items-center gap-3 text-lg font-medium text-white">
 <CheckCircle2 className="w-6 h-6 text-primary" />
 {item}
 </li>
 ))}
 </ul>
 <p className="mt-8 text-primary font-semibold relative z-10">
 {t('about.meaning.footer')}
 </p>
 </motion.div>

 {/* Mission */}
 <motion.div
 initial={{ opacity: 0, x: 20 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 className="flex flex-col justify-center"
 >
 <h2 className="text-4xl font-bold font-display mb-6">{t('about.mission.title')}</h2>
 <p className="text-xl text-gray-400 mb-8">
 {t('about.mission.desc')}
 </p>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
 {[
 t('about.mission.list.1'),
 t('about.mission.list.2'),
 t('about.mission.list.3'),
 t('about.mission.list.4'),
 t('about.mission.list.5')
 ].map((item, idx) => (
 <div key={idx} className="flex items-center gap-3 bg-darker border border-white/10 rounded-xl p-4">
 <div className="w-2 h-2 rounded-full bg-primary" />
 <span className="font-medium text-gray-200">{item}</span>
 </div>
 ))}
 </div>
 <p className="text-2xl font-display font-bold text-white mb-8">
 {t('about.mission.footer')}
 </p>
 <div>
 <Link
 to="/booking"
 className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-[0_0_20px_rgba(0,71,255,0.3)]"
 >
 {t('about.mission.cta')}
 <ArrowRight className="w-5 h-5" />
 </Link>
 </div>
 </motion.div>
 </div>
 </div>
 </section>
 </div>
 );
}
