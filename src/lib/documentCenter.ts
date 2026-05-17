export type DocumentKind = 'invoice' | 'receipt' | 'purchase-order' | 'quotation' | 'letterhead';

export type DocumentStatus =
 | 'Draft'
 | 'Issued'
 | 'Paid'
 | 'Pending'
 | 'Approved'
 | 'Sent';

export type PaymentMethod = 'card' | 'cash' | 'qr' | 'bank-transfer' | 'mpesa' | 'emola' | 'mkesh' | 'mobile_money';

export type DocumentParty = {
 name: string;
 taxId?: string;
 email?: string;
 phone?: string;
 address?: string;
};

export type DocumentLineItem = {
 id: string;
 description: string;
 details?: string;
 quantity: number;
 unitPrice: number;
};

export type BusinessDocument = {
 id: string;
 number: string;
 kind: DocumentKind;
 status: DocumentStatus;
 source: 'manual' | 'pos' | 'billing';
 title: string;
 issueDate: string;
 dueDate?: string;
 paymentMethod?: PaymentMethod;
 vatEnabled: boolean;
 vatIncluded?: boolean;
 vatRate: number;
 party: DocumentParty;
 items: DocumentLineItem[];
 notes?: string;
 body?: string;
 createdAt: string;
};

const STORAGE_KEY = 'doctor46.business-documents.v1';

const kindPrefixes: Record<DocumentKind, string> = {
 invoice: 'FT',
 receipt: 'RC',
 'purchase-order': 'PC',
 quotation: 'CT',
 letterhead: 'LT',
};

export const kindLabels: Record<DocumentKind, string> = {
 invoice: 'Fatura',
 receipt: 'Recibo',
 'purchase-order': 'Pedido de Compra',
 quotation: 'Cotação',
 letterhead: 'Papel Timbrado',
};

export const kindDescriptions: Record<DocumentKind, string> = {
 invoice: 'Documento comercial com itens, IVA, vencimento e total.',
 receipt: 'Comprovativo de pagamento com emissão imediata.',
 'purchase-order': 'Pedido para fornecedores com aprovação e detalhe técnico.',
 quotation: 'Proposta comercial pronta para o cliente aprovar.',
 letterhead: 'Documento institucional com branding e corpo livre.',
};

const formatIssueDate = (value: Date) =>
 value.toLocaleDateString('pt-PT', {
 day: '2-digit',
 month: 'short',
 year: 'numeric',
 });

export const createDocumentNumber = (kind: DocumentKind) => {
 const now = new Date();
 const year = now.getFullYear();
 const serial = Math.floor(100 + Math.random() * 900);
 return `${kindPrefixes[kind]}-${year}/${serial}`;
};

export const calculateDocumentTotals = (document: Pick<BusinessDocument, 'items' | 'vatEnabled' | 'vatIncluded' | 'vatRate'>) => {
 const lineTotal = document.items.reduce(
 (total, item) => total + item.quantity * item.unitPrice,
 0
 );
 if (!document.vatEnabled) {
 return { subtotal: lineTotal, vatAmount: 0, total: lineTotal };
 }

 if (document.vatIncluded) {
 const subtotal = lineTotal / (1 + document.vatRate / 100);
 return { subtotal, vatAmount: lineTotal - subtotal, total: lineTotal };
 }

 const vatAmount = lineTotal * (document.vatRate / 100);
 const total = lineTotal + vatAmount;

 return { subtotal: lineTotal, vatAmount, total };
};

const seedDocuments = (): BusinessDocument[] => [
 {
 id: 'seed-ft-001',
 number: 'FT-2026/104',
 kind: 'invoice',
 status: 'Paid',
 source: 'billing',
 title: 'Fatura de serviço premium',
 issueDate: '27 Mar 2026',
 dueDate: '31 Mar 2026',
 vatEnabled: true,
 vatRate: 16,
 paymentMethod: 'card',
 party: {
 name: 'João Silva',
 taxId: '112233445',
 phone: '+258 84 555 7788',
 email: 'joao@email.com',
 address: 'Bairro Coop, Lichinga',
 },
 items: [
 { id: 'i-1', description: 'Lavagem Premium', quantity: 1, unitPrice: 1800, details: 'Lavagem completa premium' },
 { id: 'i-2', description: 'Cera Líquida Extra', quantity: 1, unitPrice: 350, details: 'Proteção e brilho final' },
 ],
 notes: 'Obrigado por confiar no The Doctor 46.',
 createdAt: new Date().toISOString(),
 },
 {
 id: 'seed-ct-001',
 number: 'CT-2026/210',
 kind: 'quotation',
 status: 'Sent',
 source: 'manual',
 title: 'Cotação para frota ligeira',
 issueDate: '27 Mar 2026',
 dueDate: '05 Abr 2026',
 vatEnabled: true,
 vatRate: 16,
 party: {
 name: 'Empresa XYZ Lda',
 taxId: '990022114',
 email: 'compras@xyz.co.mz',
 phone: '+258 87 400 1000',
 address: 'Zona Industrial, Lichinga',
 },
 items: [
 { id: 'i-1', description: 'Lavagem de frota - veículos ligeiros', quantity: 10, unitPrice: 950, details: 'Atendimento no local' },
 { id: 'i-2', description: 'Desconto comercial', quantity: 1, unitPrice: -800, details: 'Ajuste por volume' },
 ],
 notes: 'Validade da proposta: 10 dias.',
 createdAt: new Date().toISOString(),
 },
];

export const loadBusinessDocuments = (): BusinessDocument[] => {
 if (typeof window === 'undefined') return seedDocuments();

 const raw = window.localStorage.getItem(STORAGE_KEY);
 if (!raw) {
 const seeded = seedDocuments();
 window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
 return seeded;
 }

 try {
 const parsed = JSON.parse(raw) as BusinessDocument[];
 return parsed.length > 0 ? parsed : seedDocuments();
 } catch {
 const seeded = seedDocuments();
 window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
 return seeded;
 }
};

export const saveBusinessDocuments = (documents: BusinessDocument[]) => {
 if (typeof window === 'undefined') return;
 window.localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
};

export const upsertBusinessDocument = (document: BusinessDocument) => {
 const current = loadBusinessDocuments();
 const exists = current.some((item) => item.id === document.id);
 const next = exists
 ? current.map((item) => (item.id === document.id ? document : item))
 : [document, ...current];

 saveBusinessDocuments(next);
 return next;
};

export const createManualDocument = (input: Omit<BusinessDocument, 'id' | 'number' | 'createdAt'>) => {
 return {
 ...input,
 id: `doc-${Date.now()}`,
 number: createDocumentNumber(input.kind),
 createdAt: new Date().toISOString(),
 } satisfies BusinessDocument;
};

export const createPosReceiptDocument = (params: {
 customerName: string;
 items: Array<{ id: string; name: string; qty: number; price: number }>;
 paymentMethod: PaymentMethod;
 vatEnabled: boolean;
 vatRate: number;
}) => {
 return createManualDocument({
 kind: 'receipt',
 status: 'Paid',
 source: 'pos',
 title: 'Recibo POS',
 issueDate: formatIssueDate(new Date()),
 paymentMethod: params.paymentMethod,
 vatEnabled: params.vatEnabled,
 vatRate: params.vatRate,
 party: {
 name: params.customerName,
 },
 items: params.items.map((item) => ({
 id: item.id,
 description: item.name,
 quantity: item.qty,
 unitPrice: item.price,
 })),
 notes: 'Documento emitido automaticamente no ponto de venda.',
 });
};

export const toBillingStatus = (document: BusinessDocument) => {
 switch (document.kind) {
 case 'invoice':
 return document.status === 'Paid' ? 'Paga' : 'Pendente';
 case 'receipt':
 return 'Emitido';
 case 'purchase-order':
 return document.status === 'Approved' ? 'Aprovado' : 'Pendente';
 case 'quotation':
 return document.status === 'Sent' ? 'Enviada' : 'Rascunho';
 case 'letterhead':
 return 'Emitido';
 default:
 return document.status;
 }
};
