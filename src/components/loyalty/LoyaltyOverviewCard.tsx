type LoyaltyOverviewCardProps = {
 currentPoints: number;
 currentTier: string;
 nextTierLabel: string;
 nextTierTarget: number;
 pointsRemaining: number;
 progressPercent: number;
 qualifyingServices: number;
 loading: boolean;
};

export default function LoyaltyOverviewCard({
 currentPoints,
 currentTier,
 nextTierLabel,
 nextTierTarget,
 pointsRemaining,
 progressPercent,
 qualifyingServices,
 loading,
}: LoyaltyOverviewCardProps) {
 return (
 <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 to-dark p-8">
 {loading ? (
 <div className="py-8 text-center text-gray-400">A carregar fidelidade...</div>
 ) : (
 <>
 <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
 <div>
 <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
 Programa Fidelidade
 </p>
 <h2 className="mt-3 font-display text-3xl font-bold text-white">{currentTier}</h2>
 <p className="mt-2 text-gray-400">
 {qualifyingServices} servico(s) validado(s) para acumulacao de pontos.
 </p>
 </div>

 <div className="text-left md:text-right">
 <p className="text-5xl font-bold text-white">{currentPoints}</p>
 <p className="mt-2 text-sm font-medium text-primary">Pontos atuais</p>
 </div>
 </div>

 <div className="mt-8">
 <div className="mb-2 flex justify-between text-sm text-gray-400">
 <span>Progresso para {nextTierLabel}</span>
 <span>
 {currentPoints} / {nextTierTarget} pts
 </span>
 </div>
 <div className="h-2 w-full overflow-hidden rounded-full border border-white/5 bg-darker">
 <div
 className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400"
 style={{ width: `${progressPercent}%` }}
 />
 </div>
 <p className="mt-4 text-sm text-gray-400">
 {pointsRemaining > 0
 ? `Faltam ${pointsRemaining} pontos para desbloquear o nivel ${nextTierLabel}.`
 : `Ja atingiu o nivel ${currentTier}.`}
 </p>
 </div>
 </>
 )}
 </div>
 );
}
