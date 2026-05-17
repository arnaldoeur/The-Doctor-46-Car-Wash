import { Car, Clock } from 'lucide-react';
import { format } from 'date-fns';
import {
 buildAppointmentDate,
 formatVehicleLabel,
 type CustomerAppointmentRecord,
} from '../../lib/customerPortalView';

type HistoryListItemProps = {
 appointment: CustomerAppointmentRecord;
};

export default function HistoryListItem({ appointment }: HistoryListItemProps) {
 return (
 <div className="flex flex-col gap-5 rounded-2xl border border-white/5 bg-darker p-5 transition-colors hover:border-white/10 lg:flex-row lg:items-center lg:justify-between">
 <div>
 <h3 className="font-display text-xl font-bold text-white">{appointment.service_name}</h3>
 <p className="mt-2 flex items-center gap-2 text-sm text-gray-400">
 <Car className="h-4 w-4" />
 {formatVehicleLabel(appointment)}
 </p>
 </div>

 <div className="text-sm text-gray-400 lg:text-right">
 <p className="font-semibold text-white">
 {format(buildAppointmentDate(appointment), 'dd MM yy')}
 </p>
 <p className="mt-1 flex items-center gap-2 lg:justify-end">
 <Clock className="h-4 w-4" />
 {appointment.appointment_time}
 </p>
 <p className="mt-3 font-medium text-primary">{appointment.service_price_text}</p>
 </div>
 </div>
 );
}
