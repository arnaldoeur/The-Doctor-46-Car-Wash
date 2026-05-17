import type { CustomerAppointmentRecord } from '../../lib/customerPortalView';
import AppointmentListItem from './AppointmentListItem';

type AppointmentsSectionProps = {
 title: string;
 description: string;
 appointments: CustomerAppointmentRecord[];
 loading: boolean;
 emptyMessage: string;
};

export default function AppointmentsSection({
 title,
 description,
 appointments,
 loading,
 emptyMessage,
}: AppointmentsSectionProps) {
 return (
 <section className="rounded-3xl border border-white/10 bg-dark p-6">
 <div className="mb-6">
 <h2 className="font-display text-2xl font-bold text-white">{title}</h2>
 <p className="mt-2 text-sm text-gray-400">{description}</p>
 </div>

 {loading ? (
 <div className="rounded-2xl border border-white/5 bg-darker px-5 py-10 text-center text-gray-500">
 A carregar agendamentos...
 </div>
 ) : appointments.length > 0 ? (
 <div className="space-y-4">
 {appointments.map((appointment) => (
 <div key={appointment.id}>
 <AppointmentListItem appointment={appointment} />
 </div>
 ))}
 </div>
 ) : (
 <div className="rounded-2xl border border-white/5 bg-darker px-5 py-10 text-center text-gray-500">
 {emptyMessage}
 </div>
 )}
 </section>
 );
}
