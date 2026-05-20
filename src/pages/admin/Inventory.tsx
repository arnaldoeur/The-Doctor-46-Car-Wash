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
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Minus,
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
import { motion, AnimatePresence } from 'framer-motion';

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
  category: 'Químicos',
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
      const quantity = movement.movement_type === 'restock' ? 0 : Math.abs(Number(movement.quantity) || 0);
      map.set(movement.inventory_item_id, {
        outflow: current.outflow + quantity,
        sales: current.sales + (movement.movement_type === 'sale' ? quantity : 0),
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
      setTimeout(() => setMessage(''), 4000);
      closeModal();
    } catch (error) {
      console.error('Failed to save inventory item', error);
      setErrorMessage(error instanceof Error ? error.message : t('admin.inventory.error_save'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm(t('admin.inventory.confirm_delete'))) return;
    try {
      setSaving(true);
      setMessage('');
      setErrorMessage('');
      await deleteInventoryItem(itemId);
      await loadInventory();
      setMessage(t('admin.inventory.success_delete'));
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      console.error('Failed to delete inventory item', error);
      setErrorMessage(error instanceof Error ? error.message : t('admin.inventory.error_delete'));
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
      setErrorMessage(error instanceof Error ? error.message : t('admin.inventory.error_adjust'));
    } finally {
      setSaving(false);
    }
  };

  const lowStockItems = useMemo(() => {
    return items.filter((item) => item.is_active && item.quantity <= item.min_stock);
  }, [items]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111111]/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} className="text-white font-semibold text-sm flex items-center justify-between gap-4 mb-1">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                <span className="text-gray-300">{p.name}</span>
              </span>
              <span>{p.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 border-t-2 border-primary border-solid rounded-full animate-spin"></div>
          <Loader2 className="h-6 w-6 animate-spin text-white z-10" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-2">
        <div>
          <h1 className="mb-2 text-2xl font-bold font-display tracking-tight text-white">{t('admin.inventory.title')}</h1>
          <p className="text-sm text-gray-400">
            {t('admin.inventory.sub')}
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition-all hover:bg-primary-hover shadow-[0_0_15px_rgba(0,71,255,0.4)] hover:shadow-[0_0_25px_rgba(0,71,255,0.6)] active:scale-95"
        >
          <Plus className="h-4 w-4" />
          {t('admin.inventory.new_product')}
        </button>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200 flex items-center gap-3 shadow-lg">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            {message}
          </motion.div>
        )}
        {errorMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200 flex items-center gap-3 shadow-lg">
            <AlertCircle className="h-5 w-5 text-rose-400" />
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard
          icon={ShoppingCart}
          label={t('admin.inventory.stat_sale')}
          value={`${saleStockCount} items`}
          iconClassName="text-blue-400"
          panelClassName="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/20"
        />
        <StatCard
          icon={Package}
          label={t('admin.inventory.stat_operation')}
          value={`${operationStockCount} items`}
          iconClassName="text-amber-400"
          panelClassName="bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-amber-500/20"
        />
        <StatCard
          icon={DollarSign}
          label={t('admin.inventory.stat_total_value')}
          value={formatMoney(totalValue)}
          iconClassName="text-emerald-400"
          panelClassName="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border-emerald-500/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="rounded-[2rem] border border-white/[0.04] bg-[#0F0F0F] p-6 lg:p-8 shadow-2xl"
        >
          <div className="flex items-center gap-2 mb-8">
            <TrendingUp className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-bold font-display text-white/90">{t('admin.inventory.chart_title')}</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockPerformance} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#666" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} dy={10} />
                <YAxis stroke="#666" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} content={<CustomTooltip />} />
                <Bar dataKey="sold" fill="#0047FF" radius={[6, 6, 0, 0]} name="Vendas (Sales)" maxBarSize={30} />
                <Bar dataKey="outflow" fill="#10B981" radius={[6, 6, 0, 0]} name="Saídas (Outflow)" maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="flex-1 rounded-[2rem] border border-white/[0.04] bg-[#0F0F0F] p-6 shadow-2xl relative overflow-hidden"
          >
            {lowStockItems.length > 0 && <div className="absolute top-0 inset-x-0 h-1 bg-rose-500/50" />}
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 shrink-0">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <h2 className="text-base font-bold font-display text-white/90">Low Stock Alerts</h2>
                <p className="text-xs text-gray-500">Products that need immediate restock</p>
              </div>
            </div>
            
            <div className="space-y-2.5">
              {lowStockItems.length > 0 ? (
                lowStockItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-rose-500/10 bg-rose-500/5 px-4 py-3">
                    <span className="font-semibold text-rose-200 text-sm truncate pr-2">{item.name}</span>
                    <span className="text-rose-400 font-bold text-xs shrink-0 bg-rose-500/10 px-2 py-1 rounded-lg">
                      {item.quantity} {item.unit} left
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-4 py-6 text-center font-medium">
                  ✓ All stock levels are adequate
                </div>
              )}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-1 rounded-[2rem] border border-white/[0.04] bg-[#0F0F0F] p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
                <Package className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-base font-bold font-display text-white/90">{t('admin.inventory.low_rotation_title')}</h2>
                <p className="text-xs text-gray-500">{t('admin.inventory.low_rotation_sub')}</p>
              </div>
            </div>
            
            <div className="space-y-2.5">
              {lowRotation.length > 0 ? (
                lowRotation.map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-[#141414] px-4 py-3">
                    <div className="min-w-0 pr-4">
                      <div className="font-semibold text-white/90 text-sm truncate">{item.name}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-0.5">
                        {item.sold} outflows
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 shrink-0">
                      Stock: <span className="font-bold text-white">{item.stock}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-gray-500">
                  {t('admin.inventory.low_rotation_empty')}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
        className="overflow-hidden rounded-[2rem] border border-white/[0.04] bg-[#0F0F0F] shadow-2xl"
      >
        <div className="flex flex-col gap-4 border-b border-white/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between bg-[#141414]">
          <div className="flex rounded-lg bg-[#0A0A0A] p-1 border border-white/[0.05]">
            {(['all', 'sale', 'operation'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveStockTab(tab)}
                className={cn(
                  'rounded-md px-4 py-2 text-xs font-bold transition-all',
                  activeStockTab === tab
                    ? 'bg-[#222] text-white shadow-sm border border-white/[0.05]'
                    : 'text-gray-500 hover:text-white'
                )}
              >
                {tab === 'all' ? t('admin.inventory.tab_all') : tab === 'sale' ? t('admin.inventory.tab_sale') : t('admin.inventory.tab_operation')}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:max-w-xs group">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder={t('admin.inventory.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/[0.05] bg-[#0A0A0A] py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[940px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.04] bg-[#0A0A0A]/50">
                <th className="p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">{t('admin.inventory.th_sku')}</th>
                <th className="p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">{t('admin.inventory.th_product')}</th>
                <th className="p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">{t('admin.inventory.th_type')}</th>
                <th className="p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">{t('admin.inventory.th_category')}</th>
                <th className="p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">{t('admin.inventory.th_qty')}</th>
                <th className="p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">{t('admin.inventory.th_min')}</th>
                <th className="p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">{t('admin.inventory.th_cost')}</th>
                <th className="p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">{t('admin.inventory.th_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filteredInventory.map((item) => {
                const isLowStock = item.quantity <= item.min_stock;
                return (
                  <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-xs text-gray-500 bg-white/[0.03] px-2 py-1 rounded-md border border-white/[0.05]">{item.sku}</span>
                    </td>
                    <td className="p-4 font-semibold text-white/90">{item.name}</td>
                    <td className="p-4">
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest',
                          item.stock_type === 'sale'
                            ? 'border-blue-500/20 bg-blue-500/10 text-blue-400'
                            : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                        )}
                      >
                        {item.stock_type === 'sale' ? t('admin.inventory.tab_sale') : t('admin.inventory.tab_operation')}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-xs font-medium">{item.category}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center rounded-xl border border-white/[0.05] bg-[#0A0A0A] p-0.5 shadow-inner">
                          <button
                            disabled={saving}
                            onClick={() => adjustQuantity(item, -1)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className={cn('w-10 text-center text-sm font-bold', isLowStock ? 'text-rose-400' : 'text-white')}>
                            {item.quantity}
                          </span>
                          <button
                            disabled={saving}
                            onClick={() => adjustQuantity(item, 1)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{item.unit}</span>
                        {isLowStock && <AlertTriangle className="h-4 w-4 text-rose-500" />}
                      </div>
                    </td>
                    <td className="p-4 text-gray-500 font-medium">
                      {item.min_stock} {item.unit}
                    </td>
                    <td className="p-4 text-gray-300 font-medium">{formatMoney(item.unit_cost)}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openModal(item)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          disabled={saving}
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    {t('admin.inventory.table_empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-lg rounded-[2rem] border border-white/[0.05] bg-[#0A0A0A] p-8 shadow-2xl my-8"
            >
              <button
                onClick={closeModal}
                className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <h2 className="mb-6 text-2xl font-bold font-display text-white tracking-tight">
                {draft.id ? t('admin.inventory.modal_edit') : t('admin.inventory.modal_add')}
              </h2>

              <form onSubmit={handleSave} noValidate className="space-y-4">
                <Field label="SKU (Code)">
                  <input
                    value={draft.sku}
                    onChange={(e) => updateDraft('sku', e.target.value)}
                    className="w-full rounded-xl border border-white/[0.05] bg-[#141414] px-4 py-3 text-sm font-mono text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </Field>
                <Field label={t('admin.inventory.modal_name')}>
                  <input
                    value={draft.name}
                    onChange={(e) => updateDraft('name', e.target.value)}
                    className="w-full rounded-xl border border-white/[0.05] bg-[#141414] px-4 py-3 text-sm text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label={t('admin.inventory.th_type')}>
                    <select
                      value={draft.stock_type}
                      onChange={(e) => updateDraft('stock_type', e.target.value as InventoryDraft['stock_type'])}
                      className="w-full rounded-xl border border-white/[0.05] bg-[#141414] px-4 py-3 text-sm text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all appearance-none"
                    >
                      <option value="operation">{t('admin.inventory.tab_operation')}</option>
                      <option value="sale">{t('admin.inventory.tab_sale')}</option>
                    </select>
                  </Field>
                  <Field label={t('admin.inventory.th_category')}>
                    <input
                      value={draft.category}
                      onChange={(e) => updateDraft('category', e.target.value)}
                      className="w-full rounded-xl border border-white/[0.05] bg-[#141414] px-4 py-3 text-sm text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label={t('admin.inventory.th_qty')}>
                    <input
                      type="number" min="0" step="0.01"
                      value={draft.quantity}
                      onChange={(e) => updateDraft('quantity', Number(e.target.value))}
                      className="w-full rounded-xl border border-white/[0.05] bg-[#141414] px-4 py-3 text-sm font-mono text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </Field>
                  <Field label={t('admin.inventory.modal_unit')}>
                    <input
                      value={draft.unit}
                      onChange={(e) => updateDraft('unit', e.target.value)}
                      className="w-full rounded-xl border border-white/[0.05] bg-[#141414] px-4 py-3 text-sm text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label={t('admin.inventory.modal_min')}>
                    <input
                      type="number" min="0" step="0.01"
                      value={draft.min_stock}
                      onChange={(e) => updateDraft('min_stock', Number(e.target.value))}
                      className="w-full rounded-xl border border-white/[0.05] bg-[#141414] px-4 py-3 text-sm font-mono text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </Field>
                  <Field label={t('admin.inventory.modal_cost')}>
                    <input
                      type="number" min="0" step="0.01"
                      value={draft.unit_cost}
                      onChange={(e) => updateDraft('unit_cost', Number(e.target.value))}
                      className="w-full rounded-xl border border-white/[0.05] bg-[#141414] px-4 py-3 text-sm font-mono text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </Field>
                </div>

                <Field label={t('admin.inventory.modal_price')}>
                  <input
                    type="number" min="0" step="0.01"
                    value={draft.unit_price}
                    onChange={(e) => updateDraft('unit_price', Number(e.target.value))}
                    className="w-full rounded-xl border border-white/[0.05] bg-[#141414] px-4 py-3 text-sm font-mono text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </Field>

                <label className="inline-flex items-center gap-3 text-sm text-gray-400 font-medium py-2">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={draft.is_active}
                      onChange={(e) => updateDraft('is_active', e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-9 rounded-full bg-white/10 peer-checked:bg-primary transition-colors border border-white/5"></div>
                    <div className="absolute left-[2px] top-[2px] h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                  </div>
                  {t('admin.inventory.modal_active')}
                </label>

                <div className="pt-4 mt-4 border-t border-white/[0.05] flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl px-5 py-2.5 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary-hover shadow-[0_0_15px_rgba(0,71,255,0.3)] disabled:opacity-60 active:scale-95"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {draft.id ? t('admin.inventory.modal_save_changes') : t('admin.inventory.modal_add')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, iconClassName, panelClassName }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="group relative overflow-hidden rounded-[2rem] border border-white/[0.04] bg-[#0F0F0F] p-6 hover:border-white/10 transition-colors shadow-2xl"
    >
      <div className="flex items-center gap-5">
        <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl border shadow-inner group-hover:scale-110 transition-transform duration-300', panelClassName)}>
          <Icon className={cn('h-6 w-6', iconClassName)} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold font-display text-white tracking-tight">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

function Field({ label, children }: any) {
  return (
    <label className="block space-y-2">
      <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 pl-1">{label}</span>
      {children}
    </label>
  );
}
