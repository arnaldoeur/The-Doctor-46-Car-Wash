import { Calendar, Car, Clock } from 'lucide-react';
import { format } from 'date-fns';
import {
 buildAppointmentDate,
 formatVehicleLabel,
 type CustomerAppointmentRecord,
} from '../../lib/customerPortalView';
import AppointmentStatusBadge from './AppointmentStatusBadge';

type AppointmentListItemProps = {
 appointment: CustomerAppointmentRecord;
};

export default function AppointmentListItem({ appointment }: AppointmentListItemProps) {
 return (
 <div className="rounded-2xl border border-white/5 bg-darker p-5 transition-colors hover:border-white/10">
 <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
 <div>
 <h3 className="font-display text-xl font-bold text-white">{appointment.service_name}</h3>
 <div className="mt-3">
 <AppointmentStatusBadge status={appointment.status} />
 </div>
 </div>

 <div className="grid gap-3 text-sm text-gray-400 md:grid-cols-2 lg:text-right">
 <div className="flex items-center gap-2 lg:justify-end">
 <Calendar className="h-4 w-4" />
 {format(buildAppointmentDate(appointment), 'dd MM yy')}
 </div>
 <div className="flex items-center gap-2 lg:justify-end">
 <Clock className="h-4 w-4" />
 {appointment.appointment_time}
 </div>
 <div className="flex items-center gap-2 md:col-span-2 lg:justify-end">
 <Car className="h-4 w-4" />
 {formatVehicleLabel(appointment)}
 </div>
 </div>
 </div>

 <div className="mt-5 flex flex-wrap gap-3 border-t border-white/5 pt-5 text-sm text-gray-400">
 <span>{appointment.service_price_text}</span>
 {appointment.service_duration_text ? <span>{appointment.service_duration_text}</span> : null}
 </div>
 </div>
 );
}
