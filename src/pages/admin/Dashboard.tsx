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
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { fetchDashboardSnapshot, type DashboardSnapshot } from '../../lib/adminData';
import { useLanguage } from '../../providers/LanguageProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { isOfflineModeActive } from '../../lib/apiClient';

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

const MotionDiv = motion.div;

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

        if (!active) return;

        setSnapshot(nextSnapshot);
      } catch (error) {
        console.error('Failed to load admin dashboard snapshot', error);
        if (active) setErrorMessage(copy.loadError);
      } finally {
        if (active) setLoading(false);
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

  const CustomTooltip = ({ active, payload, label, formatterLabel }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111111]/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">{label}</p>
          <p className="text-white font-semibold text-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary inline-block shadow-[0_0_8px_rgba(0,71,255,0.6)]"></span>
            {payload[0].value.toLocaleString('pt-MZ')} {formatterLabel === 'MT' ? 'MT' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-8 pb-10 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-2 mb-8">
          <div className="h-8 w-64 bg-white/5 rounded-2xl"></div>
          <div className="h-4 w-48 bg-white/5 rounded-xl mt-1"></div>
        </div>

        {/* 4 KPI Cards Skeleton */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-3xl border border-white/[0.04] bg-[#0F0F0F] p-6 text-left">
              <div className="mb-5 h-12 w-12 rounded-2xl bg-white/5 border border-white/[0.06] flex items-center justify-center">
                <div className="h-5 w-5 bg-white/5 rounded-full"></div>
              </div>
              <div className="h-4 w-24 bg-white/5 rounded"></div>
              <div className="h-8 w-36 bg-white/10 rounded mt-3"></div>
            </div>
          ))}
        </div>

        {/* 2 Charts Skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-3xl border border-white/[0.04] bg-[#0F0F0F] p-6 lg:p-8">
              <div className="h-6 w-48 bg-white/10 rounded mb-8"></div>
              <div className="h-[300px] flex items-end justify-between gap-4 px-2">
                {[...Array(8)].map((_, idx) => {
                  const heights = ['h-[30%]', 'h-[50%]', 'h-[70%]', 'h-[40%]', 'h-[60%]', 'h-[80%]', 'h-[45%]', 'h-[65%]'];
                  return (
                    <div key={idx} className={cn("w-full bg-white/[0.03] rounded-t-lg", heights[idx % heights.length])}></div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Stock and Recent Activity Skeleton */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_2fr]">
          {/* Stock Skeleton */}
          <div className="rounded-3xl border border-white/[0.04] bg-[#0F0F0F] p-6 lg:p-8 flex flex-col">
            <div className="h-6 w-40 bg-white/10 rounded mb-8"></div>
            <div className="space-y-6">
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="flex items-center justify-between rounded-2xl border border-white/[0.02] bg-white/[0.02] px-4 py-3.5">
                  <div className="space-y-2 w-1/2">
                    <div className="h-4 bg-white/5 rounded w-3/4"></div>
                    <div className="h-3 bg-white/5 rounded w-1/2"></div>
                  </div>
                  <div className="h-5 bg-white/10 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="rounded-3xl border border-white/[0.04] bg-[#0F0F0F] p-6 lg:p-8 flex flex-col">
            <div className="h-6 w-40 bg-white/10 rounded mb-6"></div>
            <div className="space-y-4">
              <div className="border-b border-white/[0.05] pb-4 flex justify-between">
                <div className="h-4 bg-white/5 rounded w-16"></div>
                <div className="h-4 bg-white/5 rounded w-24"></div>
                <div className="h-4 bg-white/5 rounded w-32"></div>
                <div className="h-4 bg-white/5 rounded w-16"></div>
              </div>
              {[1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="py-4 flex justify-between items-center border-b border-white/[0.02]">
                  <div className="h-5 bg-white/5 rounded w-12 font-mono"></div>
                  <div className="h-4 bg-white/5 rounded w-28"></div>
                  <div className="h-4 bg-white/5 rounded w-36"></div>
                  <div className="h-6 bg-white/10 rounded-full w-20"></div>
                  <div className="h-4 bg-white/10 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'concluído':
      case 'completed':
      case 'pronto':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'pendente':
      case 'pending':
      case 'em espera':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'em progresso':
      case 'in progress':
      case 'lavando':
        return 'text-primary bg-primary/10 border-primary/20';
      case 'cancelado':
      case 'cancelled':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-gray-400 bg-white/5 border-white/10';
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-display tracking-tight text-white">Dashboard Overview</h1>
            {isOfflineModeActive && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300 shadow-lg shadow-amber-500/5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Modo Offline (Local DB)
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            {isOfflineModeActive ? 'A mostrar dados locais armazenados em LocalStorage' : `${copy.source} · Real-time MySQL data`}
          </p>
        </div>

        {isOfflineModeActive && (
          <button
            onClick={async () => {
              setLoading(true);
              setErrorMessage('');
              try {
                const nextSnapshot = await fetchDashboardSnapshot();
                setSnapshot(nextSnapshot);
              } catch (error) {
                console.error('Failed to load admin dashboard snapshot', error);
                setErrorMessage(copy.loadError);
              } finally {
                setLoading(false);
              }
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition-all hover:bg-primary-hover shadow-[0_0_15px_rgba(0,71,255,0.4)] hover:shadow-[0_0_25px_rgba(0,71,255,0.6)] active:scale-95 shrink-0 self-start md:self-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Tentar Ligar ao MySQL</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200 flex items-center gap-3"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {errorMessage}
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, idx) => (
          <motion.button
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05, ease: 'easeOut' }}
            type="button"
            onClick={() => setSelectedMetric(metric)}
            className="group relative overflow-hidden rounded-3xl border border-white/[0.04] bg-[#0F0F0F] p-6 text-left transition-all hover:border-primary/40 hover:bg-[#141414] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
          >
            <div className="absolute top-0 right-0 p-6 opacity-0 translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
              <ArrowRight className="h-4 w-4 text-primary" />
            </div>
            
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform duration-300">
              <metric.icon className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(0,71,255,0.5)]" />
            </div>
            <div className="text-sm font-medium text-gray-400 tracking-wide">{metric.title}</div>
            <div className="mt-2 font-display text-3xl font-bold tracking-tight text-white group-hover:text-primary transition-colors duration-300">{metric.value}</div>
          </motion.button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-3xl border border-white/[0.04] bg-[#0F0F0F] p-6 lg:p-8"
        >
          <h3 className="mb-8 text-lg font-bold font-display text-white/90">{copy.weeklyRevenue}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={snapshot.weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#666" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                <YAxis stroke="#666" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(value) => `${value >= 1000 ? value/1000 + 'k' : value}`} />
                <Tooltip content={<CustomTooltip formatterLabel="MT" />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0047FF" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0047FF" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-3xl border border-white/[0.04] bg-[#0F0F0F] p-6 lg:p-8"
        >
          <h3 className="mb-8 text-lg font-bold font-display text-white/90">{copy.customerFlow}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={snapshot.weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#666" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                <YAxis stroke="#666" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip content={<CustomTooltip formatterLabel="" />} />
                <Line
                  type="monotone"
                  dataKey="customers"
                  stroke="#0047FF"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0A0A0A', stroke: '#0047FF', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#0047FF', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Stock and Recent Activity */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_2fr]">
        {/* Stock Management */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-3xl border border-white/[0.04] bg-[#0F0F0F] p-6 lg:p-8 flex flex-col h-full"
        >
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold font-display text-white/90">{copy.stockManagement}</h3>
              <p className="text-xs text-gray-500 mt-1">{copy.stockDescription}</p>
            </div>
            {snapshot.stockHighlights.lowStockCount > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{snapshot.stockHighlights.lowStockCount} {copy.stockAlert}</span>
              </div>
            )}
          </div>

          <div className="space-y-8 flex-1">
            <div>
              <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary/80"></span>
                {copy.topProducts}
              </div>
              <div className="space-y-3">
                {snapshot.stockHighlights.topProducts.length > 0 ? (
                  snapshot.stockHighlights.topProducts.map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-2xl border border-white/[0.02] bg-white/[0.02] px-4 py-3.5 hover:bg-white/[0.04] transition-colors">
                      <div className="min-w-0 pr-4">
                        <div className="font-medium text-white/90 text-sm truncate">{item.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{item.quantity} {copy.outputMovements}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-semibold text-primary text-sm">{item.amount.toLocaleString('pt-MZ')} MT</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-xs text-center text-gray-500 bg-white/[0.01]">
                    {copy.noTopProducts}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500/80"></span>
                {copy.slowProducts}
              </div>
              <div className="space-y-3">
                {snapshot.stockHighlights.slowProducts.length > 0 ? (
                  snapshot.stockHighlights.slowProducts.map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-2xl border border-white/[0.02] bg-white/[0.02] px-4 py-3.5 hover:bg-white/[0.04] transition-colors">
                      <div className="min-w-0 pr-4">
                        <div className="font-medium text-white/90 text-sm truncate">{item.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{item.quantity} {copy.outputsRegistered}</div>
                      </div>
                      <div className="text-xs text-gray-400 shrink-0">
                        <span className="text-gray-500 mr-1">{copy.currentStock}:</span>
                        <span className="font-semibold text-white">{item.currentStock}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-xs text-center text-gray-500 bg-white/[0.01]">
                    {copy.noSlowProducts}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-3xl border border-white/[0.04] bg-[#0F0F0F] p-6 lg:p-8 flex flex-col h-full"
        >
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold font-display text-white/90">{copy.recentActivity}</h3>
            <button className="text-xs font-medium text-primary hover:text-white transition-colors">View All</button>
          </div>
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full min-w-[700px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">{copy.table.order}</th>
                  <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">{copy.table.client}</th>
                  <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">{copy.table.service}</th>
                  <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">{copy.table.status}</th>
                  <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">{copy.table.value}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {snapshot.recentActivity.map((activity) => (
                  <tr key={activity.label} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 pr-4">
                      <span className="font-mono text-xs text-gray-500 bg-white/[0.03] px-2 py-1 rounded-md border border-white/[0.05]">{activity.id}</span>
                    </td>
                    <td className="py-4 pr-4 font-medium text-white/90">{activity.client}</td>
                    <td className="py-4 pr-4 text-gray-400">{activity.service}</td>
                    <td className="py-4 pr-4">
                      <span className={cn("inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide", getStatusColor(activity.status))}>
                        {activity.status}
                      </span>
                    </td>
                    <td className="py-4 pl-4 text-right font-semibold text-white">{activity.value}</td>
                  </tr>
                ))}
                {snapshot.recentActivity.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <History className="h-8 w-8 text-gray-600 mb-2 opacity-50" />
                        {copy.noRecentActivity}
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Metric Detail Modal */}
      <AnimatePresence>
        {selectedMetric && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
            onClick={() => setSelectedMetric(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-[#111111] p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-[2rem] pointer-events-none" />
              
              <button
                type="button"
                onClick={() => setSelectedMetric(null)}
                className="absolute right-6 top-6 text-gray-500 transition-colors hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative z-10">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-[0_0_15px_rgba(0,71,255,0.15)]">
                  <selectedMetric.icon className="h-6 w-6 text-primary drop-shadow-[0_0_8px_rgba(0,71,255,0.5)]" />
                </div>
                <h2 className="text-2xl font-bold font-display tracking-tight text-white mb-2">{selectedMetric.title}</h2>
                <div className="text-4xl font-bold tracking-tight text-white">{selectedMetric.value}</div>
                
                <div className="mt-8 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Metric Details</h4>
                  <p className="text-sm leading-relaxed text-gray-300">
                    {selectedMetric.detail}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
