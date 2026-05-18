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
  Wallet,
  Smartphone,
  ChevronDown,
  CheckCircle2,
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
    icon: Wallet, 
    color: 'text-rose-500',
    activeBg: 'bg-rose-500/10',
    activeBorder: 'border-rose-500',
    activeGlow: 'shadow-[0_0_20px_rgba(244,63,94,0.25)]',
    badgeColor: 'text-rose-500 bg-rose-500/20',
  },
  { 
    id: 'emola' as const, 
    label: 'E-Mola', 
    tag: 'Movitel',
    icon: QrCode, 
    color: 'text-amber-500',
    activeBg: 'bg-amber-500/10',
    activeBorder: 'border-amber-500',
    activeGlow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    badgeColor: 'text-amber-500 bg-amber-500/20',
  },
  { 
    id: 'mkesh' as const, 
    label: 'Mkesh', 
    tag: 'Tmcel',
    icon: Smartphone, 
    color: 'text-cyan-400',
    activeBg: 'bg-cyan-500/10',
    activeBorder: 'border-cyan-500',
    activeGlow: 'shadow-[0_0_20px_rgba(6,182,212,0.25)]',
    badgeColor: 'text-cyan-400 bg-cyan-500/20',
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

          {/* Payment Methods Section - Premium SaaS Fintech Design */}
          <div className="mb-6 rounded-2xl border border-white/10 bg-darker/60 p-5 backdrop-blur-md shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <CreditCard className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-200 font-display">
                  Método de Pagamento
                </h3>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-gray-400">
                {paymentMethod === 'cash' ? 'Dinheiro' : 'Carteira Móvel'}
              </span>
            </div>

            {/* Primary Payment Methods */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              {primaryPaymentMethods.map((method) => {
                const Icon = method.icon;
                const isActive =
                  method.id === 'cash'
                    ? paymentMethod === 'cash'
                    : ['mpesa', 'emola', 'mkesh'].includes(paymentMethod);

                return (
                  <motion.button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      if (method.id === 'mobile_wallet') {
                        if (!['mpesa', 'emola', 'mkesh'].includes(paymentMethod)) {
                          setPaymentMethod('mpesa');
                          setShowMobileWallets(true);
                        } else {
                          setShowMobileWallets(!showMobileWallets);
                        }
                      } else {
                        setPaymentMethod('cash');
                        setShowMobileWallets(false);
                      }
                    }}
                    className={cn(
                      'group relative flex flex-col p-4 rounded-xl border text-left transition-all duration-300 overflow-hidden',
                      isActive
                        ? `${method.activeBorder} ${method.activeBg} ${method.activeGlow}`
                        : 'border-white/10 bg-dark/60 hover:border-white/20 hover:bg-white/[0.04]'
                    )}
                    whileHover={{ scale: 1.015, y: -2 }}
                    whileTap={{ scale: 0.985 }}
                  >
                    {/* Active Glow Top Accent Line */}
                    {isActive && (
                      <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent', method.color)} />
                    )}

                    <div className="flex items-start justify-between w-full mb-3">
                      <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg transition-colors', isActive ? method.badgeColor : 'bg-white/5 text-gray-400 group-hover:text-gray-200')}>
                        <Icon className="h-6 w-6" />
                      </div>
                      {isActive ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={cn('flex h-6 w-6 items-center justify-center rounded-full', method.badgeColor)}>
                          <CheckCircle2 className="h-4 w-4" />
                        </motion.div>
                      ) : method.hasSubMethods ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-gray-500 group-hover:text-gray-300 transition-colors">
                          <ChevronDown className={cn('h-4 w-4 transition-transform duration-300', showMobileWallets && ['mpesa', 'emola', 'mkesh'].includes(paymentMethod) ? 'rotate-180' : '')} />
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <div className="text-base font-bold text-white tracking-tight">{method.label}</div>
                      <div className="text-xs text-gray-400 font-medium mt-0.5">{method.subtitle}</div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Mobile Wallet Sub-Methods */}
            <AnimatePresence>
              {(['mpesa', 'emola', 'mkesh'].includes(paymentMethod) && showMobileWallets) && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="mb-2.5 flex items-center justify-between text-xs text-gray-400 font-medium">
                      <span>Selecione o operador móvel:</span>
                      <span className="text-primary font-semibold">1 ativo por vez</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {mobileWalletMethods.map((method) => {
                        const Icon = method.icon;
                        const isActive = paymentMethod === method.id;

                        return (
                          <motion.button
                            key={method.id}
                            type="button"
                            onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                            className={cn(
                              'group relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 text-left overflow-hidden',
                              isActive
                                ? `${method.activeBorder} ${method.activeBg} ${method.activeGlow}`
                                : 'border-white/10 bg-dark/40 hover:border-white/20 hover:bg-white/[0.04]'
                            )}
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {isActive && (
                              <div className={cn('absolute top-0 bottom-0 left-0 w-1 bg-current', method.color)} />
                            )}
                            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors', isActive ? method.badgeColor : 'bg-white/5 text-gray-400 group-hover:text-gray-200')}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-sm font-bold text-white truncate">{method.label}</span>
                                {isActive && <CheckCircle2 className={cn('h-3.5 w-3.5 shrink-0', method.color)} />}
                              </div>
                              <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 block">{method.tag}</span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            type="button"
            disabled={cart.length === 0 || saving}
            onClick={() => void handleCheckout()}
            whileHover={{ scale: cart.length === 0 || saving ? 1 : 1.02 }}
            whileTap={{ scale: cart.length === 0 || saving ? 1 : 0.98 }}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-semibold transition-all duration-200 text-base shadow-lg',
              cart.length === 0 || saving
                ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed border border-white/5'
                : 'bg-primary text-white hover:shadow-primary/30'
            )}
          >
            {saving && <Loader2 className="h-5 w-5 animate-spin" />}
            <span>{saving ? t('admin.pos.checkout_saving') : t('admin.pos.checkout_button')}</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
