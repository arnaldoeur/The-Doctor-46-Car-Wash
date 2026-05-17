type QuickStatsGridProps = {
 points: number;
 nextAppointmentLabel: string;
 totalServices: number;
};

export default function QuickStatsGrid({
 points,
 nextAppointmentLabel,
 totalServices,
}: QuickStatsGridProps) {
 const stats = [
 { label: 'Pontos atuais', value: `${points}` },
 { label: 'Proximo agendamento', value: nextAppointmentLabel },
 { label: 'Servicos concluidos', value: `${totalServices}` },
 ];

 return (
 <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
 {stats.map((stat) => (
 <div key={stat.label} className="rounded-3xl border border-white/10 bg-dark p-6">
 <p className="text-sm font-medium text-gray-400">{stat.label}</p>
 <p className="mt-3 font-display text-3xl font-bold text-white">{stat.value}</p>
 </div>
 ))}
 </div>
 );
}
