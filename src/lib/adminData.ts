import { endOfDay, format, parseISO, startOfDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiRequest } from './apiClient';
import type { AppointmentRow, ProfileRow } from './customerPortal';

export type ServiceCatalogRow = {
 id: string;
 code: string;
 name: string;
 category: string;
 description: string | null;
 base_price: number;
 promotional_price: number | null;
 is_promotional: boolean;
 vat_enabled: boolean;
 vat_included: boolean;
 vat_rate: number;
 duration_minutes: number | null;
 is_active: boolean;
 created_by: string | null;
 updated_by: string | null;
 created_at: string;
 updated_at: string;
};

export type InventoryItemRow = {
 id: string;
 sku: string;
 name: string;
 category: string;
 stock_type: 'sale' | 'operation';
 quantity: number;
 unit: string;
 min_stock: number;
 unit_cost: number;
 unit_price: number;
 is_active: boolean;
 created_by: string | null;
 updated_by: string | null;
 created_at: string;
 updated_at: string;
};

export type InventoryMovementRow = {
 id: string;
 inventory_item_id: string;
 movement_type: 'sale' | 'usage' | 'restock' | 'adjustment' | 'loss';
 quantity: number;
 unit_value: number;
 note: string | null;
 reference_type: string | null;
 reference_id: string | null;
 performed_by: string | null;
 created_at: string;
};

export type BusinessDocumentItemRow = {
 id: string;
 document_id: string;
 service_id: string | null;
 description: string;
 details: string | null;
 quantity: number;
 unit_price: number;
 line_total: number;
 created_at: string;
};

export type BusinessDocumentRow = {
 id: string;
 number: string;
 kind: 'invoice' | 'receipt' | 'purchase-order' | 'quotation' | 'letterhead';
 report_category: 'with_vat' | 'without_vat';
 status: string;
 source: 'manual' | 'pos' | 'billing' | 'system';
 title: string;
 issue_date: string;
 due_date: string | null;
 customer_id: string | null;
 party_name: string;
 party_tax_id: string | null;
 party_email: string | null;
 party_phone: string | null;
 party_address: string | null;
 payment_method: string | null;
 vat_enabled: boolean;
 vat_included: boolean;
 vat_rate: number;
 subtotal: number;
 vat_amount: number;
 total: number;
 notes: string | null;
 body: string | null;
 issued_by: string | null;
 created_at: string;
 updated_at: string;
 business_document_items?: BusinessDocumentItemRow[];
};

export type AuditLogRow = {
 id: string;
 module: string;
 action: string;
 entity_type: string;
 entity_id: string | null;
 entity_label: string | null;
 metadata: Record<string, unknown>;
 performed_by: string | null;
 created_at: string;
 user_name?: string;
};

export type CompanySettings = {
 legalName: string;
 brandName: string;
 tagline: string;
 nuit: string;
 phone: string;
 email: string;
 website: string;
 addressLine1: string;
 addressLine2: string;
 country: string;
 bankDetails: string;
 accentColor: string;
 logoDataUrl: string | null;
 defaultVatRate: number;
 defaultVatIncluded: boolean;
};

export type DashboardSnapshot = {
 todayRevenue: number;
 todayVehicles: number;
 todayNewClients: number;
 averageTicket: number;
 weeklyData: Array<{ name: string; revenue: number; customers: number }>;
 recentActivity: Array<{
 id: string;
 label: string;
 client: string;
 service: string;
 status: string;
 value: string;
 date: string;
 payment: string;
 vehicle: string;
 operator: string;
 }>;
 stockHighlights: {
 lowStockCount: number;
 topProducts: Array<{ name: string; quantity: number; amount: number }>;
 slowProducts: Array<{ name: string; quantity: number; currentStock: number }>;
 };
};

const parseMoneyText = (value: string | number | null | undefined) => {
 if (typeof value === 'number') {
 return value;
 }

 if (!value) {
 return 0;
 }

 const normalized = value.replace(',', '.');
 const digitsOnly = normalized.replace(/[^0-9.]/g, '');
 const parsed = Number(digitsOnly);
 return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (value: number) =>
 `${new Intl.NumberFormat('pt-MZ', {
 minimumFractionDigits: 2,
 maximumFractionDigits: 2,
 }).format(value)} MT`;

export const getProfileDisplayName = (profile: Pick<ProfileRow, 'full_name' | 'email'> | null | undefined) =>
 profile?.full_name?.trim() || profile?.email?.split('@')[0] || 'Utilizador';

export const isStaffProfile = (
 profile: Pick<ProfileRow, 'account_type' | 'role' | 'email'> | null | undefined
) =>
 profile?.account_type === 'staff' ||
 profile?.role === 'admin' ||
 profile?.role === 'super_admin' ||
 profile?.email === 'geral@carwash46.com';

export const isSuperAdminProfile = (
 profile: Pick<ProfileRow, 'account_type' | 'role' | 'email'> | null | undefined
) =>
 profile?.role === 'super_admin' || profile?.email === 'geral@carwash46.com';

export async function markCurrentProfileLogin(_profileId: string) {
 return Promise.resolve();
}

async function loadProfilesMap() {
 const profiles = await apiRequest<ProfileRow[]>('admin.profiles.list');
 return new Map(profiles.map((profile) => [profile.id, profile]));
}

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
 const today = new Date();
 const fromDate = format(subDays(today, 6), 'yyyy-MM-dd');
 const todayIsoDate = format(today, 'yyyy-MM-dd');

 const [appointments, profiles, documents, inventorySnapshot] = await Promise.all([
 apiRequest<AppointmentRow[]>('admin.appointments.list'),
 apiRequest<ProfileRow[]>('admin.profiles.list'),
 apiRequest<BusinessDocumentRow[]>('admin.documents.list'),
 apiRequest<{ items: InventoryItemRow[]; movements: InventoryMovementRow[] }>('admin.inventory.list'),
 ]);
 const profilesMap = new Map(profiles.map((p) => [p.id, p]));
 const inventoryItems = inventorySnapshot.items ?? [];
 const inventoryMovements = inventorySnapshot.movements ?? [];

 const completedToday = appointments.filter(
 (appointment) =>
 appointment.appointment_date === todayIsoDate && appointment.status === 'completed'
 );

 const todayRevenueFromDocs = documents
 .filter(
 (document) =>
 document.issue_date === todayIsoDate &&
 (document.kind === 'invoice' || document.kind === 'receipt')
 )
 .reduce((total, document) => total + parseMoneyText(document.total), 0);

 const todayRevenueFromAppointments = completedToday.reduce(
 (total, appointment) => total + parseMoneyText(appointment.service_price_text),
 0
 );

 const todayRevenue = todayRevenueFromDocs > 0 ? todayRevenueFromDocs : todayRevenueFromAppointments;
 const todayVehicles = completedToday.length;
 const averageTicket = todayVehicles > 0 ? todayRevenue / todayVehicles : 0;

 const weeklyData = Array.from({ length: 7 }, (_, index) => {
 const day = subDays(today, 6 - index);
 const isoDay = format(day, 'yyyy-MM-dd');
 const dailyAppointments = appointments.filter((appointment) => appointment.appointment_date === isoDay);
 const dailyCompleted = dailyAppointments.filter((appointment) => appointment.status === 'completed');
 const dailyRevenueFromDocs = documents
 .filter(
 (document) =>
 document.issue_date === isoDay &&
 (document.kind === 'invoice' || document.kind === 'receipt')
 )
 .reduce((total, document) => total + parseMoneyText(document.total), 0);
 const dailyRevenueFromAppointments = dailyCompleted.reduce(
 (total, appointment) => total + parseMoneyText(appointment.service_price_text),
 0
 );

 return {
 name: format(day, 'EE', { locale: ptBR }),
 revenue: dailyRevenueFromDocs > 0 ? dailyRevenueFromDocs : dailyRevenueFromAppointments,
 customers: dailyAppointments.length,
 };
 });

 const recentActivity = appointments.slice(0, 10).map((appointment) => {
 const profile = profilesMap.get(appointment.customer_id) ?? null;
 const operator = appointment.customer_id ? getProfileDisplayName(profile) : 'Sistema';

 return {
 id: `#${appointment.id.slice(0, 8)}`,
 label: appointment.id,
 client: appointment.contact_name || getProfileDisplayName(profile),
 service: appointment.service_name,
 status:
 appointment.status === 'completed'
 ? 'Finalizado'
 : appointment.status === 'confirmed'
 ? 'Confirmado'
 : appointment.status === 'pending'
 ? 'Pendente'
 : 'Cancelado',
 value: appointment.service_price_text,
 date: `${format(parseISO(appointment.created_at), 'dd MM yy')} ${appointment.appointment_time}`,
 payment: 'A validar',
 vehicle: `${appointment.vehicle_make} ${appointment.vehicle_model} (${appointment.vehicle_plate})`,
 operator,
 };
 });

 const lowStockCount = inventoryItems.filter((item) => item.quantity <= item.min_stock).length;
 const movementTotals = new Map<string, { quantity: number; amount: number }>();

 inventoryMovements.forEach((movement) => {
 const current = movementTotals.get(movement.inventory_item_id) ?? { quantity: 0, amount: 0 };
 const quantity = movement.movement_type === 'restock' ? 0 : Math.abs(movement.quantity);
 const amount = quantity * parseMoneyText(movement.unit_value);
 movementTotals.set(movement.inventory_item_id, {
 quantity: current.quantity + quantity,
 amount: current.amount + amount,
 });
 });

 const topProducts = inventoryItems
 .map((item) => ({
 name: item.name,
 quantity: movementTotals.get(item.id)?.quantity ?? 0,
 amount: movementTotals.get(item.id)?.amount ?? 0,
 }))
 .filter((item) => item.quantity > 0)
 .sort((left, right) => right.quantity - left.quantity)
 .slice(0, 5);

 const slowProducts = inventoryItems
 .map((item) => ({
 name: item.name,
 quantity: movementTotals.get(item.id)?.quantity ?? 0,
 currentStock: item.quantity,
 }))
 .sort((left, right) => left.quantity - right.quantity)
 .slice(0, 5);

 return {
 todayRevenue,
 todayVehicles,
 todayNewClients: profiles.filter((profile) => {
 const createdAt = new Date(profile.created_at).toISOString();
 return (
 profile.account_type === 'customer' &&
 createdAt >= startOfDay(today).toISOString() &&
 createdAt <= endOfDay(today).toISOString()
 );
 }).length,
 averageTicket,
 weeklyData,
 recentActivity,
 stockHighlights: {
 lowStockCount,
 topProducts,
 slowProducts,
 },
 };
}

export async function fetchCatalogServices() {
 return apiRequest<ServiceCatalogRow[]>('admin.service_catalog.list');
}

export async function fetchInventoryItems() {
 return apiRequest<{ items: InventoryItemRow[]; movements: InventoryMovementRow[] }>(
 'admin.inventory.list'
 );
}

export async function fetchBusinessDocuments() {
 return apiRequest<BusinessDocumentRow[]>('admin.documents.list');
}

export async function fetchAuditLogs() {
 const [logs, profilesMap] = await Promise.all([
 apiRequest<AuditLogRow[]>('admin.audit_logs.list'),
 loadProfilesMap(),
 ]);

 return logs.map((log) => ({
 ...log,
 user_name:
 log.user_name ||
 getProfileDisplayName(log.performed_by ? profilesMap.get(log.performed_by) ?? null : null),
 }));
}

export async function fetchSettings() {
 return apiRequest<{ company: CompanySettings; audit_logs: AuditLogRow[] }>('admin.settings.get');
}

export async function saveSettings(company: CompanySettings) {
 return apiRequest<CompanySettings>('admin.settings.save', { company });
}

export async function fetchStaffProfiles() {
 return apiRequest<ProfileRow[]>('admin.staff.list');
}

export async function fetchAgendaAppointments() {
 const [appointments, profilesMap] = await Promise.all([
 apiRequest<AppointmentRow[]>('admin.appointments.list'),
 loadProfilesMap(),
 ]);

 return appointments.map((appointment) => ({
 ...appointment,
 customer_name:
 appointment.contact_name ||
 getProfileDisplayName(profilesMap.get(appointment.customer_id) ?? null),
 }));
}

export async function updateAppointmentStatus(
 id: string,
 status: AppointmentRow['status']
) {
 return apiRequest<AppointmentRow>('admin.appointment.status', { id, status });
}

export async function fetchFinanceSnapshot() {
 const [documents, appointments] = await Promise.all([
 fetchBusinessDocuments(),
 fetchAgendaAppointments(),
 ]);

 const financeRows =
 documents.length > 0
 ? documents
 .filter((document) => document.kind !== 'letterhead' && document.kind !== 'quotation')
 .map((document) => ({
 id: document.number,
 description: document.title || document.party_name,
 type:
 document.kind === 'purchase-order'
 ? ('expense' as const)
 : ('income' as const),
 amount: parseMoneyText(document.total),
 date: document.issue_date,
 status: document.status,
 party: document.party_name,
 }))
 : appointments
 .filter((appointment) => appointment.status === 'completed')
 .map((appointment) => ({
 id: appointment.id,
 description: `${appointment.service_name} - ${appointment.contact_name}`,
 type: 'income' as const,
 amount: parseMoneyText(appointment.service_price_text),
 date: appointment.appointment_date,
 status: 'Concluido',
 party: appointment.contact_name,
 }));

 const totalIncome = financeRows
 .filter((row) => row.type === 'income')
 .reduce((sum, row) => sum + row.amount, 0);
 const totalExpense = financeRows
 .filter((row) => row.type === 'expense')
 .reduce((sum, row) => sum + row.amount, 0);

 return {
 rows: financeRows,
 totalIncome,
 totalExpense,
 netProfit: totalIncome - totalExpense,
 formatMoney,
 };
}

export async function saveCatalogService(payload: Record<string, unknown>) {
 return apiRequest<ServiceCatalogRow>('admin.service_catalog.save', payload);
}

export async function deleteCatalogService(id: string) {
 return apiRequest<{ deleted: boolean }>('admin.service_catalog.delete', { id });
}

export async function saveInventoryItem(payload: Record<string, unknown>) {
 return apiRequest<{ items: InventoryItemRow[]; movements: InventoryMovementRow[] }>(
 'admin.inventory.save',
 payload
 );
}

export async function deleteInventoryItem(id: string) {
 return apiRequest<{ deleted: boolean }>('admin.inventory.delete', { id });
}

export async function adjustInventoryItemQuantity(id: string, delta: number) {
 return apiRequest<{ items: InventoryItemRow[]; movements: InventoryMovementRow[] }>(
 'admin.inventory.adjust',
 { id, delta }
 );
}

export async function createBusinessDocument(payload: Record<string, unknown>) {
 return apiRequest<BusinessDocumentRow>('admin.documents.create', payload);
}

export async function saveStaffProfile(payload: Record<string, unknown>) {
 return apiRequest<ProfileRow>('admin.staff.update', payload);
}

export async function createStaffProfile(payload: Record<string, unknown>) {
 return apiRequest<ProfileRow>('admin.staff.create', payload);
}
