import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Filter, Loader2, Receipt, Search, X, Plus, CheckCircle2 } from 'lucide-react';
import { type BusinessDocument } from '../../lib/documentCenter';
import { generateBusinessDocumentPdf } from '../../lib/pdfMachine';
import { fetchBusinessDocuments, createBusinessDocument, type BusinessDocumentRow } from '../../lib/adminData';
import { useLanguage } from '../../providers/LanguageProvider';

type BillingTab = 'all' | 'with_vat' | 'without_vat' | 'invoice' | 'receipt';

const formatMoney = (value: number) =>
  `${new Intl.NumberFormat('pt-MZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} MT`;

const toPdfDocument = (document: BusinessDocumentRow): BusinessDocument => ({
  id: document.id,
  number: document.number,
  kind: document.kind,
  status: document.status as BusinessDocument['status'],
  source: document.source as BusinessDocument['source'],
  title: document.title,
  issueDate: document.issue_date,
  dueDate: document.due_date ?? undefined,
  paymentMethod: (document.payment_method as BusinessDocument['paymentMethod']) ?? undefined,
  vatEnabled: document.vat_enabled,
  vatIncluded: document.vat_included,
  vatRate: document.vat_rate,
  party: {
    name: document.party_name,
    taxId: document.party_tax_id ?? undefined,
    email: document.party_email ?? undefined,
    phone: document.party_phone ?? undefined,
    address: document.party_address ?? undefined,
  },
  items: (document.business_document_items ?? []).map((item) => ({
    id: item.id,
    description: item.description,
    details: item.details ?? undefined,
    quantity: item.quantity,
    unitPrice: item.unit_price,
  })),
  notes: document.notes ?? undefined,
  body: document.body ?? undefined,
  createdAt: document.created_at,
});

export default function Billing() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<BusinessDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BillingTab>('all');
  const [search, setSearch] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<BusinessDocumentRow | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [message, setMessage] = useState('');

  // New Document Modal States
  const [isNewDocOpen, setIsNewDocOpen] = useState(false);
  const [newDocKind, setNewDocKind] = useState<'invoice' | 'receipt'>('invoice');
  const [creatingDoc, setCreatingDoc] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyNuit, setNewPartyNuit] = useState('');
  const [newDescription, setNewDescription] = useState('Serviços de Lavagem e Estética Automotiva');
  const [newAmount, setNewAmount] = useState('850');
  const [newPaymentMethod, setNewPaymentMethod] = useState('cash');
  const [newVatEnabled, setNewVatEnabled] = useState(true);

  const tabs = useMemo<Array<{ id: BillingTab; label: string }>>(() => [
    { id: 'all', label: t('admin.billing.tab_all') },
    { id: 'with_vat', label: t('admin.billing.tab_with_vat') },
    { id: 'without_vat', label: t('admin.billing.tab_without_vat') },
    { id: 'invoice', label: t('admin.billing.tab_invoices') },
    { id: 'receipt', label: t('admin.billing.tab_receipts') },
  ], [t]);

  const handleExportCsv = () => {
    if (documents.length === 0) return;
    const header = ['Número', 'Tipo', 'Categoria IVA', 'Entidade', 'Data', 'Status', 'Valor (MT)'];
    const rows = documents.map(d => [
      `"${d.number}"`,
      `"${d.kind}"`,
      `"${d.report_category}"`,
      `"${d.party_name}"`,
      `"${d.issue_date}"`,
      `"${d.status}"`,
      d.total
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `faturacao_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenModal = (kind: 'invoice' | 'receipt') => {
    setNewDocKind(kind);
    setIsNewDocOpen(true);
    setNewPartyName('');
    setNewPartyNuit('');
    setNewDescription(kind === 'invoice' ? 'Serviços de Estética Automotiva' : 'Pagamento de Lavagem Completa');
    setNewAmount('850');
    setErrorMessage('');
    setMessage('');
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartyName || !newAmount) {
      setErrorMessage('Por favor, preencha o nome da entidade e o valor.');
      return;
    }
    setCreatingDoc(true);
    setErrorMessage('');
    setMessage('');
    try {
      const amt = parseFloat(newAmount) || 0;
      const vatRate = newVatEnabled ? 16 : 0;
      const vatAmount = newVatEnabled ? amt * 0.16 : 0;
      const subtotal = amt;
      const total = amt + vatAmount;
      const prefix = newDocKind === 'invoice' ? 'FT' : 'RC';
      const number = `${prefix}-2026/${Math.floor(1000 + Math.random() * 9000)}`;

      await createBusinessDocument({
        number,
        kind: newDocKind,
        report_category: newVatEnabled ? 'with_vat' : 'without_vat',
        status: newDocKind === 'invoice' ? 'Pending' : 'Paid',
        source: 'manual',
        title: newDocKind === 'invoice' ? 'Fatura Comercial' : 'Recibo de Pagamento',
        party_name: newPartyName,
        party_tax_id: newPartyNuit || null,
        payment_method: newPaymentMethod,
        vat_enabled: newVatEnabled,
        vat_included: false,
        vat_rate: vatRate,
        subtotal,
        vat_amount: vatAmount,
        total,
        items: [
          {
            description: newDescription,
            quantity: 1,
            unit_price: amt,
            line_total: amt,
          }
        ]
      });

      const nextDocuments = await fetchBusinessDocuments();
      setDocuments(nextDocuments);
      setIsNewDocOpen(false);
      setMessage(newDocKind === 'invoice' ? `Fatura ${number} criada com sucesso!` : `Recibo ${number} emitido com sucesso!`);
    } catch (err) {
      console.error('Failed to create document', err);
      setErrorMessage('Erro ao emitir documento comercial.');
    } finally {
      setCreatingDoc(false);
    }
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const nextDocuments = await fetchBusinessDocuments();
        if (active) {
          setDocuments(nextDocuments);
        }
      } catch (error) {
        console.error('Failed to load billing documents', error);
        if (active) {
          setErrorMessage(t('admin.billing.error_load'));
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

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      const matchesTab =
        activeTab === 'all'
          ? true
          : activeTab === 'with_vat' || activeTab === 'without_vat'
          ? document.report_category === activeTab
          : document.kind === activeTab;

      const haystack = `${document.number} ${document.title} ${document.party_name}`.toLowerCase();
      return matchesTab && haystack.includes(search.toLowerCase());
    });
  }, [activeTab, documents, search]);

  const totals = {
    withVat: documents
      .filter((document) => document.report_category === 'with_vat')
      .reduce((sum, document) => sum + document.total, 0),
    withoutVat: documents
      .filter((document) => document.report_category === 'without_vat')
      .reduce((sum, document) => sum + document.total, 0),
    pending: documents
      .filter((document) => document.kind === 'invoice' && document.status !== 'Paid')
      .reduce((sum, document) => sum + document.total, 0),
    receipts: documents
      .filter((document) => document.kind === 'receipt')
      .reduce((sum, document) => sum + document.total, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold font-display">{t('admin.billing.title')}</h1>
          <p className="text-gray-400">
            {t('admin.billing.sub')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleOpenModal('invoice')}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-bold text-white hover:bg-primary-hover shadow-lg transition-all font-display"
          >
            <Plus className="h-5 w-5" />
            <span>Nova Fatura</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenModal('receipt')}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white hover:bg-emerald-500 shadow-lg transition-all font-display"
          >
            <Receipt className="h-5 w-5" />
            <span>Emitir Recibo</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-medium text-white transition-colors hover:bg-white/10 shadow-sm"
          >
            <Download className="h-5 w-5" />
            {t('admin.billing.export')}
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200 flex items-center gap-2">
          {errorMessage}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <span>{message}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <SummaryCard label={t('admin.billing.stat_with_vat')} value={formatMoney(totals.withVat)} />
        <SummaryCard label={t('admin.billing.stat_without_vat')} value={formatMoney(totals.withoutVat)} />
        <SummaryCard label={t('admin.billing.stat_pending')} value={formatMoney(totals.pending)} />
        <SummaryCard label={t('admin.billing.stat_receipts')} value={formatMoney(totals.receipts)} />
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-dark">
        <div className="flex flex-col gap-4 border-b border-white/10 bg-darker/50 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('admin.billing.search_placeholder')}
                className="w-full rounded-lg border border-white/10 bg-dark py-2 pl-9 pr-4 text-sm text-white focus:border-primary focus:outline-none"
              />
            </div>
            <button className="rounded-lg border border-white/10 bg-dark p-2 text-gray-400 transition-colors hover:text-white">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-darker/30 text-gray-400">
                  <th className="p-4 font-medium">{t('admin.billing.th_document')}</th>
                  <th className="p-4 font-medium">{t('admin.billing.th_type')}</th>
                  <th className="p-4 font-medium">{t('admin.billing.th_vat_cat')}</th>
                  <th className="p-4 font-medium">{t('admin.billing.th_entity')}</th>
                  <th className="p-4 font-medium">{t('admin.billing.th_date')}</th>
                  <th className="p-4 font-medium">{t('admin.billing.th_status')}</th>
                  <th className="p-4 font-medium text-right">{t('admin.billing.th_value')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((document) => (
                  <tr
                    key={document.id}
                    onClick={() => setSelectedDocument(document)}
                    className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/5"
                  >
                    <td className="p-4 font-mono text-primary">{document.number}</td>
                    <td className="p-4 text-gray-300">{t(`document.kind.${document.kind}`)}</td>
                    <td className="p-4">
                      <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-300">
                        {document.report_category === 'with_vat' ? t('admin.billing.modal_with_vat') : t('admin.billing.modal_without_vat')}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-white">{document.party_name}</td>
                    <td className="p-4 text-gray-400">{document.issue_date}</td>
                    <td className="p-4">
                      <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        {document.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-white">{formatMoney(document.total)}</td>
                  </tr>
                ))}
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      {t('admin.billing.empty_list')}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedDocument ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-darker p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedDocument(null)}
              className="absolute right-6 top-6 text-gray-400 transition-colors hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {selectedDocument.kind === 'receipt' ? (
                  <Receipt className="h-6 w-6" />
                ) : (
                  <FileText className="h-6 w-6" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold font-display text-white">{t('admin.billing.modal_title')}</h2>
                <p className="font-mono text-sm text-gray-400">{selectedDocument.number}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DetailBox label={t('admin.billing.th_entity')} value={selectedDocument.party_name} />
              <DetailBox label={t('admin.billing.th_type')} value={t(`document.kind.${selectedDocument.kind}`)} />
              <DetailBox label={t('admin.billing.th_vat_cat')} value={selectedDocument.report_category === 'with_vat' ? t('admin.billing.modal_with_vat') : t('admin.billing.modal_without_vat')} />
              <DetailBox label={t('admin.catalog.toggle_vat_included')} value={selectedDocument.vat_included ? t('admin.billing.modal_yes') : t('admin.billing.modal_no')} />
              <DetailBox label={t('admin.catalog.field_vat_rate')} value={selectedDocument.vat_enabled ? `${selectedDocument.vat_rate}%` : '0%'} />
              <DetailBox label={t('admin.billing.th_status')} value={selectedDocument.status} />
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-dark p-4">
              <div className="mb-3 text-sm text-gray-400">{t('admin.billing.modal_items_title')}</div>
              <div className="space-y-3">
                {(selectedDocument.business_document_items ?? []).length > 0 ? (
                  selectedDocument.business_document_items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 text-sm">
                      <div>
                        <div className="font-medium text-white">{item.description}</div>
                        {item.details ? <div className="text-gray-500">{item.details}</div> : null}
                      </div>
                      <div className="text-right text-gray-300">
                        {item.quantity} x {formatMoney(item.unit_price)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">
                    {t('admin.billing.modal_items_empty')}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <DetailBox label={t('admin.billing.modal_subtotal')} value={formatMoney(selectedDocument.subtotal)} />
              <DetailBox label={t('admin.billing.modal_vat')} value={formatMoney(selectedDocument.vat_amount)} />
              <DetailBox label={t('admin.billing.modal_total')} value={formatMoney(selectedDocument.total)} highlight />
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedDocument(null)}
                className="flex-1 rounded-xl bg-white/5 px-4 py-3 font-medium text-white transition-colors hover:bg-white/10"
              >
                {t('admin.billing.modal_close')}
              </button>
              <button
                type="button"
                onClick={() => void generateBusinessDocumentPdf(toPdfDocument(selectedDocument))}
                className="flex-1 rounded-xl bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-hover"
              >
                {t('admin.billing.modal_download')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* New Document Modal */}
      {isNewDocOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-darker p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsNewDocOpen(false)}
              className="absolute right-6 top-6 text-gray-400 transition-colors hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {newDocKind === 'invoice' ? <FileText className="h-6 w-6" /> : <Receipt className="h-6 w-6" />}
              </div>
              <div>
                <h2 className="text-xl font-bold font-display text-white">
                  {newDocKind === 'invoice' ? 'Nova Fatura Comercial' : 'Emitir Recibo de Pagamento'}
                </h2>
                <p className="text-xs text-gray-400">Preencha os dados para emissão oficial com certificação</p>
              </div>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">
                  Nome da Entidade / Cliente <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPartyName}
                  onChange={(e) => setNewPartyName(e.target.value)}
                  placeholder="Ex: Auto Viação Lda ou João Silva"
                  className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">
                    NUIT (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newPartyNuit}
                    onChange={(e) => setNewPartyNuit(e.target.value)}
                    placeholder="Ex: 400123456"
                    className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">
                    Valor Total (MT) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="Ex: 1500.00"
                    className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none font-mono font-bold text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">
                  Descrição do Serviço / Item
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Ex: Lavagem Premium e Enceramento"
                  className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">Método de Pagamento</label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white focus:border-primary focus:outline-none"
                  >
                    <option value="cash">Numerário (Cash)</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="emola">e-Mola</option>
                    <option value="mkesh">mKesh</option>
                    <option value="card">Cartão TPA / POS</option>
                    <option value="bank-transfer">Transferência Bancária</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">Aplicação de IVA</label>
                  <select
                    value={newVatEnabled ? 'yes' : 'no'}
                    onChange={(e) => setNewVatEnabled(e.target.value === 'yes')}
                    className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white focus:border-primary focus:outline-none"
                  >
                    <option value="yes">Aplicar IVA (16%)</option>
                    <option value="no">Isento de IVA (0%)</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewDocOpen(false)}
                  className="flex-1 rounded-xl bg-white/5 px-4 py-3 font-medium text-white transition-colors hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingDoc}
                  className="flex-1 rounded-xl bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creatingDoc ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                  <span>{creatingDoc ? 'Emitindo...' : 'Confirmar Emissão'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-dark p-6">
      <h3 className="mb-2 text-sm font-medium text-gray-400">{label}</h3>
      <p className="text-2xl font-bold font-display text-white">{value}</p>
    </div>
  );
}

function DetailBox({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight ? 'border-primary/20 bg-primary/10' : 'border-white/10 bg-dark'
      }`}
    >
      <div className="mb-1 text-sm text-gray-400">{label}</div>
      <div className="font-medium text-white">{value}</div>
    </div>
  );
}
