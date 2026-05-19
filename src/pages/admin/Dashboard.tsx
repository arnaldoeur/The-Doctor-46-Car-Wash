import { useEffect, useState } from 'react';
import {
 BarChart,
 Bar,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
 LineChart,
 Line,
} from 'recharts';
import {
 AlertTriangle,
 Car,
 Loader2,
 Package,
 TrendingUp,
 Users,
 X,
} from 'lucide-react';
import { fetchDashboardSnapshot, type DashboardSnapshot } from '../../lib/adminData';
import { useLanguage } from '../../providers/LanguageProvider';

type MetricCard = {
 title: string;
 value: string;
 detail: string;
 icon: typeof TrendingUp;
};

const initialState: DashboardSnapshot = {
 todayRevenue: 0,
 todayVehicles: 0,
 todayNewClients: 0,
 averageTicket: 0,
 weeklyData: [],
 recentActivity: [],
 stockHighlights: {
 lowStockCount: 0,
 topProducts: [],
 slowProducts: [],
 },
};

const dashboardCopy = {
 pt: {
 loadError: 'Não foi possível carregar os indicadores reais do MySQL agora.',
 loading: 'A carregar o dashboard real do MySQL...',
 source: 'Fonte: MySQL',
 revenueLabel: 'Receita',
 customersLabel: 'Clientes',
 metrics: {
 revenueToday: 'Faturação Hoje',
 revenueTodayDetail: 'Total emitido hoje com base em documentos reais e serviços concluídos.',
 finishedVehicles: 'Veículos Finalizados',
 finishedVehiclesDetail: 'Quantidade de agendamentos com status concluído na data de hoje.',
 newClients: 'Novos Clientes',
 newClientsDetail: 'Perfis novos criados hoje na base de dados MySQL.',
 averageTicket: 'Ticket Médio',
 averageTicketDetail: 'Média por atendimento finalizado hoje, sem números simulados.',
 },
 weeklyRevenue: 'Faturação Semanal',
 customerFlow: 'Fluxo de Clientes',
 stockManagement: 'Gestão de Stock',
 stockDescription: 'Dados reais de saída e alertas do MySQL.',
 stockAlert: 'em alerta',
 topProducts: 'Produtos Mais Vendidos',
 outputMovements: 'movimentos de saída',
 noTopProducts: 'Ainda não existem movimentos de stock suficientes para ranking de vendas.',
 slowProducts: 'Produtos com Menor Saída',
 outputsRegistered: 'saídas registadas',
 currentStock: 'Stock atual',
 noSlowProducts: 'Sem itens suficientes para análise de baixa rotação.',
 recentActivity: 'Atividade Recente',
 table: {
 order: 'Pedido',
 client: 'Cliente',
 service: 'Serviço',
 operator: 'Operador',
 status: 'Status',
 value: 'Valor',
 },
 noRecentActivity: 'Ainda não existem atividades recentes no MySQL para mostrar aqui.',
 },
 en: {
 loadError: 'It was not possible to load the real MySQL indicators right now.',
 loading: 'Loading the real MySQL dashboard...',
 source: 'Source: MySQL',
 revenueLabel: 'Revenue',
 customersLabel: 'Customers',
 metrics: {
 revenueToday: 'Revenue Today',
 revenueTodayDetail: 'Total issued today based on real documents and completed services.',
 finishedVehicles: 'Finished Vehicles',
 finishedVehiclesDetail: 'Number of appointments completed today.',
 newClients: 'New Clients',
 newClientsDetail: 'New profiles created today in the MySQL database.',
 averageTicket: 'Average Ticket',
 averageTicketDetail: 'Average per completed service today, without simulated numbers.',
 },
 weeklyRevenue: 'Weekly Revenue',
 customerFlow: 'Customer Flow',
 stockManagement: 'Stock Management',
 stockDescription: 'Real output data and alerts from MySQL.',
 stockAlert: 'in alert',
 topProducts: 'Best-Selling Products',
 outputMovements: 'output movements',
 noTopProducts: 'There are not enough stock movements yet to rank sales.',
 slowProducts: 'Lowest-Moving Products',
 outputsRegistered: 'outputs registered',
 currentStock: 'Current stock',
 noSlowProducts: 'Not enough items for low-turnover analysis.',
 recentActivity: 'Recent Activity',
 table: {
 order: 'Order',
 client: 'Client',
 service: 'Service',
 operator: 'Operator',
 status: 'Status',
 value: 'Value',
 },
 noRecentActivity: 'There are no recent MySQL activities to show here yet.',
 },
};

export default function Dashboard() {
  const { language } = useLanguage();
  const copy = dashboardCopy[language];
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(initialState);
 const [selectedMetric, setSelectedMetric] = useState<MetricCard | null>(null);
 const [errorMessage, setErrorMessage] = useState('');

 useEffect(() => {
 let active = true;

 const load = async () => {
 try {
 setLoading(true);
 setErrorMessage('');
 const nextSnapshot = await fetchDashboardSnapshot();

 if (!active) {
 return;
 }

 setSnapshot(nextSnapshot);
 } catch (error) {
 console.error('Failed to load admin dashboard snapshot', error);
 if (active) {
 setErrorMessage(copy.loadError);
 }
 } finally {
 if (active) {
 setLoading(false);
 }
 }
 };

 void load();

 const handleCustomRefresh = () => {
 fetchDashboardSnapshot().then(setSnapshot).catch(console.error);
 };
 window.addEventListener('doctor46_dashboard_refresh', handleCustomRefresh);
 return () => {
 active = false;
 window.removeEventListener('doctor46_dashboard_refresh', handleCustomRefresh);
 };
 }, []);

 const metrics: MetricCard[] = [
 {
 title: copy.metrics.revenueToday,
 value: `${snapshot.todayRevenue.toLocaleString('pt-MZ')} MT`,
 detail: copy.metrics.revenueTodayDetail,
 icon: TrendingUp,
 },
 {
 title: copy.metrics.finishedVehicles,
 value: snapshot.todayVehicles.toString(),
 detail: copy.metrics.finishedVehiclesDetail,
 icon: Car,
 },
 {
 title: copy.metrics.newClients,
 value: snapshot.todayNewClients.toString(),
 detail: copy.metrics.newClientsDetail,
 icon: Users,
 },
 {
 title: copy.metrics.averageTicket,
 value: `${Math.round(snapshot.averageTicket).toLocaleString('pt-MZ')} MT`,
 detail: copy.metrics.averageTicketDetail,
 icon: Package,
 },
 ];

 if (loading) {
 return (
 <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
 <Loader2 className="h-12 w-12 animate-spin text-primary" />
 <p className="text-gray-400">{copy.loading}</p>
 </div>
 );
 }

 return (
 <div className="space-y-8">
 {errorMessage ? (
 <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
 {errorMessage}
 </div>
 ) : null}

 <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
 {metrics.map((metric) => (
 <button
 key={metric.title}
 type="button"
 onClick={() => setSelectedMetric(metric)}
 className="rounded-2xl border border-white/10 bg-dark p-6 text-left transition-colors hover:border-primary/40"
 >
 <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
 <metric.icon className="h-6 w-6 text-primary" />
 </div>
 <div className="text-sm font-medium text-gray-400">{metric.title}</div>
 <div className="mt-2 font-display text-3xl font-bold text-white">{metric.value}</div>
 <div className="mt-3 text-xs uppercase tracking-[0.22em] text-gray-500">
 {copy.source}
 </div>
 </button>
 ))}
 </div>

 <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
 <div className="rounded-2xl border border-white/10 bg-dark p-6">
 <h3 className="mb-6 text-lg font-bold font-display">{copy.weeklyRevenue}</h3>
 <div className="h-80">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={snapshot.weeklyData}>
 <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
 <XAxis dataKey="name" stroke="#8A8A8A" axisLine={false} tickLine={false} />
 <YAxis
 stroke="#8A8A8A"
 axisLine={false}
 tickLine={false}
 tickFormatter={(value) => `${value} MT`}
 />
 <Tooltip
 formatter={(value: number) => [
 `${value.toLocaleString('pt-MZ')} MT`,
 copy.revenueLabel,
 ]}
 contentStyle={{
 backgroundColor: '#0B0B0B',
 border: '1px solid rgba(255,255,255,0.08)',
 borderRadius: '14px',
 }}
 />
 <Bar dataKey="revenue" fill="#0A5CFF" radius={[8, 8, 0, 0]} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div className="rounded-2xl border border-white/10 bg-dark p-6">
 <h3 className="mb-6 text-lg font-bold font-display">{copy.customerFlow}</h3>
 <div className="h-80">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={snapshot.weeklyData}>
 <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
 <XAxis dataKey="name" stroke="#8A8A8A" axisLine={false} tickLine={false} />
 <YAxis stroke="#8A8A8A" axisLine={false} tickLine={false} />
 <Tooltip
 formatter={(value: number) => [value, copy.customersLabel]}
 contentStyle={{
 backgroundColor: '#0B0B0B',
 border: '1px solid rgba(255,255,255,0.08)',
 borderRadius: '14px',
 }}
 />
 <Line
 type="monotone"
 dataKey="customers"
 stroke="#0A5CFF"
 strokeWidth={3}
 dot={{ r: 4, fill: '#0A5CFF', strokeWidth: 0 }}
 activeDot={{ r: 6 }}
 />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
 <div className="rounded-2xl border border-white/10 bg-dark p-6">
 <div className="mb-6 flex items-center justify-between gap-4">
 <div>
 <h3 className="text-lg font-bold font-display">{copy.stockManagement}</h3>
 <p className="text-sm text-gray-400">
 {copy.stockDescription}
 </p>
 </div>
 <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-sm font-semibold text-amber-300">
 <AlertTriangle className="h-4 w-4" />
 {snapshot.stockHighlights.lowStockCount} {copy.stockAlert}
 </div>
 </div>

 <div className="space-y-6">
 <div>
 <div className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
 {copy.topProducts}
 </div>
 <div className="space-y-3">
 {snapshot.stockHighlights.topProducts.length > 0 ? (
 snapshot.stockHighlights.topProducts.map((item) => (
 <div
 key={item.name}
 className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 px-4 py-3"
 >
 <div>
 <div className="font-medium text-white">{item.name}</div>
 <div className="text-sm text-gray-500">
 {item.quantity} {copy.outputMovements}
 </div>
 </div>
 <div className="text-right">
 <div className="font-semibold text-primary">
 {item.amount.toLocaleString('pt-MZ')} MT
 </div>
 </div>
 </div>
 ))
 ) : (
 <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-gray-500">
 {copy.noTopProducts}
 </div>
 )}
 </div>
 </div>

 <div>
 <div className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
 {copy.slowProducts}
 </div>
 <div className="space-y-3">
 {snapshot.stockHighlights.slowProducts.length > 0 ? (
 snapshot.stockHighlights.slowProducts.map((item) => (
 <div
 key={item.name}
 className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 px-4 py-3"
 >
 <div>
 <div className="font-medium text-white">{item.name}</div>
 <div className="text-sm text-gray-500">
 {item.quantity} {copy.outputsRegistered}
 </div>
 </div>
 <div className="text-sm text-gray-400">
 {copy.currentStock}:{' '}
 <span className="font-semibold text-white">{item.currentStock}</span>
 </div>
 </div>
 ))
 ) : (
 <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-gray-500">
 {copy.noSlowProducts}
 </div>
 )}
 </div>
 </div>
 </div>
 </div>

 <div className="rounded-2xl border border-white/10 bg-dark p-6">
 <h3 className="mb-6 text-lg font-bold font-display">{copy.recentActivity}</h3>
 <div className="overflow-x-auto">
 <table className="w-full min-w-[760px] border-collapse text-left text-sm">
 <thead>
 <tr className="border-b border-white/10 text-gray-400">
 <th className="pb-4 font-medium">{copy.table.order}</th>
 <th className="pb-4 font-medium">{copy.table.client}</th>
 <th className="pb-4 font-medium">{copy.table.service}</th>
 <th className="pb-4 font-medium">{copy.table.operator}</th>
 <th className="pb-4 font-medium">{copy.table.status}</th>
 <th className="pb-4 font-medium text-right">{copy.table.value}</th>
 </tr>
 </thead>
 <tbody>
 {snapshot.recentActivity.map((activity) => (
 <tr key={activity.label} className="border-b border-white/5">
 <td className="py-4 font-mono text-gray-500">{activity.id}</td>
 <td className="py-4 font-medium text-white">{activity.client}</td>
 <td className="py-4 text-gray-300">{activity.service}</td>
 <td className="py-4 text-gray-400">{activity.operator}</td>
 <td className="py-4">
 <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
 {activity.status}
 </span>
 </td>
 <td className="py-4 text-right font-semibold text-white">{activity.value}</td>
 </tr>
 ))}
 {snapshot.recentActivity.length === 0 ? (
 <tr>
 <td colSpan={6} className="py-8 text-center text-gray-500">
 {copy.noRecentActivity}
 </td>
 </tr>
 ) : null}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {selectedMetric ? (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
 <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-darker p-8 shadow-2xl">
 <button
 type="button"
 onClick={() => setSelectedMetric(null)}
 className="absolute right-6 top-6 text-gray-400 transition-colors hover:text-white"
 >
 <X className="h-6 w-6" />
 </button>

 <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
 <selectedMetric.icon className="h-8 w-8 text-primary" />
 </div>
 <h2 className="text-2xl font-bold font-display text-white">{selectedMetric.title}</h2>
 <div className="mt-3 text-4xl font-bold text-white">{selectedMetric.value}</div>
 <div className="mt-6 rounded-2xl border border-white/10 bg-dark p-4 text-sm leading-relaxed text-gray-400">
 {selectedMetric.detail}
 </div>
 </div>
 </div>
 ) : null}
 </div>
 );
}
