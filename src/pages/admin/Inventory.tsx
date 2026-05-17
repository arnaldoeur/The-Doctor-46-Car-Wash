import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
 AlertTriangle,
 DollarSign,
 Edit2,
 Loader2,
 Package,
 Plus,
 Search,
 ShoppingCart,
 Trash2,
 X,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cn } from '../../lib/utils';
import {
 adjustInventoryItemQuantity,
 deleteInventoryItem,
 fetchInventoryItems,
 saveInventoryItem,
 type InventoryItemRow,
 type InventoryMovementRow,
} from '../../lib/adminData';
import { useAuth } from '../../providers/AuthProvider';
import { useLanguage } from '../../providers/LanguageProvider';

type InventoryDraft = {
 id: string | null;
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
};

const emptyDraft: InventoryDraft = {
 id: null,
 sku: '',
 name: '',
 category: 'Quimicos',
 stock_type: 'operation',
 quantity: 0,
 unit: 'un',
 min_stock: 0,
 unit_cost: 0,
 unit_price: 0,
 is_active: true,
};

const formatMoney = (value: number) =>
 `${new Intl.NumberFormat('pt-MZ', {
 minimumFractionDigits: 2,
 maximumFractionDigits: 2,
 }).format(value)} MT`;

export default function Inventory() {
 const { profile } = useAuth();
 const { t } = useLanguage();
 const [items, setItems] = useState<InventoryItemRow[]>([]);
 const [movements, setMovements] = useState<InventoryMovementRow[]>([]);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [search, setSearch] = useState('');
 const [activeStockTab, setActiveStockTab] = useState<'all' | 'sale' | 'operation'>('all');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [draft, setDraft] = useState<InventoryDraft>(emptyDraft);
 const [message, setMessage] = useState('');
 const [errorMessage, setErrorMessage] = useState('');

 const loadInventory = async () => {
 try {
 setLoading(true);
 setErrorMessage('');
 const data = await fetchInventoryItems();
 setItems(data.items);
 setMovements(data.movements);
 } catch (error) {
 console.error('Failed to load inventory data', error);
 setErrorMessage(t('admin.inventory.error_load'));
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 void loadInventory();
 }, []);

 const filteredInventory = useMemo(() => {
 return items.filter((item) => {
 const matchesSearch =
 item.name.toLowerCase().includes(search.toLowerCase()) ||
 item.category.toLowerCase().includes(search.toLowerCase()) ||
 item.sku.toLowerCase().includes(search.toLowerCase());
 const matchesTab = activeStockTab === 'all' || item.stock_type === activeStockTab;
 return matchesSearch && matchesTab;
 });
 }, [activeStockTab, items, search]);

 const saleStockCount = items.filter((item) => item.stock_type === 'sale').length;
 const operationStockCount = items.filter((item) => item.stock_type === 'operation').length;
 const totalValue = items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);

 const movementMap = useMemo(() => {
 const map = new Map<string, { outflow: number; sales: number }>();

 movements.forEach((movement) => {
 const current = map.get(movement.inventory_item_id) ?? { outflow: 0, sales: 0 };
 const quantity =
 movement.movement_type === 'restock' ? 0 : Math.abs(Number(movement.quantity) || 0);

 map.set(movement.inventory_item_id, {
 outflow: current.outflow + quantity,
 sales:
 current.sales + (movement.movement_type === 'sale' ? quantity : 0),
 });
 });

 return map;
 }, [movements]);

 const stockPerformance = items
 .map((item) => ({
 name: item.name,
 sold: movementMap.get(item.id)?.sales ?? 0,
 outflow: movementMap.get(item.id)?.outflow ?? 0,
 }))
 .sort((left, right) => right.outflow - left.outflow)
 .slice(0, 6);

 const lowRotation = items
 .map((item) => ({
 name: item.name,
 sold: movementMap.get(item.id)?.sales ?? 0,
 stock: item.quantity,
 }))
 .sort((left, right) => left.sold - right.sold)
 .slice(0, 5);

 const openModal = (item?: InventoryItemRow) => {
 if (item) {
 setDraft({
 id: item.id,
 sku: item.sku,
 name: item.name,
 category: item.category,
 stock_type: item.stock_type,
 quantity: item.quantity,
 unit: item.unit,
 min_stock: item.min_stock,
 unit_cost: item.unit_cost,
 unit_price: item.unit_price,
 is_active: item.is_active,
 });
 } else {
 setDraft(emptyDraft);
 }

 setIsModalOpen(true);
 };

 const closeModal = () => {
 setIsModalOpen(false);
 setDraft(emptyDraft);
 };

 const updateDraft = <K extends keyof InventoryDraft>(field: K, value: InventoryDraft[K]) => {
 setDraft((current) => ({ ...current, [field]: value }));
 };

 const handleSave = async (event: FormEvent) => {
 event.preventDefault();

 try {
 setSaving(true);
 setMessage('');
 setErrorMessage('');

 const payload = {
 id: draft.id ?? undefined,
 sku: draft.sku.trim().toUpperCase(),
 name: draft.name.trim(),
 category: draft.category.trim(),
 stock_type: draft.stock_type,
 quantity: draft.quantity,
 unit: draft.unit.trim(),
 min_stock: draft.min_stock,
 unit_cost: draft.unit_cost,
 unit_price: draft.unit_price,
 is_active: draft.is_active,
 updated_by: profile?.id ?? null,
 created_by: draft.id ? undefined : profile?.id ?? null,
 };

 await saveInventoryItem(payload);

 await loadInventory();
 setMessage(draft.id ? t('admin.inventory.success_update') : t('admin.inventory.success_create'));
 closeModal();
 } catch (error) {
 console.error('Failed to save inventory item', error);
 setErrorMessage(
 error instanceof Error
 ? error.message
 : t('admin.inventory.error_save')
 );
 } finally {
 setSaving(false);
 }
 };

 const handleDelete = async (itemId: string) => {
 if (!window.confirm(t('admin.inventory.confirm_delete'))) {
 return;
 }

 try {
 setSaving(true);
 setMessage('');
 setErrorMessage('');
 await deleteInventoryItem(itemId);

 await loadInventory();
 setMessage(t('admin.inventory.success_delete'));
 } catch (error) {
 console.error('Failed to delete inventory item', error);
 setErrorMessage(
 error instanceof Error ? error.message : t('admin.inventory.error_delete')
 );
 } finally {
 setSaving(false);
 }
 };

 const adjustQuantity = async (item: InventoryItemRow, delta: number) => {
 try {
 setSaving(true);
 setMessage('');
 setErrorMessage('');
 await adjustInventoryItemQuantity(item.id, delta);
 await loadInventory();
 } catch (error) {
 console.error('Failed to adjust inventory quantity', error);
 setErrorMessage(
 error instanceof Error
 ? error.message
 : t('admin.inventory.error_adjust')
 );
 } finally {
 setSaving(false);
 }
 };

 return (
 <div className="space-y-8">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <h1 className="mb-2 text-3xl font-bold font-display">{t('admin.inventory.title')}</h1>
 <p className="text-gray-400">
 {t('admin.inventory.sub')}
 </p>
 </div>
 <button
 type="button"
 onClick={() => openModal()}
 className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-semibold text-white transition-all hover:bg-primary-hover"
 >
 <Plus className="h-5 w-5" />
 {t('admin.inventory.new_product')}
 </button>
 </div>

 {message ? (
 <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
 {message}
 </div>
 ) : null}
 {errorMessage ? (
 <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
 {errorMessage}
 </div>
 ) : null}

 <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
 <StatCard
 icon={ShoppingCart}
 label={t('admin.inventory.stat_sale')}
 value={`${saleStockCount} ${t('admin.pos.items', 'itens')}`}
 iconClassName="text-blue-400"
 panelClassName="bg-blue-500/10"
 />
 <StatCard
 icon={Package}
 label={t('admin.inventory.stat_operation')}
 value={`${operationStockCount} ${t('admin.pos.items', 'itens')}`}
 iconClassName="text-purple-400"
 panelClassName="bg-purple-500/10"
 />
 <StatCard
 icon={DollarSign}
 label={t('admin.inventory.stat_total_value')}
 value={formatMoney(totalValue)}
 iconClassName="text-emerald-400"
 panelClassName="bg-emerald-500/10"
 />
 </div>

 <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
 <div className="rounded-2xl border border-white/10 bg-dark p-6">
 <h2 className="mb-6 text-xl font-bold font-display">{t('admin.inventory.chart_title')}</h2>
 <div className="h-80">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={stockPerformance}>
 <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
 <XAxis dataKey="name" stroke="#8A8A8A" axisLine={false} tickLine={false} />
 <YAxis stroke="#8A8A8A" axisLine={false} tickLine={false} />
 <Tooltip
 contentStyle={{
 backgroundColor: '#0B0B0B',
 border: '1px solid rgba(255,255,255,0.08)',
 borderRadius: '14px',
 }}
 />
 <Bar dataKey="sold" fill="#0A5CFF" radius={[8, 8, 0, 0]} name={t('admin.inventory.chart_sold')} />
 <Bar dataKey="outflow" fill="#31C48D" radius={[8, 8, 0, 0]} name={t('admin.inventory.chart_outflow')} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div className="rounded-2xl border border-white/10 bg-dark p-6">
 <div className="mb-5 flex items-center gap-3">
 <AlertTriangle className="h-5 w-5 text-amber-400" />
 <div>
 <h2 className="text-xl font-bold font-display">{t('admin.inventory.low_rotation_title')}</h2>
 <p className="text-sm text-gray-400">{t('admin.inventory.low_rotation_sub')}</p>
 </div>
 </div>

 <div className="space-y-3">
 {lowRotation.length > 0 ? (
 lowRotation.map((item) => (
 <div
 key={item.name}
 className="flex items-center justify-between rounded-2xl border border-white/10 bg-darker/70 px-4 py-3"
 >
 <div>
 <div className="font-medium text-white">{item.name}</div>
 <div className="text-sm text-gray-500">{item.sold} {t('admin.inventory.low_rotation_outflows', 'saídas registadas')}</div>
 </div>
 <div className="text-sm text-gray-300">
 {t('admin.inventory.low_rotation_stock', 'Stock atual')} <span className="font-semibold text-white">{item.stock}</span>
 </div>
 </div>
 ))
 ) : (
 <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-gray-500">
 {t('admin.inventory.low_rotation_empty')}
 </div>
 )}
 </div>
 </div>
 </div>

 <div className="overflow-hidden rounded-2xl border border-white/10 bg-dark">
 <div className="flex flex-col gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex gap-2">
 {(['all', 'sale', 'operation'] as const).map((tab) => (
 <button
 key={tab}
 type="button"
 onClick={() => setActiveStockTab(tab)}
 className={cn(
 'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
 activeStockTab === tab
 ? 'bg-primary text-white'
 : 'text-gray-400 hover:bg-white/5 hover:text-white'
 )}
 >
 {tab === 'all' ? t('admin.inventory.tab_all') : tab === 'sale' ? t('admin.inventory.tab_sale') : t('admin.inventory.tab_operation')}
 </button>
 ))}
 </div>

 <div className="relative w-full sm:max-w-md">
 <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
 <input
 type="text"
 placeholder={t('admin.inventory.search_placeholder')}
 value={search}
 onChange={(event) => setSearch(event.target.value)}
 className="w-full rounded-xl border border-white/10 bg-darker py-2.5 pl-12 pr-4 text-white focus:border-primary focus:outline-none"
 />
 </div>
 </div>

 {loading ? (
 <div className="flex min-h-[300px] items-center justify-center">
 <Loader2 className="h-8 w-8 animate-spin text-primary" />
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full min-w-[940px] border-collapse text-left text-sm">
 <thead className="bg-darker/50 text-gray-400">
 <tr className="border-b border-white/10">
 <th className="p-4 font-medium">{t('admin.inventory.th_sku')}</th>
 <th className="p-4 font-medium">{t('admin.inventory.th_product')}</th>
 <th className="p-4 font-medium">{t('admin.inventory.th_type')}</th>
 <th className="p-4 font-medium">{t('admin.inventory.th_category')}</th>
 <th className="p-4 font-medium">{t('admin.inventory.th_qty')}</th>
 <th className="p-4 font-medium">{t('admin.inventory.th_min')}</th>
 <th className="p-4 font-medium">{t('admin.inventory.th_cost')}</th>
 <th className="p-4 font-medium text-right">{t('admin.inventory.th_actions')}</th>
 </tr>
 </thead>
 <tbody>
 {filteredInventory.map((item) => {
 const isLowStock = item.quantity <= item.min_stock;

 return (
 <tr key={item.id} className="border-b border-white/5 transition-colors hover:bg-white/5">
 <td className="p-4 font-mono text-gray-500">{item.sku}</td>
 <td className="p-4 font-medium text-white">{item.name}</td>
 <td className="p-4">
 <span
 className={cn(
 'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
 item.stock_type === 'sale'
 ? 'border-blue-500/20 bg-blue-500/10 text-blue-400'
 : 'border-purple-500/20 bg-purple-500/10 text-purple-400'
 )}
 >
 {item.stock_type === 'sale' ? t('admin.inventory.tab_sale') : t('admin.inventory.tab_operation')}
 </span>
 </td>
 <td className="p-4 text-gray-400">{item.category}</td>
 <td className="p-4">
 <div className="flex items-center gap-3">
 <div className="flex items-center rounded-lg border border-white/10 bg-darker p-1">
 <button
 type="button"
 onClick={() => void adjustQuantity(item, -1)}
 className="rounded p-1 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
 >
 -
 </button>
 <span
 className={cn(
 'w-12 text-center text-lg font-bold',
 isLowStock ? 'text-amber-400' : 'text-white'
 )}
 >
 {item.quantity}
 </span>
 <button
 type="button"
 onClick={() => void adjustQuantity(item, 1)}
 className="rounded p-1 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
 >
 +
 </button>
 </div>
 <span className="text-xs font-medium uppercase text-gray-500">{item.unit}</span>
 {isLowStock ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : null}
 </div>
 </td>
 <td className="p-4 text-gray-400">
 {item.min_stock} {item.unit}
 </td>
 <td className="p-4 text-gray-300">{formatMoney(item.unit_cost)}</td>
 <td className="p-4">
 <div className="flex items-center justify-end gap-2">
 <button
 type="button"
 onClick={() => openModal(item)}
 className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
 >
 <Edit2 className="h-4 w-4" />
 </button>
 <button
 type="button"
 onClick={() => void handleDelete(item.id)}
 className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
 >
 <Trash2 className="h-4 w-4" />
 </button>
 </div>
 </td>
 </tr>
 );
 })}
 {filteredInventory.length === 0 ? (
 <tr>
 <td colSpan={8} className="p-8 text-center text-gray-500">
 {t('admin.inventory.table_empty')}
 </td>
 </tr>
 ) : null}
 </tbody>
 </table>
 </div>
 )}
 </div>

 {isModalOpen ? (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
 <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-darker p-8 shadow-2xl">
 <button
 type="button"
 onClick={closeModal}
 className="absolute right-6 top-6 text-gray-400 transition-colors hover:text-white"
 >
 <X className="h-6 w-6" />
 </button>

 <h2 className="mb-6 text-2xl font-bold font-display">
 {draft.id ? t('admin.inventory.modal_edit') : t('admin.inventory.modal_add')}
 </h2>

 <form onSubmit={handleSave} noValidate className="space-y-4">
 <Field label="SKU">
 <input
 value={draft.sku}
 onChange={(event) => updateDraft('sku', event.target.value)}
 className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white focus:border-primary focus:outline-none"
 />
 </Field>
 <Field label={t('admin.inventory.modal_name')}>
 <input
 value={draft.name}
 onChange={(event) => updateDraft('name', event.target.value)}
 className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white focus:border-primary focus:outline-none"
 />
 </Field>

 <div className="grid grid-cols-2 gap-4">
 <Field label={t('admin.inventory.th_type')}>
 <select
 value={draft.stock_type}
 onChange={(event) => updateDraft('stock_type', event.target.value as InventoryDraft['stock_type'])}
 className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white focus:border-primary focus:outline-none"
 >
 <option value="operation">{t('admin.inventory.tab_operation')}</option>
 <option value="sale">{t('admin.inventory.tab_sale')}</option>
 </select>
 </Field>
 <Field label={t('admin.inventory.th_category')}>
 <input
 value={draft.category}
 onChange={(event) => updateDraft('category', event.target.value)}
 className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white focus:border-primary focus:outline-none"
 />
 </Field>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <Field label={t('admin.inventory.th_qty')}>
 <input
 type="number"
 min="0"
 step="0.01"
 value={draft.quantity}
 onChange={(event) => updateDraft('quantity', Number(event.target.value))}
 className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white focus:border-primary focus:outline-none"
 />
 </Field>
 <Field label={t('admin.inventory.modal_unit')}>
 <input
 value={draft.unit}
 onChange={(event) => updateDraft('unit', event.target.value)}
 className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white focus:border-primary focus:outline-none"
 />
 </Field>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <Field label={t('admin.inventory.modal_min')}>
 <input
 type="number"
 min="0"
 step="0.01"
 value={draft.min_stock}
 onChange={(event) => updateDraft('min_stock', Number(event.target.value))}
 className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white focus:border-primary focus:outline-none"
 />
 </Field>
 <Field label={t('admin.inventory.modal_cost')}>
 <input
 type="number"
 min="0"
 step="0.01"
 value={draft.unit_cost}
 onChange={(event) => updateDraft('unit_cost', Number(event.target.value))}
 className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white focus:border-primary focus:outline-none"
 />
 </Field>
 </div>

 <Field label={t('admin.inventory.modal_price')}>
 <input
 type="number"
 min="0"
 step="0.01"
 value={draft.unit_price}
 onChange={(event) => updateDraft('unit_price', Number(event.target.value))}
 className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white focus:border-primary focus:outline-none"
 />
 </Field>

 <label className="inline-flex items-center gap-3 text-sm text-gray-300">
 <input
 type="checkbox"
 checked={draft.is_active}
 onChange={(event) => updateDraft('is_active', event.target.checked)}
 className="h-4 w-4 rounded border-white/10 bg-dark text-primary focus:ring-primary"
 />
 {t('admin.inventory.modal_active')}
 </label>

 <button
 type="submit"
 disabled={saving}
 className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
 >
 {saving ? t('admin.inventory.modal_saving') : draft.id ? t('admin.inventory.modal_save_changes') : t('admin.inventory.modal_add')}
 </button>
 </form>
 </div>
 </div>
 ) : null}
 </div>
 );
}

function StatCard({
 icon: Icon,
 label,
 value,
 iconClassName,
 panelClassName,
}: {
 icon: typeof ShoppingCart;
 label: string;
 value: string;
 iconClassName: string;
 panelClassName: string;
}) {
 return (
 <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-dark p-6">
 <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', panelClassName)}>
 <Icon className={cn('h-6 w-6', iconClassName)} />
 </div>
 <div>
 <p className="text-sm font-medium text-gray-400">{label}</p>
 <p className="text-2xl font-bold font-display text-white">{value}</p>
 </div>
 </div>
 );
}

function Field({
 label,
 children,
}: {
 label: string;
 children: ReactNode;
}) {
 return (
 <label className="block space-y-2">
 <span className="text-sm font-medium text-gray-400">{label}</span>
 {children}
 </label>
 );
}
