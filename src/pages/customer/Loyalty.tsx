import LoyaltyOverviewCard from '../../components/loyalty/LoyaltyOverviewCard';
import LoyaltyTierList from '../../components/loyalty/LoyaltyTierList';
import { useLoyalty } from '../../hooks/useLoyalty';

export default function CustomerLoyaltyPage() {
 const {
 currentPoints,
 currentTier,
 nextTierLabel,
 nextTierTarget,
 pointsRemaining,
 progressPercent,
 qualifyingServices,
 tiers,
 loading,
 error,
 } = useLoyalty();

 return (
 <div className="space-y-8">
 <div>
 <h1 className="mb-2 font-display text-3xl font-bold">Fidelidade</h1>
 <p className="text-gray-400">
 Acompanhe os seus pontos, o nivel atual e o progresso para o proximo patamar.
 </p>
 </div>

 {error ? (
 <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
 {error}
 </div>
 ) : null}

 <LoyaltyOverviewCard
 currentPoints={currentPoints}
 currentTier={currentTier}
 nextTierLabel={nextTierLabel}
 nextTierTarget={nextTierTarget}
 pointsRemaining={pointsRemaining}
 progressPercent={progressPercent}
 qualifyingServices={qualifyingServices}
 loading={loading}
 />

 <LoyaltyTierList tiers={tiers} />
 </div>
 );
}
