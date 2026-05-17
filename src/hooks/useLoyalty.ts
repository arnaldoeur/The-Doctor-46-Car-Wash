import { useCallback, useEffect, useMemo, useState } from 'react';
import { getLoyaltyTier, getNextTierLabel, getNextTierTarget, loyaltyTiers } from '../lib/loyalty';
import { listAppointments } from '../lib/customerPortal';
import { type LoyaltyActivityRecord } from '../lib/customerPortalView';
import { useAuth } from '../providers/AuthProvider';

const loyaltyFields =
 'id, service_name, appointment_date, appointment_time, status, loyalty_points_earned';

type LoyaltyTierCard = {
 label: string;
 minimumPoints: number;
 highlighted: boolean;
};

type UseLoyaltyResult = {
 currentPoints: number;
 currentTier: string;
 nextTierLabel: string;
 nextTierTarget: number;
 pointsRemaining: number;
 progressPercent: number;
 qualifyingServices: number;
 tiers: LoyaltyTierCard[];
 loading: boolean;
 error: string;
 refresh: () => Promise<void>;
};

export function useLoyalty(): UseLoyaltyResult {
 const { user } = useAuth();
 const [activity, setActivity] = useState<LoyaltyActivityRecord[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');

 const refresh = useCallback(async () => {
 if (!user) {
 setActivity([]);
 setLoading(false);
 setError('');
 return;
 }

 setLoading(true);
 setError('');

 try {
 const data = await listAppointments(user.id);
 setActivity(
 (data ?? []).filter((appointment) => appointment.status !== 'cancelled') as LoyaltyActivityRecord[]
 );
 setLoading(false);
 } catch {
 setActivity([]);
 setError('Nao foi possivel carregar o programa de fidelidade agora.');
 setLoading(false);
 }
 }, [user]);

 useEffect(() => {
 void refresh();
 }, [refresh]);

 const currentPoints = useMemo(() => {
 return activity.reduce((total, item) => total + item.loyalty_points_earned, 0);
 }, [activity]);

 const currentTier = getLoyaltyTier(currentPoints);
 const nextTierTarget = getNextTierTarget(currentPoints);
 const nextTierLabel = getNextTierLabel(currentPoints);
 const pointsRemaining = Math.max(nextTierTarget - currentPoints, 0);
 const progressPercent = nextTierTarget > 0 ? Math.min((currentPoints / nextTierTarget) * 100, 100) : 100;

 const tiers = useMemo(() => {
 return loyaltyTiers.map((tier) => ({
 label: tier.label,
 minimumPoints: tier.minimumPoints,
 highlighted: currentPoints >= tier.minimumPoints,
 }));
 }, [currentPoints]);

 return {
 currentPoints,
 currentTier,
 nextTierLabel,
 nextTierTarget,
 pointsRemaining,
 progressPercent,
 qualifyingServices: activity.length,
 tiers,
 loading,
 error,
 refresh,
 };
}
