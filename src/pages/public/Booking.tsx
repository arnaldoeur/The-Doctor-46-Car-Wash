import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
 Calendar as CalendarIcon,
 Clock,
 Car,
 CheckCircle2,
 ChevronRight,
 ShieldCheck,
 User,
} from 'lucide-react';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { createAppointment, fetchBookingServices } from '../../lib/customerPortal';
import { useAuth } from '../../providers/AuthProvider';
import { useLanguage } from '../../providers/LanguageProvider';
import { getTranslatedCatalog } from '../../lib/i18n-services';
import type { ServiceItem } from '../../lib/serviceCatalog';

const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
const bookingDraftStorageKey = 'customer-booking-draft';

type VehicleInfo = {
 make: string;
 model: string;
 plate: string;
};

type PersonalInfo = {
 name: string;
 email: string;
 phone: string;
};

type BookingDraft = {
 step: number;
 selectedService: string;
 selectedDate: string | null;
 selectedTime: string;
 vehicleInfo: VehicleInfo;
 personalInfo: PersonalInfo;
};

const emptyVehicleInfo: VehicleInfo = { make: '', model: '', plate: '' };
const emptyPersonalInfo: PersonalInfo = { name: '', email: '', phone: '' };

function readDraft() {
 if (typeof window === 'undefined') {
 return null;
 }

 const rawDraft = window.sessionStorage.getItem(bookingDraftStorageKey);

 if (!rawDraft) {
 return null;
 }

 try {
 return JSON.parse(rawDraft) as BookingDraft;
 } catch {
 return null;
 }
}

export default function Booking() {
 const location = useLocation();
 const navigate = useNavigate();
 const [searchParams] = useSearchParams();
 const { user, profile, loading: authLoading, saveProfile } = useAuth();
 const { t, language } = useLanguage();
 const [catalog, setCatalog] = useState<ServiceItem[]>([]);
 const [catalogLoading, setCatalogLoading] = useState(true);

 useEffect(() => {
 let active = true;

 const loadCatalog = async () => {
 try {
 setCatalogLoading(true);
 const services = await fetchBookingServices();
 if (active) {
 setCatalog(services);
 }
 } catch (error) {
 console.error('Failed to load booking catalog from MySQL', error);
 if (active) {
 setCatalog([]);
 }
 } finally {
 if (active) {
 setCatalogLoading(false);
 }
 }
 };

 void loadCatalog();

 return () => {
 active = false;
 };
 }, []);

 const translatedCatalog = useMemo(() => getTranslatedCatalog(catalog, t), [catalog, t]);

 const requestedServiceId = searchParams.get('service') ?? '';
 const initialService = useMemo(
 () => translatedCatalog.find((service) => service.id === requestedServiceId)?.id ?? '',
 [requestedServiceId, translatedCatalog]
 );

 const [step, setStep] = useState(1);
 const [selectedService, setSelectedService] = useState(initialService);
 const [selectedDate, setSelectedDate] = useState<Date | null>(null);
 const [selectedTime, setSelectedTime] = useState('');
 const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>(emptyVehicleInfo);
 const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(emptyPersonalInfo);
 const [draftLoaded, setDraftLoaded] = useState(false);
 const [isSaving, setIsSaving] = useState(false);
 const [submissionError, setSubmissionError] = useState('');

 useEffect(() => {
 const draft = readDraft();

 if (draft) {
 setStep(Math.min(Math.max(draft.step, 1), 4));
 setSelectedService(draft.selectedService || initialService);
 setSelectedDate(draft.selectedDate ? new Date(draft.selectedDate) : null);
 setSelectedTime(draft.selectedTime);
 setVehicleInfo(draft.vehicleInfo ?? emptyVehicleInfo);
 setPersonalInfo(draft.personalInfo ?? emptyPersonalInfo);
 } else if (initialService) {
 setSelectedService(initialService);
 }

 setDraftLoaded(true);
 }, [initialService]);

 useEffect(() => {
 if (!draftLoaded || typeof window === 'undefined' || step === 4) {
 return;
 }

 const nextDraft: BookingDraft = {
 step,
 selectedService,
 selectedDate: selectedDate?.toISOString() ?? null,
 selectedTime,
 vehicleInfo,
 personalInfo,
 };

 window.sessionStorage.setItem(bookingDraftStorageKey, JSON.stringify(nextDraft));
 }, [draftLoaded, personalInfo, selectedDate, selectedService, selectedTime, step, vehicleInfo]);

 useEffect(() => {
 if (!profile && !user) {
 return;
 }

 setPersonalInfo((current) => ({
 name: current.name || profile?.full_name || '',
 email: current.email || profile?.email || user?.email || '',
 phone: current.phone || profile?.phone || '',
 }));
 }, [profile, user]);

 useEffect(() => {
 if (!draftLoaded || !initialService) {
 return;
 }

 setSelectedService(initialService);
 setStep(1);
 }, [draftLoaded, initialService]);

 const selectedServiceData =
 translatedCatalog.find((service) => service.id === selectedService) ?? null;
 const dates = Array.from({ length: 7 }, (_, index) => addDays(new Date(), index + 1));

 const handleNext = () => setStep((current) => Math.min(current + 1, 4));
 const handlePrev = () => setStep((current) => Math.max(current - 1, 1));

 const handleLoginRedirect = () => {
 navigate(`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`);
 };

 const handleBookingConfirmation = async () => {
 if (!selectedServiceData || !selectedDate) {
 return;
 }

 if (!user) {
 handleLoginRedirect();
 return;
 }

 setSubmissionError('');
 setIsSaving(true);

 try {
 await saveProfile({
 fullName: personalInfo.name,
 email: personalInfo.email,
 phone: personalInfo.phone,
 });

 await createAppointment({
 userId: user.id,
 service: selectedServiceData,
 selectedDate,
 selectedTime,
 vehicleInfo,
 personalInfo,
 });

 if (typeof window !== 'undefined') {
 window.sessionStorage.removeItem(bookingDraftStorageKey);
 }

 setStep(4);
 } catch (error) {
 console.error('Failed to create appointment', error);
 setSubmissionError(
 error instanceof Error
 ? error.message
 : 'Nao foi possivel gravar o agendamento no MySQL. Confirme a API e tente novamente.'
 );
 } finally {
 setIsSaving(false);
 }
 };

 return (
 <div className="min-h-screen bg-darker py-20">
 <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
 <div className="mb-10">
 <h1 className="mb-3 font-display text-4xl font-bold">Agendamento Online</h1>
 <p className="max-w-2xl text-gray-400">
 Escolha o servico, selecione o melhor horario e grave o agendamento diretamente no
 MySQL em poucos passos.
 </p>
 </div>

 {!authLoading && !user ? (
 <div className="mb-8 rounded-3xl border border-primary/20 bg-primary/10 p-6">
 <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
 <div>
 <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
 <ShieldCheck className="h-4 w-4" />
 Sessao recomendada
 </p>
 <h2 className="font-display text-2xl font-bold text-white">
 Entre antes de confirmar o agendamento
 </h2>
 <p className="mt-2 max-w-2xl text-sm text-gray-300">
 Assim o pedido fica ligado ao seu portal e aparece no dashboard com historico e
 fidelidade.
 </p>
 </div>
 <button
 type="button"
 onClick={handleLoginRedirect}
 className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-hover"
 >
 Entrar para agendar
 </button>
 </div>
 </div>
 ) : null}

 {selectedServiceData ? (
 <div className="mb-8 rounded-3xl border border-primary/20 bg-primary/8 p-6">
 <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
 <div>
 <p className="mb-1 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
 Servico selecionado
 </p>
 <h2 className="font-display text-2xl font-bold">{selectedServiceData.name}</h2>
 <p className="mt-2 max-w-2xl text-sm text-gray-300">
 {selectedServiceData.description}
 </p>
 </div>
 <div className="flex flex-col gap-1 text-sm text-gray-300 md:text-right">
 <span>
 <strong className="text-white">{selectedServiceData.price}</strong>
 </span>
 <span>{selectedServiceData.duration}</span>
 </div>
 </div>
 </div>
 ) : null}

 <div className="mb-12">
 <div className="relative flex items-center justify-between">
 <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-white/10" />
 <div
 className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary transition-all duration-500"
 style={{ width: `${((step - 1) / 3) * 100}%` }}
 />
 {[1, 2, 3, 4].map((currentStep) => (
 <div
 key={currentStep}
 className={cn(
 'relative z-10 flex h-10 w-10 items-center justify-center rounded-full font-bold transition-colors duration-300',
 step >= currentStep
 ? 'bg-primary text-white'
 : 'border-2 border-white/20 bg-dark text-gray-400'
 )}
 >
 {step > currentStep ? <CheckCircle2 className="h-6 w-6" /> : currentStep}
 </div>
 ))}
 </div>
 <div className="mt-4 flex justify-between text-sm font-medium text-gray-400">
 <span>{t('booking.steps.service')}</span>
 <span>{t('booking.steps.datetime')}</span>
 <span>{t('booking.steps.vehicle')}</span>
 <span>{t('booking.steps.confirmation')}</span>
 </div>
 </div>

 <div className="rounded-3xl border border-white/10 bg-dark p-8 shadow-2xl md:p-12">
 {catalogLoading ? (
 <div className="flex min-h-[320px] items-center justify-center text-gray-400">
 A carregar servicos reais...
 </div>
 ) : null}

 {step === 1 && !catalogLoading ? (
 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
 <h2 className="mb-8 font-display text-3xl font-bold">{t('booking.title.service')}</h2>
 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
 {translatedCatalog.map((service) => (
 <button
 key={service.id}
 type="button"
 onClick={() => setSelectedService(service.id)}
 className={cn(
 'rounded-2xl border p-6 text-left transition-all',
 selectedService === service.id
 ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(0,71,255,0.15)]'
 : 'border-white/10 bg-darker hover:border-white/30'
 )}
 >
 <div className="mb-2 flex items-start justify-between gap-4">
 <h3 className="font-display text-xl font-bold">{service.name}</h3>
 <span className="text-lg font-bold text-primary">{service.price}</span>
 </div>
 <p className="mb-3 text-sm text-gray-400">{service.description}</p>
 <div className="flex items-center gap-2 text-sm text-gray-400">
 <Clock className="h-4 w-4" />
 {service.duration}
 </div>
 </button>
 ))}
 </div>
 </motion.div>
 ) : null}

 {!catalogLoading && step === 2 ? (
 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
 <h2 className="mb-8 font-display text-3xl font-bold">{t('booking.title.datetime')}</h2>

 <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
 <CalendarIcon className="h-5 w-5 text-primary" /> {t('booking.available_days')}
 </h3>
 <div className="mb-8 flex snap-x gap-4 overflow-x-auto pb-4">
 {dates.map((date) => (
 <button
 key={date.toISOString()}
 type="button"
 onClick={() => setSelectedDate(date)}
 className={cn(
 'w-24 flex-shrink-0 snap-center rounded-2xl border p-4 text-center transition-all',
 selectedDate?.toDateString() === date.toDateString()
 ? 'border-primary bg-primary text-white'
 : 'border-white/10 bg-darker text-gray-400 hover:border-white/30'
 )}
 >
 <div className="mb-1 text-xs font-semibold uppercase">
 {format(date, 'EE', { locale: language === 'pt' ? ptBR : undefined })}
 </div>
 <div className="font-display text-2xl font-bold">{format(date, 'dd')}</div>
 <div className="text-xs">{format(date, 'MM', { locale: language === 'pt' ? ptBR : undefined })}</div>
 </button>
 ))}
 </div>

 {selectedDate ? (
 <>
 <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
 <Clock className="h-5 w-5 text-primary" /> {t('booking.available_times')}
 </h3>
 <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
 {timeSlots.map((time) => (
 <button
 key={time}
 type="button"
 onClick={() => setSelectedTime(time)}
 className={cn(
 'rounded-xl border py-3 text-center font-medium transition-all',
 selectedTime === time
 ? 'border-primary bg-primary text-white'
 : 'border-white/10 bg-darker text-gray-400 hover:border-white/30'
 )}
 >
 {time}
 </button>
 ))}
 </div>
 </>
 ) : null}
 </motion.div>
 ) : null}

 {!catalogLoading && step === 3 ? (
 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
 <h2 className="mb-8 font-display text-3xl font-bold">{t('booking.title.info')}</h2>

 <div className="space-y-8">
 <div>
 <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
 <Car className="h-5 w-5 text-primary" /> {t('booking.vehicle')}
 </h3>
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <input
 type="text"
 placeholder={t('booking.vehicle.make')}
 value={vehicleInfo.make}
 onChange={(event) =>
 setVehicleInfo({ ...vehicleInfo, make: event.target.value })
 }
 className="rounded-xl border border-white/10 bg-darker px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none"
 />
 <input
 type="text"
 placeholder={t('booking.vehicle.model')}
 value={vehicleInfo.model}
 onChange={(event) =>
 setVehicleInfo({ ...vehicleInfo, model: event.target.value })
 }
 className="rounded-xl border border-white/10 bg-darker px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none"
 />
 <input
 type="text"
 placeholder={t('booking.vehicle.plate')}
 value={vehicleInfo.plate}
 onChange={(event) =>
 setVehicleInfo({ ...vehicleInfo, plate: event.target.value })
 }
 className="rounded-xl border border-white/10 bg-darker px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none sm:col-span-2"
 />
 </div>
 </div>

 <div>
 <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
 <User className="h-5 w-5 text-primary" /> {t('booking.contact')}
 </h3>
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <input
 type="text"
 placeholder={t('booking.contact.name')}
 value={personalInfo.name}
 onChange={(event) =>
 setPersonalInfo({ ...personalInfo, name: event.target.value })
 }
 className="rounded-xl border border-white/10 bg-darker px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none sm:col-span-2"
 />
 <input
 type="email"
 placeholder={t('booking.contact.email')}
 value={personalInfo.email}
 onChange={(event) =>
 setPersonalInfo({ ...personalInfo, email: event.target.value })
 }
 className="rounded-xl border border-white/10 bg-darker px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none"
 />
 <input
 type="tel"
 placeholder={t('booking.contact.phone')}
 value={personalInfo.phone}
 onChange={(event) =>
 setPersonalInfo({ ...personalInfo, phone: event.target.value })
 }
 className="rounded-xl border border-white/10 bg-darker px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none"
 />
 </div>
 </div>
 </div>

 {submissionError ? (
 <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
 {submissionError}
 </div>
 ) : null}
 </motion.div>
 ) : null}

 {!catalogLoading && step === 4 ? (
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 className="text-center"
 >
 <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-primary/20">
 <CheckCircle2 className="h-12 w-12 text-primary" />
 </div>
 <h2 className="mb-4 font-display text-4xl font-bold">{t('booking.success.title')}</h2>
 <p className="mx-auto mb-8 max-w-md text-gray-400">
 {t('booking.success.desc').replace('{name}', personalInfo.name).replace('{service}', selectedServiceData?.name || '')}
 </p>

 <div className="mx-auto mb-8 max-w-sm rounded-2xl border border-white/10 bg-darker p-6 text-left">
 <div className="mb-4 flex justify-between border-b border-white/10 pb-4">
 <span className="text-gray-400">{t('booking.success.date')}</span>
 <span className="font-semibold">
 {selectedDate ? format(selectedDate, 'dd/MM/yy') : ''} as {selectedTime}
 </span>
 </div>
 <div className="mb-4 flex justify-between border-b border-white/10 pb-4">
 <span className="text-gray-400">{t('booking.vehicle')}</span>
 <span className="font-semibold">
 {vehicleInfo.make} {vehicleInfo.model}
 </span>
 </div>
 <div className="flex justify-between">
 <span className="text-gray-400">{t('booking.success.total')}</span>
 <span className="text-xl font-bold text-primary">
 {selectedServiceData?.price}
 </span>
 </div>
 </div>

 <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
 <Link
 to="/customer/dashboard"
 className="inline-flex rounded-full bg-primary px-8 py-4 font-semibold text-white transition-all hover:bg-primary-hover"
 >
 {t('booking.success.portal')}
 </Link>
 <Link
 to="/"
 className="inline-flex rounded-full border border-white/10 px-8 py-4 font-semibold text-white transition-all hover:bg-white/5"
 >
 {t('booking.success.back_home')}
 </Link>
 </div>
 </motion.div>
 ) : null}

 {!catalogLoading && step < 4 ? (
 <div className="mt-12 flex justify-between border-t border-white/10 pt-8">
 <button
 type="button"
 onClick={handlePrev}
 disabled={step === 1}
 className={cn(
 'rounded-xl px-6 py-3 font-semibold transition-all',
 step === 1
 ? 'pointer-events-none opacity-0'
 : 'bg-white/5 text-white hover:bg-white/10'
 )}
 >
 {t('booking.back')}
 </button>
 <button
 type="button"
 onClick={step === 3 ? handleBookingConfirmation : handleNext}
 disabled={
 (step === 1 && !selectedService) ||
 (step === 2 && (!selectedDate || !selectedTime)) ||
 (step === 3 &&
 (!vehicleInfo.make ||
 !vehicleInfo.model ||
 !vehicleInfo.plate ||
 !personalInfo.name ||
 !personalInfo.phone ||
 isSaving))
 }
 className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 font-semibold text-white transition-all hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary"
 >
 {step === 3
 ? user
 ? isSaving
 ? t('booking.saving')
 : t('booking.confirm')
 : t('booking.login_to_confirm')
 : t('booking.next')}
 {step < 3 ? <ChevronRight className="h-5 w-5" /> : null}
 </button>
 </div>
 ) : null}
 </div>
 </div>
 </div>
 );
}
