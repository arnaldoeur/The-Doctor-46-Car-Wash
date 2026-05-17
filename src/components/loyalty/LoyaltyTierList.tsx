type LoyaltyTierListProps = {
 tiers: Array<{
 label: string;
 minimumPoints: number;
 highlighted: boolean;
 }>;
};

export default function LoyaltyTierList({ tiers }: LoyaltyTierListProps) {
 return (
 <div className="rounded-3xl border border-white/10 bg-dark p-6">
 <div className="mb-6">
 <h2 className="font-display text-2xl font-bold text-white">Escaloes do programa</h2>
 <p className="mt-2 text-sm text-gray-400">
 Cada nivel mostra o patamar de pontos necessario para subir no programa.
 </p>
 </div>

 <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
 {tiers.map((tier) => (
 <div
 key={tier.label}
 className={`rounded-2xl border p-5 transition-colors ${
 tier.highlighted
 ? 'border-primary/30 bg-primary/10'
 : 'border-white/10 bg-darker'
 }`}
 >
 <p className="text-sm uppercase tracking-[0.18em] text-primary">{tier.label}</p>
 <p className="mt-4 font-display text-3xl font-bold text-white">{tier.minimumPoints}</p>
 <p className="mt-2 text-sm text-gray-400">pontos para atingir este nivel</p>
 </div>
 ))}
 </div>
 </div>
 );
}
