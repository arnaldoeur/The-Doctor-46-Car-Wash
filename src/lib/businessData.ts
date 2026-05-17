export type PriceLogic = 'standard' | 'technical' | 'fixed';

export type ServiceCatalogEntry = {
 id: string;
 name: string;
 category: string;
 description: string;
 priceLogic: PriceLogic;
 serviceCost: number;
 technicalCost: number;
 marginPercent: number;
 applyVat: boolean;
 vatRate: number;
 targetPrice: number;
 status: 'Ativo' | 'Rascunho';
};

export type ClientProfile = {
 id: string;
 name: string;
 taxId: string;
 email: string;
 phone: string;
 address: string;
 segment: string;
};

const CATALOG_KEY = 'doctor46.catalog.services.v1';
const CLIENTS_KEY = 'doctor46.catalog.clients.v1';

const defaultServices: ServiceCatalogEntry[] = [
 {
 id: 'SRV-101',
 name: 'Lavagem Premium',
 category: 'Lavagem',
 description: 'Lavagem completa exterior com acabamento premium.',
 priceLogic: 'standard',
 serviceCost: 450,
 technicalCost: 220,
 marginPercent: 55,
 applyVat: true,
 vatRate: 16,
 targetPrice: 0,
 status: 'Ativo',
 },
 {
 id: 'SRV-205',
 name: 'Polimento Técnico',
 category: 'Detalhe',
 description: 'Correção de pintura com etapa técnica reforçada.',
 priceLogic: 'technical',
 serviceCost: 1800,
 technicalCost: 1400,
 marginPercent: 48,
 applyVat: true,
 vatRate: 16,
 targetPrice: 0,
 status: 'Ativo',
 },
 {
 id: 'SRV-310',
 name: 'Higienização Interna',
 category: 'Interior',
 description: 'Tratamento interno com foco em sanitização e acabamento.',
 priceLogic: 'fixed',
 serviceCost: 900,
 technicalCost: 650,
 marginPercent: 0,
 applyVat: false,
 vatRate: 16,
 targetPrice: 3200,
 status: 'Rascunho',
 },
];

const defaultClients: ClientProfile[] = [
 {
 id: 'CL-001',
 name: 'João Silva',
 taxId: '112233445',
 email: 'joao@email.com',
 phone: '+258 84 555 7788',
 address: 'Bairro Coop, Lichinga',
 segment: 'Particular',
 },
 {
 id: 'CL-002',
 name: 'Maria Santos',
 taxId: '223344556',
 email: 'maria@email.com',
 phone: '+258 84 100 2211',
 address: 'Triunfo, Maputo',
 segment: 'Particular',
 },
 {
 id: 'CL-003',
 name: 'Empresa XYZ Lda',
 taxId: '990022114',
 email: 'compras@xyz.co.mz',
 phone: '+258 87 400 1000',
 address: 'Zona Industrial, Lichinga',
 segment: 'Corporativo',
 },
 {
 id: 'CL-004',
 name: 'Moçambique Logistics',
 taxId: '447700991',
 email: 'fleet@mozlogistics.co.mz',
 phone: '+258 86 888 4411',
 address: 'Baixa, Nampula',
 segment: 'Frota',
 },
];

const loadFromStorage = <T,>(key: string, fallback: T): T => {
 if (typeof window === 'undefined') return fallback;

 const raw = window.localStorage.getItem(key);
 if (!raw) {
 window.localStorage.setItem(key, JSON.stringify(fallback));
 return fallback;
 }

 try {
 return JSON.parse(raw) as T;
 } catch {
 window.localStorage.setItem(key, JSON.stringify(fallback));
 return fallback;
 }
};

const saveToStorage = <T,>(key: string, value: T) => {
 if (typeof window === 'undefined') return;
 window.localStorage.setItem(key, JSON.stringify(value));
};

export const loadServiceCatalog = () => loadFromStorage(CATALOG_KEY, defaultServices);
export const saveServiceCatalog = (services: ServiceCatalogEntry[]) => saveToStorage(CATALOG_KEY, services);

export const loadClientProfiles = () => loadFromStorage(CLIENTS_KEY, defaultClients);
export const saveClientProfiles = (clients: ClientProfile[]) => saveToStorage(CLIENTS_KEY, clients);

export const calculateCatalogPricing = (service: ServiceCatalogEntry) => {
 const directCost = service.serviceCost + service.technicalCost;
 const logicBase =
 service.priceLogic === 'technical'
 ? service.serviceCost + service.technicalCost * 1.15
 : directCost;

 const priceBeforeVat =
 service.priceLogic === 'fixed'
 ? service.targetPrice
 : logicBase * (1 + service.marginPercent / 100);

 const marginValue = Math.max(priceBeforeVat - directCost, 0);
 const marginPercentActual = directCost > 0 ? (marginValue / directCost) * 100 : 0;
 const vatAmount = service.applyVat ? priceBeforeVat * (service.vatRate / 100) : 0;
 const finalPrice = priceBeforeVat + vatAmount;

 return {
 directCost,
 logicBase,
 marginValue,
 marginPercentActual,
 vatAmount,
 finalPrice,
 priceBeforeVat,
 };
};
