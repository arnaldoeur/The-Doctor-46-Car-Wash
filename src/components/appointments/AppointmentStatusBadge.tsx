import type { AppointmentRow } from '../../lib/customerPortal';
import {
 formatAppointmentStatus,
 getAppointmentStatusClass,
} from '../../lib/customerPortalView';

export default function AppointmentStatusBadge({ status }: { status: AppointmentRow['status'] }) {
 return (
 <span
 className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getAppointmentStatusClass(
 status
 )}`}
 >
 {formatAppointmentStatus(status)}
 </span>
 );
}
