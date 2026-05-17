import { Calendar, Clock, Car } from 'lucide-react';
import { format } from 'date-fns';
import {
 buildAppointmentDate,
 formatVehicleLabel,
 getAppointmentStatusClass,
 formatAppointmentStatus,
 type CustomerAppointmentRecord,
} from '../../lib/customerPortalView';

type NextAppointmentHighlightProps = {
 appointment: CustomerAppointmentRecord | null;
 loading: boolean;
};

export default function NextAppointmentHighlight({
 appointment,
 loading,
}: NextAppointmentHighlightProps) {
 return (
 <div className="rounded-3xl border border-white/10 bg-dark p-6">
 <div className="mb-6 flex items-center gap-2">
 <Calendar className="h-5 w-5 text-primary" />
 <h2 className="font-display text-2xl font-bold text-white">Proximo agendamento</h2>
 </div>

 {loading ? (
 <div className="rounded-2xl border border-white/5 bg-darker px-5 py-10 text-center text-gray-500">
 A carregar proximo agendamento...
 </div>
 ) : appointment ? (
 <div className="rounded-2xl border border-white/5 bg-darker p-5">
 <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
 <div>
 <h3 className="font-display text-2xl font-bold text-white">{appointment.service_name}</h3>
 <span
 className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getAppointmentStatusClass(
 appointment.status
 )}`}
 >
 {formatAppointmentStatus(appointment.status)}
 </span>
 </div>

 <div className="text-left md:text-right">
 <p className="font-semibold text-white">
 {format(buildAppointmentDate(appointment), 'dd MM yy')}
 </p>
 <p className="mt-1 flex items-center gap-2 text-sm text-gray-400 md:justify-end">
 <Clock className="h-4 w-4" />
 {appointment.appointment_time}
 </p>
 </div>
 </div>

 <div className="mt-5 flex items-center gap-2 border-t border-white/5 pt-5 text-sm text-gray-400">
 <Car className="h-4 w-4" />
 {formatVehicleLabel(appointment)}
 </div>
 </div>
 ) : (
 <div className="rounded-2xl border border-white/5 bg-darker px-5 py-10 text-center text-gray-500">
 Nenhum agendamento futuro encontrado.
 </div>
 )}
 </div>
 );
}
