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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-white transition-all hover:bg-primary-hover shadow-lg font-display"
          >
            <Plus className="h-5 w-5" />
            <span>Adicionar Veículo</span>
          </button>
          <button
            type="button"
            onClick={() => void loadQueue()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 font-semibold text-white transition-all hover:bg-white/10"
          >
            <RefreshCw className="h-5 w-5" />
            {t('admin.queue.refresh')}
          </button>
        </div>
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
                        className="rounded-2xl border border-white/10 bg-darker p-5 shadow-md hover:border-white/20 transition-all"
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 font-mono text-xs font-bold text-primary">
                              {item.ticket}
                            </span>
                            <div className="mt-2 text-xs text-gray-500">
                              {item.appointment_date} às {item.appointment_time}
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
                              className="rounded-lg border border-blue-500/30 bg-blue-500/20 p-2 text-blue-300 transition-colors hover:bg-blue-500/30 disabled:opacity-60 flex items-center gap-1.5 px-3"
                              title={t('admin.queue.btn_start')}
                            >
                              <Play className="h-4 w-4 fill-current" />
                              <span className="text-xs font-bold">Iniciar Lavagem</span>
                            </button>
                          ) : null}
                          {column === 'in_progress' ? (
                            <button
                              type="button"
                              disabled={savingId === item.id}
                              onClick={() => void setStatus(item.id, 'completed')}
                              className="rounded-lg border border-emerald-500/30 bg-emerald-500/20 p-2 text-emerald-300 transition-colors hover:bg-emerald-500/30 disabled:opacity-60 flex items-center gap-1.5 px-3"
                              title={t('admin.queue.btn_complete')}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-xs font-bold">Concluir</span>
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
                            <Loader2 className="h-4 w-4 animate-spin text-primary ml-auto" />
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

      {/* Modal Adicionar Veículo à Fila */}
      <AnimatePresence>
        {isAddOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-darker p-8 shadow-[0_0_60px_rgba(0,0,0,0.8)] my-8"
            >
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6 border-b border-white/10 pb-5">
                <span className="inline-block rounded-full bg-primary/20 border border-primary/30 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary mb-2">
                  Entrada Rápida de Balcão
                </span>
                <h3 className="text-2xl font-bold font-display text-white tracking-tight">
                  Adicionar Veículo à Fila
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Cadastre o cliente e o serviço avulso. O veículo será inserido instantaneamente no quadro de Espera.
                </p>
              </div>

              <form onSubmit={(e) => void handleCreateVehicle(e)} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Nome do Cliente / Motorista *
                  </label>
                  <input
                    type="text"
                    required
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full rounded-xl border border-white/10 bg-dark py-3 px-4 text-sm font-semibold text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      Matrícula (Placa) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPlate}
                      onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                      placeholder="Ex: MMX-9281"
                      className="w-full rounded-xl border border-white/10 bg-dark py-3 px-4 text-sm font-bold uppercase tracking-wider text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      Marca do Veículo
                    </label>
                    <input
                      type="text"
                      value={newMake}
                      onChange={(e) => setNewMake(e.target.value)}
                      placeholder="Ex: Toyota"
                      className="w-full rounded-xl border border-white/10 bg-dark py-3 px-4 text-sm font-semibold text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      Modelo do Veículo
                    </label>
                    <input
                      type="text"
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      placeholder="Ex: Hilux"
                      className="w-full rounded-xl border border-white/10 bg-dark py-3 px-4 text-sm font-semibold text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      Preço Cobrado (MT)
                    </label>
                    <input
                      type="text"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="Ex: 850.00"
                      className="w-full rounded-xl border border-white/10 bg-dark py-3 px-4 text-sm font-bold text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Serviço a Realizar
                  </label>
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
                    className="w-full rounded-xl border border-white/10 bg-dark py-3 px-4 text-sm font-semibold text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Lavagem Simples">Lavagem Simples (500 MT)</option>
                    <option value="Lavagem Completa VIP">Lavagem Completa VIP (850 MT)</option>
                    <option value="Higienização Interna Profunda">Higienização Interna Profunda (2500 MT)</option>
                    <option value="Enceramento Premium Carnaúba">Enceramento Premium Carnaúba (1500 MT)</option>
                    <option value="Lavagem de Motor a Vapor">Lavagem de Motor a Vapor (1200 MT)</option>
                  </select>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="rounded-xl border border-white/20 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={addingVehicle}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-blue-600 px-8 py-3 text-sm font-bold text-white hover:shadow-[0_0_30px_rgba(0,102,255,0.5)] transition-all font-display shadow-lg disabled:opacity-50"
                  >
                    {addingVehicle ? (
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    ) : (
                      <Car className="h-5 w-5 text-white/80" />
                    )}
                    <span>{addingVehicle ? 'A inserir...' : 'Confirmar e Inserir na Fila'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
