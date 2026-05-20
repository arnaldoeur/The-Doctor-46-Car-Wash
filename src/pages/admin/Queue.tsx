import React, { useEffect, useMemo, useState } from 'react';
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
  Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchAgendaAppointments,
  updateAppointmentStatus,
  createQueueAppointment,
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
  color: string;
  bg: string;
  border: string;
}> = {
  waiting: {
    labelKey: 'admin.queue.waiting_label',
    helperKey: 'admin.queue.waiting_helper',
    icon: Clock,
    dbStatuses: ['pending'],
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  in_progress: {
    labelKey: 'admin.queue.in_progress_label',
    helperKey: 'admin.queue.in_progress_helper',
    icon: Play,
    dbStatuses: ['confirmed'],
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  ready: {
    labelKey: 'admin.queue.ready_label',
    helperKey: 'admin.queue.ready_helper',
    icon: CheckCircle2,
    dbStatuses: ['completed'],
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
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

  // Add Vehicle Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [newContact, setNewContact] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newMake, setNewMake] = useState('Toyota');
  const [newModel, setNewModel] = useState('Hilux');
  const [newService, setNewService] = useState('Lavagem Completa VIP');
  const [newPrice, setNewPrice] = useState('850.00');

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

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact || !newPlate) {
      setErrorMessage('Por favor, preencha o nome do cliente e a matrícula.');
      return;
    }
    setAddingVehicle(true);
    setErrorMessage('');
    setMessage('');
    try {
      await createQueueAppointment({
        contact_name: newContact,
        vehicle_plate: newPlate,
        vehicle_make: newMake,
        vehicle_model: newModel,
        service_name: newService,
        price_text: newPrice,
      });
      await loadQueue();
      setIsAddOpen(false);
      setNewContact('');
      setNewPlate('');
      setMessage('Veículo adicionado com sucesso à fila de espera!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error('Failed to create vehicle in queue', err);
      setErrorMessage('Erro ao adicionar veículo à fila de espera.');
    } finally {
      setAddingVehicle(false);
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
    } catch (error) {
      console.error('Failed to update queue status', error);
      setErrorMessage(error instanceof Error ? error.message : t('admin.queue.error_update'));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold font-display tracking-tight text-white">{t('admin.queue.title')}</h1>
          <p className="text-sm text-gray-400">
            {t('admin.queue.sub')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void loadQueue()}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-[#141414] px-4 text-sm font-semibold text-white transition-all hover:bg-[#1C1C1C] hover:border-white/20 shadow-sm"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            {t('admin.queue.refresh')}
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition-all hover:bg-primary-hover shadow-[0_0_15px_rgba(0,71,255,0.4)] hover:shadow-[0_0_25px_rgba(0,71,255,0.6)] active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200 flex items-center gap-3 shadow-lg">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            {message}
          </motion.div>
        )}
        {errorMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200 flex items-center gap-3 shadow-lg">
            <AlertCircle className="h-5 w-5 text-rose-400" />
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {loading && queueItems.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-16 h-16 border-t-2 border-primary border-solid rounded-full animate-spin"></div>
            <Loader2 className="h-6 w-6 animate-spin text-white z-10" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
          {(['waiting', 'in_progress', 'ready'] as QueueColumn[]).map((column) => {
            const config = columnConfig[column];
            const items = queueItems.filter((item) => item.column === column);
            const Icon = config.icon;

            return (
              <section
                key={column}
                className="flex flex-col rounded-[2rem] border border-white/[0.04] bg-[#0F0F0F] p-5 lg:h-[calc(100vh-16rem)] lg:min-h-[600px] shadow-2xl relative overflow-hidden"
              >
                {/* Subtle column background gradient based on state */}
                <div className={cn("absolute top-0 inset-x-0 h-32 opacity-20 bg-gradient-to-b from-current to-transparent pointer-events-none", config.color)} />

                <div className="mb-5 flex items-center justify-between border-b border-white/[0.04] pb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl border shadow-inner", config.bg, config.border)}>
                      <Icon className={cn("h-5 w-5", config.color)} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold font-display text-white tracking-wide">{t(config.labelKey)}</h2>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5">{t(config.helperKey)}</p>
                    </div>
                  </div>
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white/[0.05] px-2 text-xs font-bold text-gray-300 border border-white/10">
                    {items.length}
                  </span>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2 relative z-10 pb-4">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="group rounded-2xl border border-white/[0.05] bg-[#141414] p-5 shadow-lg hover:border-white/20 transition-all hover:bg-white/[0.02]"
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div>
                            <span className={cn("rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest", config.bg, config.border, config.color)}>
                              #{item.ticket}
                            </span>
                            <div className="mt-2 text-[11px] font-medium text-gray-500 flex items-center gap-1.5">
                              <Clock className="h-3 w-3" />
                              {item.appointment_date} at {item.appointment_time}
                            </div>
                          </div>
                          {item.status === 'pending' && <AlertCircle className="h-4 w-4 text-amber-500/50" />}
                        </div>

                        <h3 className="mb-3 text-base font-bold text-white/90 leading-tight">{item.service_name}</h3>
                        
                        <div className="space-y-2 text-xs text-gray-400 font-medium">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-gray-500" />
                            {item.contact_name}
                          </div>
                          <div className="flex items-center gap-2">
                            <Car className="h-3.5 w-3.5 text-gray-500" />
                            {item.vehicle}
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-2 pt-4">
                          {column === 'waiting' && (
                            <button
                              disabled={savingId === item.id}
                              onClick={() => setStatus(item.id, 'confirmed')}
                              className="flex-1 rounded-xl border border-blue-500/30 bg-blue-500/10 py-2 text-blue-400 hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 font-bold text-xs"
                            >
                              {savingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                              Start Wash
                            </button>
                          )}
                          
                          {column === 'in_progress' && (
                            <button
                              disabled={savingId === item.id}
                              onClick={() => setStatus(item.id, 'completed')}
                              className="flex-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                            >
                              {savingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                              Complete
                            </button>
                          )}

                          <button
                            disabled={savingId === item.id}
                            onClick={() => setStatus(item.id, 'cancelled')}
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#0A0A0A] text-gray-500 transition-colors hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50 shrink-0',
                              column === 'ready' && 'flex-1 h-auto py-2 flex-row gap-2'
                            )}
                            title="Remove/Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                            {column === 'ready' && <span className="text-xs font-bold">Remove from Queue</span>}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {items.length === 0 && (
                    <div className="flex h-full items-center justify-center p-6 text-center">
                      <div className="rounded-3xl border border-dashed border-white/10 p-8 w-full">
                        <Icon className="h-8 w-8 text-white/10 mx-auto mb-3" />
                        <p className="text-xs text-gray-500 font-medium">No vehicles {column.replace('_', ' ')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Add Vehicle Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/[0.05] bg-[#0A0A0A] p-8 shadow-2xl my-8"
            >
              <button
                onClick={() => setIsAddOpen(false)}
                className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-8">
                <h3 className="text-2xl font-bold font-display text-white tracking-tight mb-2">
                  Add to Queue
                </h3>
                <p className="text-sm text-gray-500">
                  Quickly insert a vehicle into the waiting queue.
                </p>
              </div>

              <form onSubmit={handleCreateVehicle} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">Client / Driver Name</label>
                  <input
                    type="text" required value={newContact} onChange={(e) => setNewContact(e.target.value)}
                    placeholder="E.g. João Silva"
                    className="w-full rounded-xl border border-white/[0.05] bg-[#141414] py-3 px-4 text-sm text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">Plate Number</label>
                    <input
                      type="text" required value={newPlate} onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                      placeholder="MMX-9281"
                      className="w-full rounded-xl border border-white/[0.05] bg-[#141414] py-3 px-4 text-sm font-bold uppercase tracking-widest text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 font-mono transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">Make</label>
                    <input
                      type="text" value={newMake} onChange={(e) => setNewMake(e.target.value)}
                      placeholder="Toyota"
                      className="w-full rounded-xl border border-white/[0.05] bg-[#141414] py-3 px-4 text-sm text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">Model</label>
                    <input
                      type="text" value={newModel} onChange={(e) => setNewModel(e.target.value)}
                      placeholder="Hilux"
                      className="w-full rounded-xl border border-white/[0.05] bg-[#141414] py-3 px-4 text-sm text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">Price (MT)</label>
                    <input
                      type="text" value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.05] bg-[#141414] py-3 px-4 text-sm font-bold text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 font-mono transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">Service</label>
                  <select
                    value={newService}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewService(val);
                      if (val.includes('Simples')) setNewPrice('500.00');
                      else if (val.includes('Completa')) setNewPrice('850.00');
                      else if (val.includes('VIP')) setNewPrice('1500.00');
                      else if (val.includes('Motor')) setNewPrice('1200.00');
                    }}
                    className="w-full rounded-xl border border-white/[0.05] bg-[#141414] py-3 px-4 text-sm text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all appearance-none"
                  >
                    <option value="Lavagem Simples">Lavagem Simples (500 MT)</option>
                    <option value="Lavagem Completa VIP">Lavagem Completa VIP (850 MT)</option>
                    <option value="Higienização Interna Profunda">Higienização Interna Profunda (2500 MT)</option>
                    <option value="Enceramento Premium Carnaúba">Enceramento Premium Carnaúba (1500 MT)</option>
                    <option value="Lavagem de Motor a Vapor">Lavagem de Motor a Vapor (1200 MT)</option>
                  </select>
                </div>

                <div className="mt-8 pt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="rounded-xl px-5 py-2.5 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingVehicle}
                    className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-hover shadow-lg disabled:opacity-50 transition-all active:scale-95"
                  >
                    {addingVehicle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    <span>Add to Queue</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
