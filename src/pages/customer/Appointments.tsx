import AppointmentsSection from '../../components/appointments/AppointmentsSection';
import { useAppointments } from '../../hooks/useAppointments';

export default function CustomerAppointmentsPage() {
 const {
 upcomingAppointments,
 pastAppointments,
 totalAppointments,
 loading,
 error,
 } = useAppointments();

 return (
 <div className="space-y-8">
 <div>
 <h1 className="mb-2 font-display text-3xl font-bold">Meus Agendamentos</h1>
 <p className="text-gray-400">
 Gerencie os seus agendamentos futuros e acompanhe os pedidos ja atendidos ou encerrados.
 </p>
 </div>

 {error ? (
 <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
 {error}
 </div>
 ) : null}

 <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
 <div className="rounded-3xl border border-white/10 bg-dark p-6">
 <p className="text-sm font-medium text-gray-400">Agendamentos futuros</p>
 <p className="mt-3 font-display text-3xl font-bold text-white">{upcomingAppointments.length}</p>
 </div>
 <div className="rounded-3xl border border-white/10 bg-dark p-6">
 <p className="text-sm font-medium text-gray-400">Agendamentos anteriores</p>
 <p className="mt-3 font-display text-3xl font-bold text-white">{pastAppointments.length}</p>
 </div>
 <div className="rounded-3xl border border-white/10 bg-dark p-6">
 <p className="text-sm font-medium text-gray-400">Total registado</p>
 <p className="mt-3 font-display text-3xl font-bold text-white">{totalAppointments}</p>
 </div>
 </div>

 <AppointmentsSection
 title="Proximos agendamentos"
 description="Lista completa dos seus pedidos ativos, com estado, data, hora e servico."
 appointments={upcomingAppointments}
 loading={loading}
 emptyMessage="Nao existem agendamentos futuros neste momento."
 />

 <AppointmentsSection
 title="Agendamentos anteriores"
 description="Registos antigos, cancelados ou ja finalizados para consulta rapida."
 appointments={pastAppointments}
 loading={loading}
 emptyMessage="Ainda nao existem agendamentos anteriores."
 />
 </div>
 );
}
