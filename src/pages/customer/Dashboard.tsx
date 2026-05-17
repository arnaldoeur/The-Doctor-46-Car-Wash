import { format } from 'date-fns';
import DashboardActions from '../../components/dashboard/DashboardActions';
import NextAppointmentHighlight from '../../components/dashboard/NextAppointmentHighlight';
import QuickStatsGrid from '../../components/dashboard/QuickStatsGrid';
import { useAppointments } from '../../hooks/useAppointments';
import { useHistory } from '../../hooks/useHistory';
import { useLoyalty } from '../../hooks/useLoyalty';
import { buildAppointmentDate } from '../../lib/customerPortalView';
import { useAuth } from '../../providers/AuthProvider';

export default function CustomerDashboard() {
 const { user, profile } = useAuth();
 const { nextAppointment, loading: appointmentsLoading, error: appointmentsError } = useAppointments();
 const { totalCompletedServices, error: historyError } = useHistory();
 const { currentPoints, error: loyaltyError } = useLoyalty();

 const displayName = profile?.full_name?.trim() || user?.email?.split('@')[0] || 'Cliente';
 const nextAppointmentLabel = nextAppointment
 ? format(buildAppointmentDate(nextAppointment), 'dd MM')
 : 'Sem agenda';

 const pageError = appointmentsError || historyError || loyaltyError;

 return (
 <div className="space-y-8">
 <div>
 <h1 className="mb-2 font-display text-3xl font-bold">Ola, {displayName}!</h1>
 <p className="text-gray-400">
 Veja o resumo rapido da sua conta, os seus pontos e o proximo atendimento.
 </p>
 </div>

 {pageError ? (
 <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
 {pageError}
 </div>
 ) : null}

 <QuickStatsGrid
 points={currentPoints}
 nextAppointmentLabel={nextAppointmentLabel}
 totalServices={totalCompletedServices}
 />

 <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.8fr]">
 <NextAppointmentHighlight appointment={nextAppointment} loading={appointmentsLoading} />
 <DashboardActions phone={profile?.phone} />
 </div>
 </div>
 );
}
