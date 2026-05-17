import type { AppointmentRow } from './customerPortal';

export type CustomerAppointmentRecord = Pick<
 AppointmentRow,
 | 'id'
 | 'service_name'
 | 'service_price_text'
 | 'service_duration_text'
 | 'appointment_date'
 | 'appointment_time'
 | 'status'
 | 'vehicle_make'
 | 'vehicle_model'
 | 'vehicle_plate'
 | 'loyalty_points_earned'
>;

export type LoyaltyActivityRecord = Pick<
 AppointmentRow,
 'id' | 'service_name' | 'appointment_date' | 'appointment_time' | 'status' | 'loyalty_points_earned'
>;

export function buildAppointmentDate(appointment: Pick<AppointmentRow, 'appointment_date' | 'appointment_time'>) {
 return new Date(`${appointment.appointment_date}T${appointment.appointment_time}:00`);
}

export function isUpcomingAppointment(
 appointment: Pick<AppointmentRow, 'appointment_date' | 'appointment_time' | 'status'>,
 now = new Date()
) {
 const appointmentDate = buildAppointmentDate(appointment);
 return (
 appointmentDate.getTime() >= now.getTime() &&
 appointment.status !== 'completed' &&
 appointment.status !== 'cancelled'
 );
}

export function isPastAppointment(
 appointment: Pick<AppointmentRow, 'appointment_date' | 'appointment_time' | 'status'>,
 now = new Date()
) {
 const appointmentDate = buildAppointmentDate(appointment);
 return (
 appointmentDate.getTime() < now.getTime() ||
 appointment.status === 'completed' ||
 appointment.status === 'cancelled'
 );
}

export function formatAppointmentStatus(status: AppointmentRow['status']) {
 if (status === 'confirmed') {
 return 'Confirmado';
 }

 if (status === 'pending') {
 return 'Pendente';
 }

 if (status === 'cancelled') {
 return 'Cancelado';
 }

 return 'Concluido';
}

export function getAppointmentStatusClass(status: AppointmentRow['status']) {
 if (status === 'completed') {
 return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400';
 }

 if (status === 'cancelled') {
 return 'border-red-500/20 bg-red-500/10 text-red-300';
 }

 if (status === 'pending') {
 return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
 }

 return 'border-primary/20 bg-primary/10 text-primary';
}

export function formatVehicleLabel(
 appointment: Pick<CustomerAppointmentRecord, 'vehicle_make' | 'vehicle_model' | 'vehicle_plate'>
) {
 return `${appointment.vehicle_make} ${appointment.vehicle_model} (${appointment.vehicle_plate})`;
}
