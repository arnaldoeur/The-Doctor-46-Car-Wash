import { useEffect, useMemo, useState } from 'react';
import {
 Search,
 Plus,
 Minus,
 Trash2,
 CreditCard,
 Banknote,
 QrCode,
 Printer,
 ShoppingCart,
 FileText,
 Loader2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { type PaymentMethod, type DocumentStatus, createDocumentNumber } from '../../lib/documentCenter';
import { generateBusinessDocumentPdf } from '../../lib/pdfMachine';
import {
 createBusinessDocument,
 fetchCatalogServices,
 type ServiceCatalogRow,
} from '../../lib/adminData';
import { useAuth } from '../../providers/AuthProvider';
import { useLanguage } from '../../providers/LanguageProvider';

type CartEntry = {
 item: ServiceCatalogRow;
 qty: number;
};

const finalUnitPrice = (service: ServiceCatalogRow) =>
 service.is_promotional && service.promotional_price !== null
 ? service.promotional_price
 : service.base_price;

const calculateLineTotals = (service: ServiceCatalogRow, qty: number) => {
 const displayedUnitPrice = finalUnitPrice(service);
 const lineDisplayed = displayedUnitPrice * qty;

 if (!service.vat_enabled) {
 return { subtotal: lineDisplayed, vatAmount: 0, total: lineDisplayed };
 }

 if (service.vat_included) {
 const subtotal = lineDisplayed / (1 + service.vat_rate / 100);
 return { subtotal, vatAmount: lineDisplayed - subtotal, total: lineDisplayed };
 }

 const vatAmount = lineDisplayed * (service.vat_rate / 100);
 return { subtotal: lineDisplayed, vatAmount, total: lineDisplayed + vatAmount };
};

export default function POS() {
 const { profile } = useAuth();
 const { t } = useLanguage();
 const [catalog, setCatalog] = useState<ServiceCatalogRow[]>([]);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [cart, setCart] = useState<CartEntry[]>([]);
 const [search, setSearch] = useState('');
 const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
 const [showMobileWallets, setShowMobileWallets] = useState(false);
 const [documentType, setDocumentType] = useState<'receipt' | 'invoice'>('receipt');
 // Empty string means "walk-in" — rendered from t() at display time to stay language-reactive
 const [customerName, setCustomerName] = useState('');
 const walkInLabel = useMemo(() => t('admin.pos.walk_in'), [t]);
 const [message, setMessage] = useState('');
 const [errorMessage, setErrorMessage] = useState('');

 useEffect(() => {
 let active = true;

 const load = async () => {
 try {
 setLoading(true);
 setErrorMessage('');
 const services = await fetchCatalogServices();
 if (active) {
 setCatalog(services.filter((service) => service.is_active));
 }
 } catch (error) {
 console.error('Failed to load POS catalog', error);
 if (active) {
 setErrorMessage(t('admin.pos.error_load'));
 }
 } finally {
 if (active) {
 setLoading(false);
 }
 }
 };

 void load();

 return () => {
 active = false;
 };
 }, []);

 const addToCart = (item: ServiceCatalogRow) => {
 setCart((previous) => {
 const existing = previous.find((entry) => entry.item.id === item.id);
 if (existing) {
 return previous.map((entry) =>
 entry.item.id === item.id ? { ...entry, qty: entry.qty + 1 } : entry
 );
 }

 return [...previous, { item, qty: 1 }];
 });
 };

 const updateQty = (id: string, delta: number) => {
 setCart((previous) =>
 previous
 .map((entry) => {
 if (entry.item.id === id) {
 return { ...entry, qty: Math.max(0, entry.qty + delta) };
 }
 return entry;
 })
 .filter((entry) => entry.qty > 0)
 );
 };

 const totals = useMemo(() => {
 return cart.reduce(
 (accumulator, entry) => {
 const line = calculateLineTotals(entry.item, entry.qty);
 return {
 subtotal: accumulator.subtotal + line.subtotal,
 vatAmount: accumulator.vatAmount + line.vatAmount,
 total: accumulator.total + line.total,
 };
 },
 { subtotal: 0, vatAmount: 0, total: 0 }
 );
 }, [cart]);

 const handleCheckout = async () => {
 if (cart.length === 0) {
 return;
 }

 try {
 setSaving(true);
 setMessage('');
 setErrorMessage('');

 const vatEnabled = cart.some((entry) => entry.item.vat_enabled);
 const vatIncluded = cart.every((entry) => entry.item.vat_included);
 const vatRate = cart.find((entry) => entry.item.vat_enabled)?.item.vat_rate ?? 0;
 const reportCategory = vatEnabled ? 'with_vat' : 'without_vat';
 const number = createDocumentNumber(documentType);

 const lineItems = cart.map((entry) => ({
 service_id: entry.item.id,
 description: entry.item.name,
 details: `${entry.item.category} | ${entry.item.vat_enabled ? (entry.item.vat_included ? t('service.vat_included', 'IVA incluso') : t('service.vat_with', 'Com IVA')) : t('service.vat_without', 'Sem IVA')}`,
 quantity: entry.qty,
 unit_price: Number(finalUnitPrice(entry.item).toFixed(2)),
 }));

 const document = await createBusinessDocument({
 number,
 kind: documentType,
 report_category: reportCategory,
 status: documentType === 'receipt' ? 'Paid' : 'Issued',
 source: 'pos',
 title: documentType === 'receipt' ? 'Recibo emitido no POS' : 'Fatura emitida no POS',
 issue_date: new Date().toISOString().slice(0, 10),
 party_name: customerName.trim() || walkInLabel,
 payment_method: paymentMethod,
 vat_enabled: vatEnabled,
 vat_included: vatIncluded,
 vat_rate: vatRate,
 subtotal: Number(totals.subtotal.toFixed(2)),
 vat_amount: Number(totals.vatAmount.toFixed(2)),
 total: Number(totals.total.toFixed(2)),
 issued_by: profile?.id ?? null,
 notes: 'Documento gerado no POS com base em dados reais do MySQL.',
 items: lineItems,
 });

 await generateBusinessDocumentPdf({
 id: document.id,
 number: document.number,
 kind: document.kind,
 status: document.status as DocumentStatus,
 source: 'pos',
 title: document.title,
 issueDate: document.issue_date,
 paymentMethod,
 vatEnabled: document.vat_enabled,
 vatIncluded: document.vat_included,
 vatRate: document.vat_rate,
 party: {
 name: document.party_name,
 },
 items: lineItems.map((item, index) => ({
 id: `${document.id}-${index}`,
 description: item.description,
 details: item.details,
 quantity: item.quantity,
 unitPrice: item.unit_price,
 })),
 notes: document.notes ?? undefined,
 createdAt: document.created_at,
 });

 setCart([]);
 setCustomerName('');
 setMessage(t('admin.pos.success_message'));
 } catch (error) {
 console.error('Failed to complete POS checkout', error);
 setErrorMessage(
 error instanceof Error
 ? error.message
 : t('admin.pos.error_issue')
 );
 } finally {
 setSaving(false);
 }
 };

 return (
 <div className="flex h-[calc(100vh-8rem)] flex-col gap-8 lg:flex-row">
 <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-dark">
 <div className="border-b border-white/10 p-6">
 <div className="relative">
 <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
 <input
 type="text"
 placeholder={t('admin.pos.search_placeholder')}
 value={search}
 onChange={(event) => setSearch(event.target.value)}
 className="w-full rounded-xl border border-white/10 bg-darker py-3 pl-12 pr-4 text-white focus:border-primary focus:outline-none"
 />
 </div>
 <p className="mt-4 text-sm text-gray-400">
 {t('admin.pos.helper_text')}
 </p>
 </div>

 <div className="flex-1 overflow-y-auto p-6">
 {loading ? (
 <div className="flex h-full items-center justify-center">
 <Loader2 className="h-8 w-8 animate-spin text-primary" />
 </div>
 ) : (
 <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
 {catalog
 .filter((item) => {
 const haystack = `${item.name} ${item.category} ${item.code}`.toLowerCase();
 return haystack.includes(search.toLowerCase());
 })
 .map((item) => (
 <button
 key={item.id}
 type="button"
 onClick={() => addToCart(item)}
 className="flex h-36 flex-col justify-between rounded-xl border border-white/10 bg-darker p-4 text-left transition-all hover:border-primary/50"
 >
 <div>
 <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-primary">
 {item.category}
 </span>
 <h4 className="line-clamp-2 font-medium text-gray-200">{item.name}</h4>
 <div className="mt-2 text-xs text-gray-500">
 {item.vat_enabled ? (item.vat_included ? t('service.vat_included', 'IVA incluso') : t('service.vat_with', 'Com IVA')) : t('service.vat_without', 'Sem IVA')}
 {item.is_promotional ? ` | ${t('service.promo', 'Promoção')}` : ''}
 </div>
 </div>
 <div className="mt-2 text-xl font-bold font-display">
 {finalUnitPrice(item).toFixed(2)} MT
 </div>
 </button>
 ))}
 </div>
 )}
 </div>
 </div>

 <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-dark lg:w-96">
 <div className="border-b border-white/10 bg-darker/50 p-6">
 <h2 className="text-xl font-bold font-display">{t('admin.pos.current_order')}</h2>
 <p className="text-sm text-gray-400">{t('admin.pos.checkout_sub')}</p>
 <div className="mt-4 space-y-3">
 <input
 type="text"
 value={customerName}
 onChange={(event) => setCustomerName(event.target.value)}
 className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white focus:border-primary focus:outline-none"
 placeholder={t('admin.pos.customer_name_placeholder')}
 />
 <div className="grid grid-cols-2 gap-3">
 <button
 type="button"
 onClick={() => setDocumentType('receipt')}
 className={cn(
 'flex items-center justify-center gap-2 rounded-xl border px-4 py-3 transition-colors',
 documentType === 'receipt'
 ? 'border-primary bg-primary/20 text-primary'
 : 'border-white/10 bg-dark text-gray-400 hover:text-white'
 )}
 >
 <Printer className="h-4 w-4" />
 {t('admin.pos.receipt')}
 </button>
 <button
 type="button"
 onClick={() => setDocumentType('invoice')}
 className={cn(
 'flex items-center justify-center gap-2 rounded-xl border px-4 py-3 transition-colors',
 documentType === 'invoice'
 ? 'border-primary bg-primary/20 text-primary'
 : 'border-white/10 bg-dark text-gray-400 hover:text-white'
 )}
 >
 <FileText className="h-4 w-4" />
 {t('admin.pos.invoice')}
 </button>
 </div>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-6">
 {message ? (
 <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
 {message}
 </div>
 ) : null}
 {errorMessage ? (
 <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
 {errorMessage}
 </div>
 ) : null}

 {cart.length === 0 ? (
 <div className="flex h-full flex-col items-center justify-center text-gray-500">
 <ShoppingCart className="mb-4 h-12 w-12 opacity-20" />
 <p>{t('admin.pos.cart_empty')}</p>
 </div>
 ) : (
 <div className="space-y-4">
 {cart.map((entry) => (
 <div
 key={entry.item.id}
 className="flex items-center justify-between rounded-xl border border-white/5 bg-darker p-3"
 >
 <div className="flex-1">
 <h5 className="text-sm font-medium">{entry.item.name}</h5>
 <div className="text-sm font-bold text-primary">
 {calculateLineTotals(entry.item, entry.qty).total.toFixed(2)} MT
 </div>
 </div>
 <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-dark p-1">
 <button
 type="button"
 onClick={() => updateQty(entry.item.id, -1)}
 className="rounded-md p-1 transition-colors hover:bg-white/10"
 >
 {entry.qty === 1 ? (
 <Trash2 className="h-4 w-4 text-red-400" />
 ) : (
 <Minus className="h-4 w-4" />
 )}
 </button>
 <span className="w-4 text-center text-sm font-medium">{entry.qty}</span>
 <button
 type="button"
 onClick={() => updateQty(entry.item.id, 1)}
 className="rounded-md p-1 transition-colors hover:bg-white/10"
 >
 <Plus className="h-4 w-4" />
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 <div className="border-t border-white/10 bg-darker/50 p-6">
 <div className="mb-6 space-y-3">
 <div className="flex justify-between text-sm text-gray-400">
 <span>{t('admin.pos.subtotal')}</span>
 <span>{totals.subtotal.toFixed(2)} MT</span>
 </div>
 <div className="flex justify-between text-sm text-gray-400">
 <span>{t('admin.pos.vat')}</span>
 <span>{totals.vatAmount.toFixed(2)} MT</span>
 </div>
 <div className="flex justify-between border-t border-white/10 pt-3 text-xl font-bold font-display">
 <span>{t('admin.pos.total')}</span>
 <span className="text-primary">{totals.total.toFixed(2)} MT</span>
 </div>
 </div>

  {/* Payment Methods Section (Mozambique Market) */}
  <div className="mb-6 space-y-3">
    <div className="grid grid-cols-2 gap-3">
      {/* Dinheiro (Cash) Button */}
      <button
        type="button"
        onClick={() => {
          setPaymentMethod('cash');
          setShowMobileWallets(false);
        }}
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border p-3 transition-all',
          paymentMethod === 'cash'
            ? 'border-primary bg-primary/20 text-primary'
            : 'border-white/10 bg-dark text-gray-400 hover:border-white/30 hover:text-white'
        )}
      >
        <Banknote className="mb-1 h-5 w-5" />
        <span className="text-xs font-medium">{t('admin.pos.payment_cash')}</span>
      </button>

      {/* Carteira Móvel (Mobile Money) Button */}
      <button
        type="button"
        onClick={() => {
          setShowMobileWallets(true);
          // If current method is not a mobile wallet, default to mpesa
          if (paymentMethod !== 'mpesa' && paymentMethod !== 'emola' && paymentMethod !== 'mkesh') {
            setPaymentMethod('mpesa');
          }
        }}
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border p-3 transition-all',
          (paymentMethod === 'mpesa' || paymentMethod === 'emola' || paymentMethod === 'mkesh' || showMobileWallets)
            ? 'border-primary bg-primary/20 text-primary'
            : 'border-white/10 bg-dark text-gray-400 hover:border-white/30 hover:text-white'
        )}
      >
        <QrCode className="mb-1 h-5 w-5" />
        <span className="text-xs font-medium">{t('admin.pos.payment_mobile_money')}</span>
      </button>
    </div>

    {/* Mobile Wallets Accordion/Grid with Corporate brandings */}
    <div
      className={cn(
        'grid grid-cols-3 gap-2 overflow-hidden transition-all duration-300 ease-out',
        (showMobileWallets || paymentMethod === 'mpesa' || paymentMethod === 'emola' || paymentMethod === 'mkesh')
          ? 'max-h-24 opacity-100 mt-2'
          : 'max-h-0 opacity-0 pointer-events-none'
      )}
    >
      {/* Vodacom M-Pesa (Red Brand Identity) */}
      <button
        type="button"
        onClick={() => setPaymentMethod('mpesa')}
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border p-2 transition-all',
          paymentMethod === 'mpesa'
            ? 'border-red-500 bg-red-500/10 text-red-400 font-semibold'
            : 'border-white/10 bg-dark text-gray-400 hover:border-red-500/30 hover:text-red-300'
        )}
      >
        <div className="mb-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">V</div>
        <span className="text-xs">{t('admin.pos.wallet_mpesa')}</span>
      </button>

      {/* Movitel E-Mola (Orange Brand Identity) */}
      <button
        type="button"
        onClick={() => setPaymentMethod('emola')}
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border p-2 transition-all',
          paymentMethod === 'emola'
            ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-semibold'
            : 'border-white/10 bg-dark text-gray-400 hover:border-amber-500/30 hover:text-amber-300'
        )}
      >
        <div className="mb-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">E</div>
        <span className="text-xs">{t('admin.pos.wallet_emola')}</span>
      </button>

      {/* Tmcel Mkesh (Teal/Green/Cyan Brand Identity) */}
      <button
        type="button"
        onClick={() => setPaymentMethod('mkesh')}
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border p-2 transition-all',
          paymentMethod === 'mkesh'
            ? 'border-teal-500 bg-teal-500/10 text-teal-400 font-semibold'
            : 'border-white/10 bg-dark text-gray-400 hover:border-teal-500/30 hover:text-teal-300'
        )}
      >
        <div className="mb-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white">M</div>
        <span className="text-xs">{t('admin.pos.wallet_mkesh')}</span>
      </button>
    </div>
  </div>

 <button
 disabled={cart.length === 0 || saving}
 onClick={() => void handleCheckout()}
 className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-lg font-bold text-white transition-all hover:bg-primary-hover disabled:opacity-50"
 >
 <Printer className="h-5 w-5" />
 {saving ? t('admin.pos.checkout_saving') : t('admin.pos.checkout_button')}
 </button>
 </div>
 </div>
 </div>
 );
}
