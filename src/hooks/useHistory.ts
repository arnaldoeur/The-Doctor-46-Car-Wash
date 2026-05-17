import { useCallback, useEffect, useMemo, useState } from 'react';
import { listAppointments } from '../lib/customerPortal';
import { parseMeticais } from '../lib/loyalty';
import { type CustomerAppointmentRecord } from '../lib/customerPortalView';
import { useAuth } from '../providers/AuthProvider';

const historyFields =
 'id, service_name, service_price_text, service_duration_text, appointment_date, appointment_time, status, vehicle_make, vehicle_model, vehicle_plate, loyalty_points_earned';

type UseHistoryResult = {
 completedServices: CustomerAppointmentRecord[];
 totalCompletedServices: number;
 totalCompletedValue: number;
 loading: boolean;
 error: string;
 refresh: () => Promise<void>;
};

export function useHistory(): UseHistoryResult {
 const { user } = useAuth();
 const [completedServices, setCompletedServices] = useState<CustomerAppointmentRecord[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');

 const refresh = useCallback(async () => {
 if (!user) {
 setCompletedServices([]);
 setLoading(false);
 setError('');
 return;
 }

 setLoading(true);
 setError('');

 try {
 const data = await listAppointments(user.id);
 setCompletedServices(
 (data ?? []).filter((appointment) => appointment.status === 'completed') as CustomerAppointmentRecord[]
 );
 setLoading(false);
 } catch {
 setCompletedServices([]);
 setError('Nao foi possivel carregar o seu historico agora.');
 setLoading(false);
 }
 }, [user]);

 useEffect(() => {
 void refresh();
 }, [refresh]);

 const totalCompletedValue = useMemo(() => {
 return completedServices.reduce(
 (total, item) => total + parseMeticais(item.service_price_text),
 0
 );
 }, [completedServices]);

 return {
 completedServices,
 totalCompletedServices: completedServices.length,
 totalCompletedValue,
 loading,
 error,
 refresh,
 };
}
