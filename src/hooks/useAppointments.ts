import { useCallback, useEffect, useMemo, useState } from 'react';
import { listAppointments } from '../lib/customerPortal';
import {
 buildAppointmentDate,
 isPastAppointment,
 isUpcomingAppointment,
 type CustomerAppointmentRecord,
} from '../lib/customerPortalView';
import { useAuth } from '../providers/AuthProvider';

const appointmentFields =
 'id, service_name, service_price_text, service_duration_text, appointment_date, appointment_time, status, vehicle_make, vehicle_model, vehicle_plate, loyalty_points_earned';

type UseAppointmentsResult = {
 upcomingAppointments: CustomerAppointmentRecord[];
 pastAppointments: CustomerAppointmentRecord[];
 nextAppointment: CustomerAppointmentRecord | null;
 totalAppointments: number;
 loading: boolean;
 error: string;
 refresh: () => Promise<void>;
};

function getAppointmentsErrorMessage(error: unknown) {
 if (!error) {
 return '';
 }

 return 'Nao foi possivel carregar os seus agendamentos agora.';
}

export function useAppointments(): UseAppointmentsResult {
 const { user } = useAuth();
 const [appointments, setAppointments] = useState<CustomerAppointmentRecord[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');

 const refresh = useCallback(async () => {
 if (!user) {
 setAppointments([]);
 setLoading(false);
 setError('');
 return;
 }

 setLoading(true);
 setError('');

 try {
 const data = await listAppointments(user.id);
 setAppointments((data ?? []) as CustomerAppointmentRecord[]);
 setLoading(false);
 } catch (error) {
 setAppointments([]);
 setError(getAppointmentsErrorMessage(error));
 setLoading(false);
 }
 }, [user]);

 useEffect(() => {
 void refresh();
 }, [refresh]);

 const upcomingAppointments = useMemo(() => {
 return appointments.filter((appointment) => isUpcomingAppointment(appointment));
 }, [appointments]);

 const pastAppointments = useMemo(() => {
 return appointments
 .filter((appointment) => isPastAppointment(appointment))
 .sort((left, right) => buildAppointmentDate(right).getTime() - buildAppointmentDate(left).getTime());
 }, [appointments]);

 return {
 upcomingAppointments,
 pastAppointments,
 nextAppointment: upcomingAppointments[0] ?? null,
 totalAppointments: appointments.length,
 loading,
 error,
 refresh,
 };
}
