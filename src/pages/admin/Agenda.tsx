import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  User,
  Car,
  Plus,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { fetchAgendaAppointments, updateAppointmentStatus, createQueueAppointment } from '../../lib/adminData';
import { useLanguage } from '../../providers/LanguageProvider';

type AgendaAppointment = Awaited<ReturnType<typeof fetchAgendaAppointments>>[number];

export default function Agenda() {
  const { t, language } = useLanguage();
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<AgendaAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  // New Appointment Modal States
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newClient, setNewClient] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newMake, setNewMake] = useState('Toyota');
  const [newModel, setNewModel] = useState('Hilux');
  const [newService, setNewService] = useState('Lavagem Completa Premium');
  const [newPrice, setNewPrice] = useState('850');
  const [creating, setCreating] = useState(false);

  const dateLocale = language === 'pt' ? ptBR : enUS;

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const nextAppointments = await fetchAgendaAppointments();
        if (active) {
          setAppointments(nextAppointments);
        }
      } catch (error) {
        console.error('Failed to load agenda appointments', error);
        if (active) {
          setErrorMessage(t('admin.agenda.error_load'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [t]);

  const normalizedAppointments = useMemo(() => {
    return appointments.map((appointment) => ({
      ...appointment,
      dateObject: new Date(`${appointment.appointment_date}T00:00:00`),
      client: appointment.customer_name,
      vehicle: `${appointment.vehicle_make} ${appointment.vehicle_model} (${appointment.vehicle_plate})`,
      service: appointment.service_name,
      time: appointment.appointment_time,
      status_raw: appointment.status as 'pending' | 'confirmed' | 'completed' | 'cancelled',
      status_text:
        appointment.status === 'completed'
          ? t('admin.agenda.status_completed')
          : appointment.status === 'confirmed'
          ? t('admin.agenda.status_confirmed')
          : appointment.status === 'pending'
          ? t('admin.agenda.status_pending')
          : t('admin.agenda.status_cancelled'),
    }));
  }, [appointments, t]);

  const handleStatusChange = async (id: string, newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
    setStatusUpdating(id);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await updateAppointmentStatus(id, newStatus);
      const nextAppointments = await fetchAgendaAppointments();
      setAppointments(nextAppointments);
      setSuccessMessage(`Agendamento atualizado para: ${newStatus.toUpperCase()}`);
    } catch (err) {
      console.error('Failed to update status', err);
      setErrorMessage('Erro ao atualizar status do agendamento.');
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient || !newPlate) {
      setErrorMessage('Preencha o nome do cliente e a matrícula.');
      return;
    }
    setCreating(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await createQueueAppointment({
        contact_name: newClient,
        vehicle_plate: newPlate.toUpperCase(),
        vehicle_make: newMake,
        vehicle_model: newModel,
        service_name: newService,
        price_text: newPrice,
      });
      const nextAppointments = await fetchAgendaAppointments();
      setAppointments(nextAppointments);
      setIsNewOpen(false);
      setNewClient('');
      setNewPlate('');
      setSuccessMessage('Agendamento criado e sincronizado com sucesso!');
    } catch (err) {
      console.error('Failed to create appointment', err);
      setErrorMessage('Erro ao criar novo agendamento.');
    } finally {
      setCreating(false);
    }
  };

  const handlePrev = () => {
    if (view === 'day') setCurrentDate(subDays(currentDate, 1));
    if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (view === 'day') setCurrentDate(addDays(currentDate, 1));
    if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
  };

  const getHeaderTitle = () => {
    if (view === 'day') return format(currentDate, language === 'pt' ? "d 'de' MMMM, yyyy" : "MMMM d, yyyy", { locale: dateLocale });
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      if (isSameMonth(start, end)) {
        return `${format(start, 'd')} - ${format(end, language === 'pt' ? "d 'de' MMMM, yyyy" : "MMMM d, yyyy", { locale: dateLocale })}`;
      }
      return `${format(start, language === 'pt' ? "d 'de' MMMM" : "MMMM d", { locale: dateLocale })} - ${format(end, language === 'pt' ? "d 'de' MMMM, yyyy" : "MMMM d, yyyy", { locale: dateLocale })}`;
    }
    return format(currentDate, 'MMMM yyyy', { locale: dateLocale });
  };

  const renderDayView = () => {
    const dayAppointments = normalizedAppointments
      .filter((appointment) => isSameDay(appointment.dateObject, currentDate))
      .sort((left, right) => left.time.localeCompare(right.time));

    return (
      <div className="space-y-4">
        {dayAppointments.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            {t('admin.agenda.empty_day')}
          </div>
        ) : (
          dayAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 transition-colors hover:border-white/10 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-primary/20 text-primary">
                  <span className="text-xs font-bold uppercase">
                    {format(appointment.dateObject, 'eee', { locale: dateLocale }).substring(0, 3)}
                  </span>
                  <span className="text-sm font-bold">{appointment.time.split(':')[0]}</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">{appointment.service}</h4>
                  <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {appointment.client}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Car className="h-4 w-4 text-primary" />
                      {appointment.vehicle}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="hidden text-right md:block">
                  <div className="inline-flex items-center gap-1 font-medium text-gray-300">
                    <Clock className="h-4 w-4 text-primary" />
                    {appointment.time}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    appointment.status_raw === 'completed'
                      ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                      : appointment.status_raw === 'confirmed'
                      ? 'border border-primary/20 bg-primary/10 text-primary'
                      : appointment.status_raw === 'pending'
                      ? 'border border-amber-500/20 bg-amber-500/10 text-amber-300'
                      : 'border border-red-500/20 bg-red-500/10 text-red-400'
                  }`}>
                    {appointment.status_text}
                  </span>

                  <select
                    value={appointment.status_raw}
                    disabled={statusUpdating === appointment.id}
                    onChange={(e) => handleStatusChange(appointment.id, e.target.value as any)}
                    className="rounded-xl border border-white/10 bg-darker px-3 py-1.5 text-xs font-semibold text-gray-300 focus:border-primary focus:outline-none cursor-pointer hover:border-white/20"
                  >
                    <option value="pending">Pendente (Fila)</option>
                    <option value="confirmed">Confirmar</option>
                    <option value="completed">Concluir (Gera Receita)</option>
                    <option value="cancelled">Cancelar</option>
                  </select>
                  {statusUpdating === appointment.id ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-7">
        {days.map((day) => {
          const dayAppointments = normalizedAppointments
            .filter((appointment) => isSameDay(appointment.dateObject, day))
            .sort((left, right) => left.time.localeCompare(right.time));
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[320px] rounded-2xl border p-4 ${
                isToday ? 'border-primary/50 bg-primary/5' : 'border-white/5 bg-dark'
              }`}
            >
              <div className="mb-4 border-b border-white/10 pb-4 text-center">
                <div className="text-sm font-medium uppercase text-gray-400">
                  {format(day, 'EEE', { locale: dateLocale })}
                </div>
                <div className={`mt-1 text-2xl font-bold font-display ${isToday ? 'text-primary' : 'text-white'}`}>
                  {format(day, 'd')}
                </div>
              </div>
              <div className="space-y-3">
                {dayAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-xl border border-white/5 bg-white/5 p-3 text-sm space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-primary">
                      <span>{appointment.time}</span>
                      <select
                        value={appointment.status_raw}
                        disabled={statusUpdating === appointment.id}
                        onChange={(e) => handleStatusChange(appointment.id, e.target.value as any)}
                        className="bg-transparent text-xs text-gray-400 focus:outline-none cursor-pointer"
                      >
                        <option value="pending">Pendente</option>
                        <option value="confirmed">Confirmar</option>
                        <option value="completed">Concluir</option>
                        <option value="cancelled">Cancelar</option>
                      </select>
                    </div>
                    <div className="truncate font-medium text-white">{appointment.client}</div>
                    <div className="truncate text-xs text-gray-400">{appointment.service}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    const weekdayLabels = language === 'pt'
      ? ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/10">
        <div className="grid grid-cols-7 gap-px">
          {weekdayLabels.map((day) => (
            <div key={day} className="bg-darker p-3 text-center text-sm font-medium text-gray-400">
              {day}
            </div>
          ))}
          {days.map((day) => {
            const dayAppointments = normalizedAppointments.filter((appointment) =>
              isSameDay(appointment.dateObject, day)
            );
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());

            return (
              <div key={day.toISOString()} className={`min-h-[120px] bg-dark p-2 ${!isCurrentMonth ? 'opacity-50' : ''}`}>
                <div className={`mb-2 text-right text-sm font-medium ${isToday ? 'text-primary' : 'text-gray-400'}`}>
                  <span className={isToday ? 'rounded-full bg-primary/20 px-2 py-1' : ''}>{format(day, 'd')}</span>
                </div>
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map((appointment) => (
                    <div
                      key={appointment.id}
                      className="truncate rounded bg-white/5 px-2 py-1 text-xs text-gray-300"
                    >
                      <span className="mr-1 text-primary">{appointment.time}</span>
                      {appointment.client}
                    </div>
                  ))}
                  {dayAppointments.length > 3 ? (
                    <div className="mt-1 text-center text-xs text-gray-500">
                      +{dayAppointments.length - 3} {t('admin.agenda.more_label')}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold font-display">{t('admin.agenda.title')}</h1>
          <p className="text-gray-400">
            {t('admin.agenda.sub')}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-gray-300 font-medium">
            {normalizedAppointments.length} {t('admin.agenda.loaded_count')}
          </div>
          <button
            type="button"
            onClick={() => setIsNewOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-bold font-display text-white hover:bg-primary-hover shadow-lg transition-all"
          >
            <Plus className="h-5 w-5" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-dark">
        <div className="flex flex-col gap-4 border-b border-white/10 bg-darker p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold font-display capitalize">{getHeaderTitle()}</h2>
              <p className="text-sm text-gray-400">{t('admin.agenda.source_info')}</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/5 p-1">
              <button type="button" onClick={handlePrev} className="rounded-md p-1 transition-colors hover:bg-white/10">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentDate(new Date())}
                className="px-2 text-sm font-medium transition-colors hover:text-primary"
              >
                {t('admin.agenda.today')}
              </button>
              <button type="button" onClick={handleNext} className="rounded-md p-1 transition-colors hover:bg-white/10">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 rounded-xl bg-white/5 p-1">
            {(['day', 'week', 'month'] as const).map((nextView) => (
              <button
                key={nextView}
                type="button"
                onClick={() => setView(nextView)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  view === nextView ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {nextView === 'day' ? t('admin.agenda.view_day') : nextView === 'week' ? t('admin.agenda.view_week') : t('admin.agenda.view_month')}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : view === 'day' ? (
            renderDayView()
          ) : view === 'week' ? (
            renderWeekView()
          ) : (
            renderMonthView()
          )}
        </div>
      </div>

      {/* Modal de Novo Agendamento */}
      {isNewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-darker p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsNewOpen(false)}
              className="absolute right-6 top-6 text-gray-400 transition-colors hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-display text-white">Agendar Novo Serviço</h2>
                <p className="text-xs text-gray-400">Insira na Fila de Espera e Agenda simultaneamente</p>
              </div>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">
                  Nome do Cliente <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  placeholder="Ex: Arnaldo Cangi"
                  className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">Marca</label>
                  <input
                    type="text"
                    value={newMake}
                    onChange={(e) => setNewMake(e.target.value)}
                    placeholder="Toyota"
                    className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">Modelo</label>
                  <input
                    type="text"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    placeholder="Hilux"
                    className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">Matrícula <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    required
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    placeholder="AFX-123-MC"
                    className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">Serviço</label>
                  <input
                    type="text"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">Preço (MT)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 font-bold text-primary focus:border-primary focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewOpen(false)}
                  className="flex-1 rounded-xl bg-white/5 px-4 py-3 font-medium text-white transition-colors hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-xl bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                  <span>Confirmar Agendamento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

