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

// Payment methods configuration - premium SaaS Fintech UI
const primaryPaymentMethods = [
  { 
    id: 'cash' as const, 
    label: 'Dinheiro', 
    subtitle: 'Pronto pagamento no local',
    icon: Banknote, 
    color: 'text-emerald-400',
    activeBg: 'bg-emerald-500/10',
    activeBorder: 'border-emerald-500',
    activeGlow: 'shadow-[0_0_25px_rgba(16,185,129,0.25)]',
    badgeColor: 'text-emerald-400 bg-emerald-500/20',
  },
  { 
    id: 'mobile_wallet' as const, 
    label: 'Carteira Móvel', 
    subtitle: 'M-Pesa, E-Mola ou Mkesh',
    icon: Smartphone, 
    color: 'text-blue-400',
    activeBg: 'bg-blue-500/10',
    activeBorder: 'border-blue-500',
    activeGlow: 'shadow-[0_0_25px_rgba(59,130,246,0.25)]',
    badgeColor: 'text-blue-400 bg-blue-500/20',
    hasSubMethods: true,
  },
];

const mobileWalletMethods = [
  { 
    id: 'mpesa' as const, 
    label: 'M-Pesa', 
    tag: 'Vodacom',
    logo: '/mpesa.png',
    bgColor: 'bg-red-600',
    color: 'text-red-400',
    activeBg: 'bg-red-500/10',
    activeBorder: 'border-red-500',
    activeGlow: 'shadow-[0_0_16px_rgba(239,68,68,0.2)]',
    badgeColor: 'text-red-400 bg-red-500/15',
  },
  { 
    id: 'emola' as const, 
    label: 'E-Mola', 
    tag: 'Movitel',
    logo: '/emola.png',
    bgColor: 'bg-orange-500',
    color: 'text-orange-400',
    activeBg: 'bg-orange-500/10',
    activeBorder: 'border-orange-500',
    activeGlow: 'shadow-[0_0_16px_rgba(249,115,22,0.2)]',
    badgeColor: 'text-orange-400 bg-orange-500/15',
  },
  { 
    id: 'mkesh' as const, 
    label: 'Mkesh', 
    tag: 'Tmcel',
    logo: '/mkesh.png',
    bgColor: 'bg-yellow-500',
    color: 'text-yellow-400',
    activeBg: 'bg-yellow-500/10',
    activeBorder: 'border-yellow-500',
    activeGlow: 'shadow-[0_0_16px_rgba(234,179,8,0.2)]',
    badgeColor: 'text-yellow-400 bg-yellow-500/15',
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

  // Payment interactive flow states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [amountReceived, setAmountReceived] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [walletStep, setWalletStep] = useState<'idle' | 'processing' | 'success'>('idle');
  const [transactionRef, setTransactionRef] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [completedDoc, setCompletedDoc] = useState<{ id: string; number: string; kind: string; title: string; party_name: string; total: number; issue_date: string; payment_method: PaymentMethod; vat_enabled: boolean; vat_included: boolean; vat_rate: number; items: any[] } | null>(null);

  // New robust Toast & Push timeout states
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

  const handleConfirmPayment = async () => {
    if (cart.length === 0) return;

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
      };

      // Trigger PDF generation
      await generateBusinessDocumentPdf(docDataForPdf);

      // Save completed doc info to display in success banner
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
      setPhoneError('Número inválido. Introduza um número Moçambicano de 9 dígitos (iniciado por 84, 85, 82, 83, 86 ou 87).');
      return;
    }
    setPhoneError('');
    setPushTimedOut(false);
    setWalletStep('processing');

    if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
    if (pushTimeoutRef.current) window.clearTimeout(pushTimeoutRef.current);

    // Simulate approval after 4.5 seconds
    successTimerRef.current = window.setTimeout(() => {
      if (pushTimeoutRef.current) window.clearTimeout(pushTimeoutRef.current);
      const ref = `${paymentMethod.toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`;
      setTransactionRef(ref);
      setWalletStep('success');
      // Automatically issue receipt and conclude after 2.5s showing the success screen
      setTimeout(() => {
        void handleConfirmPayment();
      }, 2500);
    }, 4500);

    // Automatic timeout if customer takes too long (60s)
    pushTimeoutRef.current = window.setTimeout(() => {
      if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
      setPushTimedOut(true);
      setWalletStep('idle');
    }, 60000);
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] h-full flex-col gap-6 lg:flex-row pb-16 lg:pb-0">
      {/* Grelha de Serviços (Catálogo) */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-dark/80 backdrop-blur-xl shadow-2xl min-h-[500px] lg:min-h-0">
        <div className="border-b border-white/10 p-6 bg-darker/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.pos.search_placeholder', 'Pesquisar serviços por nome, categoria ou código...')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-dark py-3.5 pl-12 pr-4 text-white text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>
          <p className="mt-3 text-xs text-gray-400 flex items-center gap-1.5 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {t('admin.pos.helper_text', 'Clique num serviço abaixo para adicionar rapidamente ao carrinho de vendas.')}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {catalog
                .filter((item) => {
                  const haystack = `${item.name} ${item.category} ${item.code}`.toLowerCase();
                  return haystack.includes(search.toLowerCase());
                })
                .map((item) => (
                  <motion.button
                    key={item.id}
                    type="button"
                    onClick={() => addToCart(item)}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative flex h-36 flex-col justify-between rounded-2xl border border-white/10 bg-darker p-4 text-left transition-all duration-300 hover:border-primary/50 hover:bg-white/[0.03] hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
                  >
                    <div>
                      <span className="mb-1.5 inline-block rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        {item.category}
                      </span>
                      <h4 className="line-clamp-2 text-sm font-semibold text-gray-100 group-hover:text-white transition-colors">
                        {item.name}
                      </h4>
                      <div className="mt-1.5 text-[11px] text-gray-400 font-medium">
                        {item.vat_enabled ? (item.vat_included ? t('service.vat_included', 'IVA incluso') : t('service.vat_with', 'Com IVA')) : t('service.vat_without', 'Sem IVA')}
                        {item.is_promotional ? ` • ${t('service.promo', 'Promoção')}` : ''}
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-white/5">
                      <span className="text-xs text-gray-500 font-medium">Preço Final</span>
                      <span className="text-lg font-bold font-display text-primary">
                        {finalUnitPrice(item).toFixed(2)} MT
                      </span>
                    </div>
                  </motion.button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Carrinho de Vendas & Pagamento */}
      <div className="flex w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-dark/90 lg:w-[440px] shadow-2xl border-l border-white/15 min-h-[620px] lg:min-h-0 shrink-0">
        <div className="border-b border-white/10 bg-darker p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold font-display text-white tracking-tight flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-inner">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <span>Carrinho de Vendas</span>
            </h2>
            <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
              {cart.length} {cart.length === 1 ? 'item' : 'itens'}
            </span>
          </div>
          <p className="text-xs text-gray-400 font-medium mb-4">
            {t('admin.pos.checkout_sub', 'Configure os dados para emitir a fatura ou recibo de venda.')}
          </p>

          <div className="space-y-3">
            <div className="relative group">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-dark py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                placeholder={t('admin.pos.customer_name_placeholder', 'Nome do cliente (opcional)')}
              />
            </div>
            <div className="p-1.5 bg-black/40 rounded-2xl border border-white/10 grid grid-cols-2 gap-1.5 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setDocumentType('receipt');
                  setToastMessage('Modo configurado: Emissão de Recibo (Pronto Pagamento)');
                  setShowToast(true);
                }}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all duration-300 font-display',
                  documentType === 'receipt'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_25px_rgba(59,130,246,0.5)] border border-blue-500/50 scale-[1.02]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Printer className={cn("h-4 w-4 transition-transform", documentType === 'receipt' ? "scale-110 text-white" : "text-blue-400")} />
                {t('admin.pos.receipt', 'Recibo (Venda)')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDocumentType('invoice');
                  setToastMessage('Modo configurado: Emissão de Fatura (A Pagar / Crédito)');
                  setShowToast(true);
                }}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all duration-300 font-display',
                  documentType === 'invoice'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_25px_rgba(59,130,246,0.5)] border border-blue-500/50 scale-[1.02]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <FileText className={cn("h-4 w-4 transition-transform", documentType === 'invoice' ? "scale-110 text-white" : "text-purple-400")} />
                {t('admin.pos.invoice', 'Fatura (A pagar)')}
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Itens ou Estado Vazio */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between custom-scrollbar">
          <div>
            {message ? (
              <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 flex items-center gap-2.5 shadow-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="font-medium">{message}</span>
              </div>
            ) : null}
            {errorMessage ? (
              <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 shadow-lg">
                {errorMessage}
              </div>
            ) : null}

            {completedDoc ? (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 p-6 shadow-2xl relative">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner shrink-0">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <span className="inline-block rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-1">
                      Venda Concluída
                    </span>
                    <h4 className="text-lg font-bold font-display text-white">{completedDoc.title}</h4>
                    <p className="text-xs text-gray-300">Cliente: {completedDoc.party_name} • {completedDoc.issue_date}</p>
                  </div>
                </div>

                <div className="mb-5 rounded-2xl bg-darker/80 p-4 border border-white/10 flex items-center justify-between text-sm">
                  <span className="text-gray-400 font-medium">Total Pago:</span>
                  <span className="text-xl font-bold font-display text-emerald-400">{completedDoc.total.toFixed(2)} MT</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      void generateBusinessDocumentPdf({
                        id: completedDoc.id,
                        number: completedDoc.number,
                        kind: completedDoc.kind as any,
                        status: 'Paid',
                        source: 'pos',
                        title: completedDoc.title,
                        issueDate: completedDoc.issue_date,
                        paymentMethod: completedDoc.payment_method,
                        vatEnabled: completedDoc.vat_enabled,
                        vatIncluded: completedDoc.vat_included,
                        vatRate: completedDoc.vat_rate,
                        party: { name: completedDoc.party_name },
                        items: completedDoc.items,
                        createdAt: new Date().toISOString(),
                      });
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-darker hover:bg-emerald-400 shadow-lg transition-colors font-display"
                  >
                    <Download className="h-4 w-4 shrink-0" />
                    <span>Baixar PDF Oficial</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompletedDoc(null)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                    <span>Nova Venda</span>
                  </button>
                </div>
              </motion.div>
            ) : null}

            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 bg-white/[0.02] rounded-3xl my-8 py-12">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-5 shadow-inner ring-8 ring-primary/5">
                  <ShoppingBag className="h-10 w-10 animate-pulse" />
                </div>
                <p className="text-base font-bold text-gray-200">{t('admin.pos.cart_empty', 'Carrinho Vazio')}</p>
                <p className="text-xs text-gray-400 mt-2 max-w-[240px] leading-relaxed">
                  Selecione os serviços na grelha ao lado para adicionar ao documento de venda.
                </p>
              </div>
            ) : (
              <div className="space-y-3 my-1">
                {cart.map((entry) => (
                  <div
                    key={entry.item.id}
                    className="group relative flex items-center justify-between rounded-2xl border border-white/10 bg-darker/80 p-4 hover:border-primary/40 hover:bg-white/[0.03] transition-all duration-300 shadow-md"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <h5 className="text-sm font-bold text-white truncate">{entry.item.name}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                          {entry.item.category}
                        </span>
                        <span className="text-xs font-black text-primary">
                          {calculateLineTotals(entry.item, entry.qty).total.toFixed(2)} MT
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-dark p-1 shadow-inner shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQty(entry.item.id, -1)}
                        className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors active:scale-95"
                      >
                        {entry.qty === 1 ? (
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        ) : (
                          <Minus className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-white">{entry.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(entry.item.id, 1)}
                        className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors active:scale-95"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Totais & Seletor de Pagamento — Stripe-style */}
        <div className="border-t border-white/[0.08] bg-[#0d0d0d]/95 p-5 backdrop-blur-xl shadow-2xl">

          {/* Order Summary */}
          <div className="mb-4 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{t('admin.pos.subtotal', 'Subtotal')}</span>
              <span className="tabular-nums text-gray-400">{totals.subtotal.toFixed(2)} MT</span>
            </div>
            {totals.vatAmount > 0 && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>{t('admin.pos.vat', 'IVA')}</span>
                <span className="tabular-nums text-gray-400">{totals.vatAmount.toFixed(2)} MT</span>
              </div>
            )}
            <div className="flex justify-between border-t border-white/[0.06] pt-2.5 mt-1">
              <span className="text-sm font-semibold text-white tracking-tight">{t('admin.pos.total', 'Total a Pagar')}</span>
              <span className="text-sm font-black tabular-nums text-white">{totals.total.toFixed(2)} <span className="text-gray-400 font-semibold">MT</span></span>
            </div>
          </div>

          {/* Payment Method — Stripe-style segmented */}
          <div className="mb-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Método de Pagamento</p>

            {/* Primary method tabs */}
            <div className="flex rounded-xl border border-white/10 bg-black/40 p-1 gap-1 mb-3 shadow-inner">
              {primaryPaymentMethods.map((method) => {
                const Icon = method.icon;
                const isActive =
                  method.id === 'cash'
                    ? paymentMethod === 'cash'
                    : ['mpesa', 'emola', 'mkesh'].includes(paymentMethod);

                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      if (method.id === 'mobile_wallet') {
                        if (!['mpesa', 'emola', 'mkesh'].includes(paymentMethod)) {
                          setPaymentMethod('mpesa');
                        }
                        setShowMobileWallets(true);
                      } else {
                        setPaymentMethod('cash');
                        setShowMobileWallets(false);
                      }
                    }}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-xs font-bold transition-all duration-300 font-display',
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-blue-500/50 scale-[1.02]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0 transition-transform", isActive ? "scale-110 text-white" : "text-blue-400")} />
                    <span>{method.label}</span>
                    {method.id === 'mobile_wallet' && (
                      <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-300 text-white/80', showMobileWallets && isActive ? 'rotate-180' : '')} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile Wallet provider selector */}
            <AnimatePresence>
              {(['mpesa', 'emola', 'mkesh'].includes(paymentMethod) && showMobileWallets) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {mobileWalletMethods.map((method) => {
                      const isActive = paymentMethod === method.id;
                      return (
                        <motion.button
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className={cn(
                            'group relative flex flex-col items-center gap-1.5 rounded-xl border py-3 px-2 transition-all duration-200',
                            isActive
                              ? `${method.activeBorder} ${method.activeBg} ${method.activeGlow}`
                              : 'border-white/[0.07] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
                          )}
                        >
                          {/* Logo — full-bleed, no white bg, no border */}
                          <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden">
                            <img
                              src={method.logo}
                              alt={method.label}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.style.background = '#1a1a1a';
                                  parent.innerHTML = `<span style="font-size:9px;font-weight:800;color:#fff;letter-spacing:-0.5px;display:flex;align-items:center;justify-content:center;height:100%">${method.label}</span>`;
                                }
                              }}
                            />
                          </div>
                          <span className={cn('text-[11px] font-bold leading-none', isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200')}>{method.label}</span>
                          <span className="text-[9px] uppercase tracking-widest text-gray-600 font-medium">{method.tag}</span>
                          {isActive && (
                            <motion.div
                              layoutId="walletActive"
                              className={cn('absolute -top-px left-0 right-0 h-[2px] rounded-full', method.color.replace('text-', 'bg-'))}
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Checkout CTA */}
          <motion.button
            type="button"
            onClick={() => {
              if (cart.length === 0) {
                setErrorMessage('Carrinho Vazio: Selecione pelo menos um serviço na grelha ao lado para adicionar ao documento.');
                return;
              }
              setErrorMessage('');
              if (paymentMethod === 'mobile_wallet') {
                setPaymentMethod('mpesa');
              }
              setWalletStep('idle');
              setAmountReceived('');
              setIsPaymentModalOpen(true);
            }}
            whileHover={{ scale: cart.length === 0 ? 1 : 1.015 }}
            whileTap={{ scale: cart.length === 0 ? 1 : 0.985 }}
            className={cn(
              'flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-base font-bold transition-all duration-300 font-display tracking-tight shadow-xl',
              cart.length === 0
                ? 'bg-gray-800 text-gray-400 border border-white/10 hover:bg-gray-700 hover:text-gray-200 shadow-none'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 hover:shadow-[0_0_35px_rgba(59,130,246,0.5)] active:scale-[0.985]'
            )}
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ArrowRight className={cn("h-5 w-5", cart.length === 0 ? "text-gray-500" : "text-white")} />
            )}
            <span>
              {saving ? 'A processar...' : cart.length === 0 ? 'Selecione Serviços para Começar' : `Proceder para Pagamento — ${totals.total.toFixed(2)} MT`}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Modal Interativo de Pagamento */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-darker p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            >
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6 border-b border-white/10 pb-6">
                <span className="inline-block rounded-full bg-primary/20 border border-primary/30 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary mb-2">
                  {paymentMethod === 'cash' ? 'Pronto Pagamento no Local' : 'Pagamento Móvel Integrado'}
                </span>
                <h3 className="text-2xl font-bold font-display text-white tracking-tight">
                  {paymentMethod === 'cash' ? 'Pagamento em Dinheiro' : `Carteira Móvel • ${paymentMethod.toUpperCase()}`}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {paymentMethod === 'cash' ? 'Insira o valor entregue pelo cliente para calcular o troco devido em tempo real.' : 'Introduza o número de celular do cliente para solicitar autorização de débito via push.'}
                </p>
              </div>

              {/* Resumo do Total */}
              <div className="mb-6 flex items-center justify-between rounded-2xl bg-dark p-5 border border-white/10 shadow-inner">
                <div>
                  <span className="text-xs font-medium text-gray-400">Total a Pagar</span>
                  <div className="text-2xl font-bold font-display text-white">{totals.total.toFixed(2)} MT</div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  {paymentMethod === 'cash' ? <Banknote className="h-6 w-6" /> : <Smartphone className="h-6 w-6" />}
                </div>
              </div>

              {/* Formulários de Dinheiro vs Carteira Móvel */}
              {paymentMethod === 'cash' ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                      Valor Recebido do Cliente (MT)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">MT</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Ex: 3000.00"
                        value={amountReceived}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/[^0-9.]/g, '');
                          const parts = clean.split('.');
                          if (parts.length > 2) return;
                          setAmountReceived(clean);
                        }}
                        className="w-full rounded-2xl border border-white/10 bg-dark py-4 pl-14 pr-4 text-xl font-bold text-white transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none shadow-inner"
                        autoFocus
                      />
                    </div>
                  </div>

                  {(() => {
                    const numericReceived = parseFloat(amountReceived) || 0;
                    const change = numericReceived - totals.total;
                    const isInsufficient = amountReceived.trim() !== '' && numericReceived < totals.total;

                    return (
                      <div className="space-y-4">
                        {isInsufficient && (
                          <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm font-medium text-amber-200 shadow-lg">
                            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
                            <span>Valor recebido é insuficiente (faltam {(totals.total - numericReceived).toFixed(2)} MT)</span>
                          </div>
                        )}

                        {numericReceived >= totals.total && (
                          <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-5 text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.15)] transition-all">
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">Troco a Devolver</span>
                              <span className="text-3xl font-black font-display text-emerald-300">{change.toFixed(2)} MT</span>
                            </div>
                            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={numericReceived < totals.total || saving}
                          onClick={() => void handleConfirmPayment()}
                          className={cn(
                            "flex w-full items-center justify-center gap-3 rounded-2xl py-4 font-bold text-base transition-all duration-300 shadow-xl",
                            numericReceived < totals.total || saving
                              ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5"
                              : "bg-emerald-500 text-darker hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] font-display active:scale-[0.99]"
                          )}
                        >
                          {saving && <Loader2 className="h-5 w-5 animate-spin" />}
                          <Banknote className="h-5 w-5" />
                          <span>{saving ? "A processar pagamento..." : "Confirmar Recebimento e Emitir Recibo"}</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-6">
                  {walletStep === 'idle' && (
                    <div className="space-y-6">
                      {pushTimedOut && (
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm space-y-3 shadow-lg transition-all animate-in fade-in zoom-in-95 duration-300">
                          <div className="flex items-center gap-2.5 font-bold">
                            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                            <span>Tempo de espera esgotado (60s sem confirmação)</span>
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed">O cliente não introduziu o PIN de confirmação no celular a tempo.</p>
                          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                            <button
                              type="button"
                              onClick={handleProcessMobileWallet}
                              className="flex-1 py-2.5 bg-red-500 text-darker font-bold rounded-xl text-xs hover:bg-red-400 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] text-center font-display"
                            >
                              Tentar Novamente
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPushTimedOut(false);
                                setPaymentMethod('cash');
                              }}
                              className="flex-1 py-2.5 bg-white/10 text-white font-bold rounded-xl text-xs hover:bg-white/20 transition-all border border-white/15 text-center font-display"
                            >
                              Trocar para Dinheiro
                            </button>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                          Número de Celular Moçambique (+258)
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold flex items-center gap-2.5">
                            <span className="text-base">🇲🇿</span>
                            <span className="text-base font-bold">+258</span>
                          </span>
                          <input
                            type="tel"
                            placeholder="Ex: 84 123 4567"
                            value={phoneNumber}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                              let formatted = digits;
                              if (digits.length > 2) formatted = digits.slice(0, 2) + ' ' + digits.slice(2);
                              if (digits.length > 5) formatted = digits.slice(0, 2) + ' ' + digits.slice(2, 5) + ' ' + digits.slice(5);
                              setPhoneNumber(formatted);
                              setPhoneError('');
                            }}
                            className="w-full rounded-2xl border border-white/10 bg-dark py-4 pl-24 pr-4 text-lg font-bold font-mono text-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-inner"
                            autoFocus
                          />
                        </div>
                        {phoneError && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-red-400 font-medium animate-in fade-in">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{phoneError}</span>
                          </div>
                        )}
                        <p className="mt-2 text-xs text-gray-400 leading-relaxed">
                          Operadoras compatíveis: Vodacom (84/85), Tmcel (82/83) e Movitel (86/87). O cliente receberá um prompt no celular para inserir o PIN.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleProcessMobileWallet}
                        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 font-bold text-white hover:from-blue-500 hover:to-indigo-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-300 text-base font-display shadow-xl active:scale-[0.99]"
                      >
                        <Smartphone className="h-5 w-5" />
                        <span>Pagar com {paymentMethod.toUpperCase()}</span>
                      </button>
                    </div>
                  )}

                  {walletStep === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in duration-300">
                      <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
                        <Smartphone className="absolute h-6 w-6 text-blue-300 animate-pulse" />
                      </div>
                      <h4 className="text-xl font-bold text-white mb-2 font-display">Aguardando Confirmação no Celular...</h4>
                      <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-6">
                        Um prompt seguro foi enviado para <span className="text-white font-bold font-mono">+258 {phoneNumber}</span>. Peça ao cliente para digitar o PIN.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
                          if (pushTimeoutRef.current) window.clearTimeout(pushTimeoutRef.current);
                          setWalletStep('idle');
                        }}
                        className="px-5 py-2.5 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/10"
                      >
                        Cancelar e Voltar para Opções
                      </button>
                    </div>
                  )}

                  {walletStep === 'success' && (
                    <div className="space-y-6 py-4 text-center animate-in zoom-in-95 duration-300">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                        <CheckCircle2 className="h-10 w-10" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-white mb-1 font-display">Transação Aprovada!</h4>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-mono">Ref: {transactionRef}</p>
                      </div>
                      <div className="rounded-2xl bg-dark p-4 border border-white/5 text-sm text-gray-300 flex items-center justify-between shadow-inner">
                        <span>Valor Debitado:</span>
                        <span className="font-bold font-mono text-emerald-400">{totals.total.toFixed(2)} MT</span>
                      </div>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void handleConfirmPayment()}
                        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500 py-4 font-bold text-darker hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300 text-base font-display shadow-xl active:scale-[0.99]"
                      >
                        {saving && <Loader2 className="h-5 w-5 animate-spin" />}
                        <Printer className="h-5 w-5" />
                        <span>{saving ? "A emitir recibo oficial..." : "Emitir Recibo Oficial"}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast flutuante de sucesso */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-50 flex items-center gap-4 rounded-2xl bg-emerald-500 border border-emerald-400 p-5 text-darker shadow-[0_10px_50px_rgba(16,185,129,0.6)] font-display"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-dark text-emerald-400 shadow-inner shrink-0">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h5 className="font-extrabold text-base tracking-tight">Transação Concluída com Sucesso!</h5>
              <p className="text-xs text-darker/80 font-bold mt-0.5">{toastMessage || "Recibo emitido e salvo no histórico."}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowToast(false)}
              className="ml-3 rounded-lg p-1.5 text-darker/70 hover:text-darker hover:bg-black/10 transition-colors shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
