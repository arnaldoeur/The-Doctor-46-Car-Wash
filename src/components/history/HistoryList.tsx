import type { CustomerAppointmentRecord } from '../../lib/customerPortalView';
import HistoryListItem from './HistoryListItem';

type HistoryListProps = {
 items: CustomerAppointmentRecord[];
 loading: boolean;
};

export default function HistoryList({ items, loading }: HistoryListProps) {
 if (loading) {
 return (
 <div className="rounded-3xl border border-white/10 bg-dark px-6 py-10 text-center text-gray-500">
 A carregar historico...
 </div>
 );
 }

 if (items.length === 0) {
 return (
 <div className="rounded-3xl border border-white/10 bg-dark px-6 py-10 text-center text-gray-500">
 No history yet.
 </div>
 );
 }

 return (
 <div className="rounded-3xl border border-white/10 bg-dark p-6">
 <div className="space-y-4">
 {items.map((item) => (
 <div key={item.id}>
 <HistoryListItem appointment={item} />
 </div>
 ))}
 </div>
 </div>
 );
}
