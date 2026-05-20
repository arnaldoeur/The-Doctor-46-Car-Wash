import { useEffect, useMemo, useState, useRef } from 'react';
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
  Wallet,
  Smartphone,
  ChevronDown,
  CheckCircle2,
  User,
  ShoppingBag,
  Sparkles,
  X,
  AlertCircle,
  Download,
  ArrowRight,
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
import { motion, AnimatePresence } from 'framer-motion';

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

const primaryPaymentMethods = [
  { 
    id: 'cash' as const, 
    label: 'Dinheiro', 
    subtitle: 'Pronto pagamento no local',
    icon: Banknote, 
  },
  { 
    id: 'mobile_wallet' as const, 
    label: 'Carteira Móvel', 
    subtitle: 'M-Pesa, E-Mola ou Mkesh',
    icon: Smartphone, 
    hasSubMethods: true,
  },
];

const mobileWalletMethods = [
  { 
    id: 'mpesa' as const, 
    label: 'M-Pesa', 
    tag: 'Vodacom',
    logo: '/mpesa.png',
    color: 'text-red-400',
    activeBg: 'bg-red-500/10',
    activeBorder: 'border-red-500/50',
    activeGlow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
  },
  { 
    id: 'emola' as const, 
    label: 'E-Mola', 
    tag: 'Movitel',
    logo: '/emola.png',
    color: 'text-orange-400',
    activeBg: 'bg-orange-500/10',
    activeBorder: 'border-orange-500/50',
    activeGlow: 'shadow-[0_0_15px_rgba(249,115,22,0.15)]',
  },
  { 
    id: 'mkesh' as const, 
    label: 'Mkesh', 
    tag: 'Tmcel',
    logo: '/mkesh.png',
    color: 'text-yellow-400',
    activeBg: 'bg-yellow-500/10',
    activeBorder: 'border-yellow-500/50',
    activeGlow: 'shadow-[0_0_15px_rgba(234,179,8,0.15)]',
  },
];

export default function POS() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [catalog, setCatalog] = useState<ServiceCatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [documentType, setDocumentType] = useState<'receipt' | 'invoice'>('receipt');
  const [showMobileWallets, setShowMobileWallets] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const walkInLabel = useMemo(() => t('admin.pos.walk_in'), [t]);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [amountReceived, setAmountReceived] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [walletStep, setWalletStep] = useState<'idle' | 'processing' | 'success'>('idle');
  const [transactionRef, setTransactionRef] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [completedDoc, setCompletedDoc] = useState<{ id: string; number: string; kind: string; title: string; party_name: string; total: number; issue_date: string; payment_method: PaymentMethod; vat_enabled: boolean; vat_included: boolean; vat_rate: number; items: any[] } | null>(null);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const pushTimeoutRef = useRef<number | null>(null);
  const successTimerRef = useRef<number | null>(null);
  const [pushTimedOut, setPushTimedOut] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const services = await fetchCatalogServices();
        if (active) setCatalog(services.filter((s) => s.is_active));
      } catch (error) {
        console.error('Failed to load POS catalog', error);
        if (active) setErrorMessage(t('admin.pos.error_load'));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [t]);

  const addToCart = (item: ServiceCatalogRow) => {
    setCart((prev) => {
      const existing = prev.find((e) => e.item.id === item.id);
      if (existing) return prev.map((e) => e.item.id === item.id ? { ...e, qty: e.qty + 1 } : e);
      return [...prev, { item, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((e) => e.item.id === id ? { ...e, qty: Math.max(0, e.qty + delta) } : e)
        .filter((e) => e.qty > 0)
    );
  };

  const totals = useMemo(() => {
    return cart.reduce(
      (acc, entry) => {
        const line = calculateLineTotals(entry.item, entry.qty);
        return {
          subtotal: acc.subtotal + line.subtotal,
          vatAmount: acc.vatAmount + line.vatAmount,
          total: acc.total + line.total,
        };
      },
      { subtotal: 0, vatAmount: 0, total: 0 }
    );
  }, [cart]);

  const handleConfirmPayment = async () => {
    if (cart.length === 0) return;
    try {
      setSaving(true);
      setMessage('');
      setErrorMessage('');

      const vatEnabled = cart.some((e) => e.item.vat_enabled);
      const vatIncluded = cart.every((e) => e.item.vat_included);
      const vatRate = cart.find((e) => e.item.vat_enabled)?.item.vat_rate ?? 0;
      const reportCategory = vatEnabled ? 'with_vat' : 'without_vat';
      const number = createDocumentNumber(documentType);

      const lineItems = cart.map((e) => ({
        service_id: e.item.id,
        description: e.item.name,
        details: `${e.item.category} | ${e.item.vat_enabled ? (e.item.vat_included ? t('service.vat_included', 'IVA incluso') : t('service.vat_with', 'Com IVA')) : t('service.vat_without', 'Sem IVA')}`,
        quantity: e.qty,
        unit_price: Number(finalUnitPrice(e.item).toFixed(2)),
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
        notes: `Documento gerado no POS. Método: ${paymentMethod === 'cash' ? 'Dinheiro' : `Carteira Móvel (${paymentMethod.toUpperCase()})`}${transactionRef ? ` | Ref: ${transactionRef}` : ''}`,
        items: lineItems,
      });

      const docDataForPdf = {
        id: document.id,
        number: document.number,
        kind: document.kind,
        status: document.status as DocumentStatus,
        source: 'pos' as const,
        title: document.title,
        issueDate: document.issue_date,
        paymentMethod,
        vatEnabled: document.vat_enabled,
        vatIncluded: document.vat_included,
        vatRate: document.vat_rate,
        party: { name: document.party_name },
        items: lineItems.map((item, index) => ({
          id: `${document.id}-${index}`,
          description: item.description,
          details: item.details,
          quantity: item.quantity,
          unitPrice: item.unit_price,
        })),
        notes: document.notes ?? undefined,
        createdAt: document.created_at,
      };

      await generateBusinessDocumentPdf(docDataForPdf);

      setCompletedDoc({
        id: document.id,
        number: document.number,
        kind: document.kind,
        title: document.title,
        party_name: document.party_name,
        total: Number(totals.total.toFixed(2)),
        issue_date: document.issue_date,
        payment_method: paymentMethod,
        vat_enabled: document.vat_enabled,
        vat_included: document.vat_included,
        vat_rate: document.vat_rate,
        items: docDataForPdf.items,
      });

      setCart([]);
      setCustomerName('');
      setIsPaymentModalOpen(false);
      const successText = t('admin.pos.success_message', 'Venda finalizada com sucesso! Documento gerado.');
      setMessage(successText);
      setToastMessage(successText);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } catch (error) {
      console.error('Failed to confirm POS checkout', error);
      setErrorMessage(error instanceof Error ? error.message : t('admin.pos.error_issue'));
    } finally {
      setSaving(false);
    }
  };

  const handleProcessMobileWallet = () => {
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    if (!/^(84|85|82|83|86|87)\d{7}$/.test(cleanPhone)) {
      setPhoneError('Número inválido. Introduza um número Moçambicano de 9 dígitos.');
      return;
    }
    setPhoneError('');
    setPushTimedOut(false);
    setWalletStep('processing');

    if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
    if (pushTimeoutRef.current) window.clearTimeout(pushTimeoutRef.current);

    successTimerRef.current = window.setTimeout(() => {
      if (pushTimeoutRef.current) window.clearTimeout(pushTimeoutRef.current);
      const ref = `${paymentMethod.toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`;
      setTransactionRef(ref);
      setWalletStep('success');
      setTimeout(() => void handleConfirmPayment(), 2500);
    }, 4500);

    pushTimeoutRef.current = window.setTimeout(() => {
      if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
      setPushTimedOut(true);
      setWalletStep('idle');
    }, 60000);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-6 lg:flex-row pb-6">
      
      {/* ─── CATALOG SECTION ─── */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/[0.04] bg-[#0F0F0F] shadow-2xl relative">
        <div className="border-b border-white/[0.04] p-5 bg-[#141414]">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder={t('admin.pos.search_placeholder', 'Search services by name, category...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/[0.05] bg-[#0A0A0A] py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-500 transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-max">
              {catalog
                .filter((item) => `${item.name} ${item.category} ${item.code}`.toLowerCase().includes(search.toLowerCase()))
                .map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative flex min-h-[160px] h-auto flex-col justify-between rounded-2xl border border-white/[0.04] bg-[#141414] p-4 text-left transition-all duration-300 hover:border-primary/30 hover:bg-white/[0.04] hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
                  >
                    <div className="w-full">
                      <div className="mb-2.5 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-white/[0.03] border border-white/[0.05] px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-primary group-hover:border-primary/20 group-hover:bg-primary/5 transition-colors">
                          {item.category}
                        </span>
                        <span className={cn(
                          "rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border transition-colors",
                          !item.vat_enabled
                            ? "bg-white/[0.02] border-white/[0.05] text-gray-500"
                            : item.vat_included
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        )}>
                          {item.vat_enabled ? (item.vat_included ? 'IVA incluso' : `+${item.vat_rate}% IVA`) : 'Sem IVA'}
                        </span>
                      </div>
                      <h4 className="line-clamp-1 text-sm font-semibold text-white/90 leading-tight group-hover:text-primary transition-colors">
                        {item.name}
                      </h4>
                      {item.description && (
                        <p className="line-clamp-2 text-xs text-gray-500 leading-normal mt-1.5 font-normal group-hover:text-gray-400/80 transition-colors">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-4 w-full">
                      <div className="flex flex-col">
                        {item.is_promotional && item.promotional_price !== null && (
                          <span className="text-[10px] text-gray-500 line-through">
                            {item.base_price.toFixed(2)} MT
                          </span>
                        )}
                        <span className="text-lg font-bold font-display text-primary/90 group-hover:text-primary transition-colors">
                          {finalUnitPrice(item).toFixed(2)} <span className="text-xs font-medium text-gray-500">MT</span>
                        </span>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/[0.03] flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all">
                        <Plus className="h-4 w-4" />
                      </div>
                    </div>
                  </motion.button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── CART & CHECKOUT SECTION ─── */}
      <div className="flex w-full flex-col overflow-hidden rounded-[2rem] border border-white/[0.04] bg-[#0F0F0F] lg:w-[420px] shadow-2xl shrink-0">
        <div className="border-b border-white/[0.04] bg-[#141414] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-gray-400" />
              Current Order
            </h2>
            <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
              {cart.length} items
            </span>
          </div>

          <div className="space-y-3">
            <div className="relative group">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-xl border border-white/[0.05] bg-[#0A0A0A] py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all"
                placeholder="Customer Name (Optional)"
              />
            </div>
            
            <div className="flex rounded-xl bg-[#0A0A0A] p-1 border border-white/[0.05]">
              <button
                onClick={() => setDocumentType('receipt')}
                className={cn("flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all", documentType === 'receipt' ? "bg-[#1C1C1C] text-white shadow-sm border border-white/[0.05]" : "text-gray-500 hover:text-white")}
              >
                <Printer className="h-3.5 w-3.5" /> Receipt
              </button>
              <button
                onClick={() => setDocumentType('invoice')}
                className={cn("flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all", documentType === 'invoice' ? "bg-[#1C1C1C] text-white shadow-sm border border-white/[0.05]" : "text-gray-500 hover:text-white")}
              >
                <FileText className="h-3.5 w-3.5" /> Invoice
              </button>
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {completedDoc && (
             <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4">
                 <CheckCircle2 className="h-12 w-12 text-emerald-500/20" />
               </div>
               <h4 className="font-bold text-emerald-400 mb-1">Sale Completed!</h4>
               <p className="text-xs text-emerald-200/70 mb-4">{completedDoc.title} • {completedDoc.total.toFixed(2)} MT</p>
               <button
                 onClick={() => setCompletedDoc(null)}
                 className="w-full rounded-xl bg-emerald-500/20 text-emerald-400 py-2 text-sm font-bold hover:bg-emerald-500/30 transition-colors"
               >
                 New Sale
               </button>
             </div>
          )}

          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
              <ShoppingBag className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm font-medium text-gray-400">Your cart is empty</p>
              <p className="text-xs mt-1">Select services from the catalog.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {cart.map((entry) => (
                  <motion.div
                    key={entry.item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between rounded-2xl border border-white/[0.04] bg-[#141414] p-3 hover:border-white/[0.08] transition-colors"
                  >
                    <div className="min-w-0 pr-3 flex-1">
                      <h5 className="text-sm font-semibold text-white/90 truncate">{entry.item.name}</h5>
                      <span className="text-xs font-bold text-primary block mt-0.5">
                        {calculateLineTotals(entry.item, entry.qty).total.toFixed(2)} MT
                      </span>
                    </div>
                    <div className="flex items-center bg-[#0A0A0A] rounded-xl border border-white/[0.05] p-0.5 shrink-0">
                      <button
                        onClick={() => updateQty(entry.item.id, -1)}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                      >
                        {entry.qty === 1 ? <Trash2 className="h-3.5 w-3.5 text-red-400" /> : <Minus className="h-3.5 w-3.5" />}
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-white">{entry.qty}</span>
                      <button
                        onClick={() => updateQty(entry.item.id, 1)}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Checkout Footer */}
        <div className="border-t border-white/[0.04] bg-[#141414] p-5">
          <div className="space-y-1.5 mb-5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{totals.subtotal.toFixed(2)} MT</span>
            </div>
            {totals.vatAmount > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>VAT</span>
                <span>{totals.vatAmount.toFixed(2)} MT</span>
              </div>
            )}
            <div className="flex justify-between border-t border-white/[0.05] pt-3 mt-2">
              <span className="font-bold text-white">Total</span>
              <span className="text-xl font-bold font-display text-white">{totals.total.toFixed(2)} <span className="text-sm text-gray-500">MT</span></span>
            </div>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => setIsPaymentModalOpen(true)}
            className={cn(
              "w-full rounded-2xl py-3.5 font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2",
              cart.length === 0 
                ? "bg-white/[0.02] text-gray-600 cursor-not-allowed" 
                : "bg-white text-black hover:bg-gray-200 active:scale-[0.98]"
            )}
          >
            Charge {totals.total.toFixed(2)} MT
          </button>
        </div>
      </div>

      {/* ─── PAYMENT MODAL ─── */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-[440px] rounded-[2rem] border border-white/[0.05] bg-[#0A0A0A] p-6 shadow-2xl"
            >
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="absolute right-5 top-5 p-2 rounded-full bg-white/[0.05] text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="text-xl font-bold font-display text-white mb-6">Complete Payment</h3>

              {/* Payment Method Tabs */}
              <div className="flex rounded-xl bg-[#141414] p-1 border border-white/[0.05] mb-6">
                {primaryPaymentMethods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      if (m.id === 'mobile_wallet') {
                        setPaymentMethod('mpesa');
                        setShowMobileWallets(true);
                      } else {
                        setPaymentMethod('cash');
                        setShowMobileWallets(false);
                      }
                    }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all",
                      (m.id === 'cash' && paymentMethod === 'cash') || (m.id === 'mobile_wallet' && paymentMethod !== 'cash')
                        ? "bg-[#222] text-white shadow-sm border border-white/[0.05]"
                        : "text-gray-500 hover:text-white"
                    )}
                  >
                    <m.icon className="h-4 w-4" /> {m.label}
                  </button>
                ))}
              </div>

              {/* Wallets selector */}
              {paymentMethod !== 'cash' && (
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {mobileWalletMethods.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => setPaymentMethod(w.id as PaymentMethod)}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-xl border transition-all",
                        paymentMethod === w.id 
                          ? `bg-white/[0.05] ${w.activeBorder} ${w.activeGlow}`
                          : "border-white/[0.05] bg-[#141414] hover:bg-white/[0.02]"
                      )}
                    >
                      <div className="h-8 w-8 mb-2 rounded overflow-hidden">
                        <img src={w.logo} alt={w.label} className="h-full w-full object-cover" />
                      </div>
                      <span className={cn("text-xs font-bold", paymentMethod === w.id ? "text-white" : "text-gray-400")}>{w.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Content area */}
              <div className="bg-[#141414] rounded-2xl p-5 border border-white/[0.05] mb-6">
                {paymentMethod === 'cash' ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">Amount Received (MT)</label>
                    <input
                      type="number"
                      autoFocus
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#0A0A0A] border border-white/[0.05] rounded-xl px-4 py-3 text-xl font-bold text-white focus:border-emerald-500/50 focus:outline-none transition-all"
                    />
                    {parseFloat(amountReceived) >= totals.total && (
                      <div className="mt-4 flex justify-between items-center text-emerald-400">
                        <span className="text-sm font-semibold">Change to return:</span>
                        <span className="text-xl font-bold">{(parseFloat(amountReceived) - totals.total).toFixed(2)} MT</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">Phone Number (+258)</label>
                    <input
                      type="tel"
                      autoFocus
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="84 123 4567"
                      className="w-full bg-[#0A0A0A] border border-white/[0.05] rounded-xl px-4 py-3 text-lg font-mono font-bold text-white focus:border-blue-500/50 focus:outline-none transition-all"
                    />
                    {phoneError && <p className="text-xs text-red-400 mt-2">{phoneError}</p>}
                  </div>
                )}
              </div>

              {/* Action */}
              <button
                disabled={saving || (paymentMethod === 'cash' && (parseFloat(amountReceived) || 0) < totals.total)}
                onClick={paymentMethod === 'cash' ? handleConfirmPayment : handleProcessMobileWallet}
                className={cn(
                  "w-full rounded-xl py-3.5 font-bold text-sm transition-all flex items-center justify-center gap-2",
                  saving || (paymentMethod === 'cash' && (parseFloat(amountReceived) || 0) < totals.total)
                    ? "bg-white/[0.05] text-gray-500 cursor-not-allowed"
                    : paymentMethod === 'cash' 
                      ? "bg-emerald-500 text-black hover:bg-emerald-400"
                      : "bg-blue-600 text-white hover:bg-blue-500"
                )}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Confirm Payment
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
