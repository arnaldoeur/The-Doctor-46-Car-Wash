export type LoyaltyTier = {
 label: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
 minimumPoints: number;
 nextTarget: number | null;
};

export const loyaltyTiers: LoyaltyTier[] = [
 { label: 'Bronze', minimumPoints: 0, nextTarget: 100 },
 { label: 'Silver', minimumPoints: 100, nextTarget: 200 },
 { label: 'Gold', minimumPoints: 200, nextTarget: 400 },
 { label: 'Platinum', minimumPoints: 400, nextTarget: null },
];

export function parseMeticais(priceText: string) {
 const numericValue = Number(priceText.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.'));
 return Number.isFinite(numericValue) ? numericValue : 0;
}

export function calculateLoyaltyPointsFromPrice(priceText: string) {
 const amount = parseMeticais(priceText);
 if (amount <= 0) {
 return 10;
 }

 return Math.max(10, Math.round(amount / 100));
}

export function getLoyaltyTier(points: number) {
 let currentTier = loyaltyTiers[0];

 for (const tier of loyaltyTiers) {
 if (points >= tier.minimumPoints) {
 currentTier = tier;
 }
 }

 return currentTier.label;
}

export function getNextTierTarget(points: number) {
 const nextTier = loyaltyTiers.find((tier) => points < tier.minimumPoints);
 return nextTier?.minimumPoints ?? loyaltyTiers[loyaltyTiers.length - 1].minimumPoints;
}

export function getNextTierLabel(points: number) {
 const nextTier = loyaltyTiers.find((tier) => points < tier.minimumPoints);
 return nextTier?.label ?? loyaltyTiers[loyaltyTiers.length - 1].label;
}
