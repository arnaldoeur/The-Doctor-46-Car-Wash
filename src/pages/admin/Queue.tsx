import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Car,
  CheckCircle2,
  Clock,
  Loader2,
  Play,
  RefreshCw,
  User,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchAgendaAppointments,
  updateAppointmentStatus,
} from '../../lib/adminData';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../providers/LanguageProvider';

type QueueAppointment = Awaited<ReturnType<typeof fetchAgendaAppointments>>[number];
type QueueColumn = 'waiting' | 'in_progress' | 'ready';

const columnConfig: Record<QueueColumn, {
  labelKey: string;
  helperKey: string;
  icon: typeof Clock;
  dbStatuses: QueueAppointment['status'][];
}> = {
  waiting: {
    labelKey: 'admin.queue.waiting_label',
    helperKey: 'admin.queue.waiting_helper',
    icon: Clock,
    dbStatuses: ['pending'],
  },
  in_progress: {
    labelKey: 'admin.queue.in_progress_label',
    helperKey: 'admin.queue.in_progress_helper',
    icon: Play,
    dbStatuses: ['confirmed'],
  },
  ready: {
    labelKey: 'admin.queue.ready_label',
    helperKey: 'admin.queue.ready_helper',
    icon: CheckCircle2,
    dbStatuses: ['completed'],
  },
};

const statusToColumn = (status: QueueAppointment['status']): QueueColumn | null => {
  if (status === 'pending') return 'waiting';
  if (status === 'confirmed') return 'in_progress';
  if (status === 'completed') return 'ready';
  return null;
};

export default function Queue() {
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState<QueueAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [message, setMessage] = useState('');

  const loadQueue = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const nextAppointments = await fetchAgendaAppointments();
      setAppointments(nextAppointments);
    } catch (error) {
      console.error('Failed to load queue appointments', error);
      setErrorMessage(t('admin.queue.error_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQueue();
  }, []);

  const queueItems = useMemo(() => {
    return appointments
      .map((appointment) => ({
        ...appointment,
        column: statusToColumn(appointment.status),
        vehicle: `${appointment.vehicle_make} ${appointment.vehicle_model} (${appointment.vehicle_plate})`,
        ticket: appointment.id.slice(0, 8).toUpperCase(),
      }))
      .filter((appointment) => appointment.column !== null)
      .sort((left, right) => {
        const dateSort = left.appointment_date.localeCompare(right.appointment_date);
        if (dateSort !== 0) return dateSort;
        return left.appointment_time.localeCompare(right.appointment_time);
      });
  }, [appointments]);

  const setStatus = async (appointmentId: string, status: QueueAppointment['status']) => {
    try {
      setSavingId(appointmentId);
      setMessage('');
      setErrorMessage('');
      await updateAppointmentStatus(appointmentId, status);
      await loadQueue();
      setMessage(t('admin.queue.success_update'));
    } catch (error) {
      console.error('Failed to update queue status', error);
      setErrorMessage(
        error instanceof Error ? error.message : t('admin.queue.error_update')
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold font-display">{t('admin.queue.title')}</h1>
          <p className="text-gray-400">
            {t('admin.queue.sub')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadQueue()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 font-semibold text-white transition-all hover:bg-white/10"
        >
          <RefreshCw className="h-5 w-5" />
          {t('admin.queue.refresh')}
        </button>
      </div>

      {message ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-[420px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {(['waiting', 'in_progress', 'ready'] as QueueColumn[]).map((column) => {
            const config = columnConfig[column];
            const items = queueItems.filter((item) => item.column === column);
            const Icon = config.icon;

            return (
              <section
                key={column}
                className="flex h-[calc(100vh-16rem)] min-h-[520px] flex-col rounded-3xl border border-white/10 bg-dark p-6"
              >
                <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold font-display">{t(config.labelKey)}</h2>
                      <p className="text-xs text-gray-500">{t(config.helperKey)}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white">
                    {items.length}
                  </span>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        className="rounded-2xl border border-white/10 bg-darker p-5"
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 font-mono text-xs font-bold text-primary">
                              {item.ticket}
                            </span>
                            <div className="mt-2 text-xs text-gray-500">
                              {item.appointment_date} as {item.appointment_time}
                            </div>
                          </div>
                          {item.status === 'pending' ? (
                            <AlertCircle className="h-5 w-5 text-amber-400" />
                          ) : null}
                        </div>

                        <h3 className="mb-2 text-lg font-bold text-white">{item.service_name}</h3>
                        <div className="space-y-2 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            {item.contact_name}
                          </div>
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-gray-500" />
                            {item.vehicle}
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/5 pt-4">
                          {column === 'waiting' ? (
                            <button
                              type="button"
                              disabled={savingId === item.id}
                              onClick={() => void setStatus(item.id, 'confirmed')}
                              className="rounded-lg border border-blue-500/30 bg-blue-500/20 p-2 text-blue-300 transition-colors hover:bg-blue-500/30 disabled:opacity-60"
                              title={t('admin.queue.btn_start')}
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          ) : null}
                          {column === 'in_progress' ? (
                            <button
                              type="button"
                              disabled={savingId === item.id}
                              onClick={() => void setStatus(item.id, 'completed')}
                              className="rounded-lg border border-emerald-500/30 bg-emerald-500/20 p-2 text-emerald-300 transition-colors hover:bg-emerald-500/30 disabled:opacity-60"
                              title={t('admin.queue.btn_complete')}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            disabled={savingId === item.id}
                            onClick={() => void setStatus(item.id, 'cancelled')}
                            className={cn(
                              'rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-60',
                              column === 'ready' && 'ml-auto'
                            )}
                            title={t('admin.queue.btn_remove')}
                          >
                            <X className="h-4 w-4" />
                          </button>
                          {savingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : null}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {items.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-gray-500">
                      {t('admin.queue.empty')}
                    </div>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
