import HistoryList from '../../components/history/HistoryList';
import { useHistory } from '../../hooks/useHistory';

export default function CustomerHistoryPage() {
 const { completedServices, totalCompletedServices, totalCompletedValue, loading, error } = useHistory();

 return (
 <div className="space-y-8">
 <div>
 <h1 className="mb-2 font-display text-3xl font-bold">Historico</h1>
 <p className="text-gray-400">
 Consulte apenas os servicos concluidos, com data, viatura atendida e valor registado.
 </p>
 </div>

 {error ? (
 <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
 {error}
 </div>
 ) : null}

 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
 <div className="rounded-3xl border border-white/10 bg-dark p-6">
 <p className="text-sm font-medium text-gray-400">Servicos concluidos</p>
 <p className="mt-3 font-display text-3xl font-bold text-white">{totalCompletedServices}</p>
 </div>
 <div className="rounded-3xl border border-white/10 bg-dark p-6">
 <p className="text-sm font-medium text-gray-400">Valor total registado</p>
 <p className="mt-3 font-display text-3xl font-bold text-white">
 {new Intl.NumberFormat('pt-PT', {
 minimumFractionDigits: 2,
 maximumFractionDigits: 2,
 }).format(totalCompletedValue)}{' '}
 MT
 </p>
 </div>
 </div>

 <HistoryList items={completedServices} loading={loading} />
 </div>
 );
}
