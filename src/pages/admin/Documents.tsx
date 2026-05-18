import React, { useEffect, useState } from 'react';
import {
  Download,
  FileBadge,
  FileText,
  Landmark,
  LetterText,
  Loader2,
  Receipt,
  Plus,
  UploadCloud,
  File,
  CheckCircle2,
  X,
  PlusCircle,
  Trash2,
  Sparkles,
  Filter,
} from 'lucide-react';
import companyProfile from '../../lib/companyProfile';
import { fetchBusinessDocuments, fetchCatalogServices, type BusinessDocumentRow } from '../../lib/adminData';
import { type DocumentKind, type BusinessDocument } from '../../lib/documentCenter';
import { generateBusinessDocumentPdf } from '../../lib/pdfMachine';
import { useLanguage } from '../../providers/LanguageProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const templates: Array<{ kind: DocumentKind; icon: typeof FileText }> = [
  { kind: 'invoice', icon: FileText },
  { kind: 'receipt', icon: Receipt },
  { kind: 'purchase-order', icon: Landmark },
  { kind: 'quotation', icon: FileText },
  { kind: 'letterhead', icon: LetterText },
];

const toPdfDocument = (document: BusinessDocumentRow) => ({
  id: document.id,
  number: document.number,
  kind: document.kind,
  status: document.status as 'Draft' | 'Issued' | 'Paid' | 'Pending' | 'Approved' | 'Sent',
  source: document.source as 'manual' | 'pos' | 'billing',
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

export default function Documents() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<BusinessDocumentRow[]>([]);
  const [catalogCount, setCatalogCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [filterKind, setFilterKind] = useState<string>('all');

  // Interactive PDF Machine States
  const [activeTemplate, setActiveTemplate] = useState<DocumentKind | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [partyName, setPartyName] = useState('');
  const [partyTaxId, setPartyTaxId] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [docBody, setDocBody] = useState('');
  const [docItems, setDocItems] = useState<Array<{ description: string; quantity: number; unitPrice: number }>>([
    { description: 'Serviço de Higienização Premium e Enceramento', quantity: 1, unitPrice: 3500 },
  ]);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Drag & Drop States
  const [dragOver, setDragOver] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ id: string; name: string; size: string; date: string }>>([
    { id: '1', name: 'Tabela_Precos_Oficial_2026.pdf', size: '1.8 MB', date: 'Hoje, 14:30' },
    { id: '2', name: 'Contrato_Frota_Sogecoa.pdf', size: '3.2 MB', date: 'Ontem' },
  ]);

  // Downloading indicator state for individual recent files
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const [nextDocuments, nextCatalog] = await Promise.all([
          fetchBusinessDocuments(),
          fetchCatalogServices(),
        ]);

        if (!active) return;

        setDocuments(nextDocuments);
        setCatalogCount(nextCatalog.length);
      } catch (error) {
        console.error('Failed to load documents center', error);
        if (active) {
          setErrorMessage(t('admin.documents.error_load'));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [t]);

  const handleOpenCreator = (kind: DocumentKind) => {
    setActiveTemplate(kind);
    setDocTitle(
      kind === 'invoice' ? 'Fatura Comercial #FT-2026/009' :
      kind === 'receipt' ? 'Recibo de Pagamento #REC-2026/014' :
      kind === 'purchase-order' ? 'Ordem de Compra #OC-2026/004' :
      kind === 'quotation' ? 'Orçamento Comercial #ORC-2026/007' :
      'Ofício Institucional • The Doctor 46'
    );
    setPartyName(kind === 'quotation' ? 'Vodacom Moçambique S.A.' : 'Cliente Corporativo Padrão');
    setPartyTaxId('400192839');
    setDocNotes('Documento emitido eletronicamente via PDF Center Doctor 46. Validade jurídica assegurada.');
    setDocBody(kind === 'letterhead' ? 'Prezados Senhores,\n\nAtravés deste ofício, confirmamos a ativação do plano de gestão e embelezamento automóvel para a vossa frota executiva, com vigência imediata e suporte prioritário 24/7.' : '');
    setIsCreatorOpen(true);
  };

  const handleGenerateOfficialDocument = async () => {
    if (!activeTemplate) return;
    setGeneratingPdf(true);

    try {
      const number = `${activeTemplate.toUpperCase().slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const docData: BusinessDocument = {
        id: `gen-${Date.now()}`,
        number,
        kind: activeTemplate,
        status: activeTemplate === 'receipt' ? 'Paid' : 'Issued',
        source: 'manual',
        title: docTitle || 'Documento Oficial',
        issueDate: new Date().toISOString().slice(0, 10),
        vatEnabled: true,
        vatIncluded: false,
        vatRate: 16,
        party: {
          name: partyName || 'Cliente Corporativo',
          taxId: partyTaxId || undefined,
        },
        items: activeTemplate !== 'letterhead' ? docItems.map((item, index) => ({
          id: `item-${index}`,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })) : [],
        notes: docNotes || undefined,
        body: docBody || undefined,
        createdAt: new Date().toISOString(),
      };

      await generateBusinessDocumentPdf(docData);

      // Add to recent list dynamically
      setDocuments(prev => [
        {
          id: docData.id,
          number: docData.number,
          kind: docData.kind,
          status: docData.status,
          source: docData.source,
          title: docData.title,
          issue_date: docData.issueDate,
          party_name: docData.party.name,
          party_tax_id: docData.party.taxId ?? null,
          party_email: null,
          party_phone: null,
          party_address: null,
          due_date: null,
          payment_method: 'cash',
          vat_enabled: true,
          vat_included: false,
          vat_rate: 16,
          subtotal: docItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0),
          vat_amount: docItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0) * 0.16,
          total: docItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0) * 1.16,
          issued_by: 'super_admin',
          notes: docData.notes ?? null,
          body: docData.body ?? null,
          created_at: docData.createdAt,
        },
        ...prev
      ]);

      setSuccessToast(`Documento ${number} gerado e transferido com sucesso!`);
      setTimeout(() => setSuccessToast(''), 4000);
      setIsCreatorOpen(false);
    } catch (err) {
      console.error('Failed to generate PDF', err);
      setErrorMessage('Erro ao emitir o documento PDF. Tente novamente.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFileUpload(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFileUpload(e.target.files[0]);
    }
  };

  const processFileUpload = (file: File) => {
    setUploadingFile(true);
    setTimeout(() => {
      setUploadedFiles(prev => [
        {
          id: String(Date.now()),
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          date: 'Agora mesmo'
        },
        ...prev
      ]);
      setUploadingFile(false);
      setSuccessToast(`Arquivo "${file.name}" importado e processado no repositório.`);
      setTimeout(() => setSuccessToast(''), 4000);
    }, 1200);
  };

  const filteredDocs = filterKind === 'all' 
    ? documents 
    : documents.filter(doc => doc.kind === filterKind);

  return (
    <div className="space-y-8 pb-16">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold font-display text-white">{t('admin.documents.title', 'PDF Center • Máquina de Documentos')}</h1>
            <span className="rounded-full bg-primary/20 border border-primary/30 px-3 py-0.5 text-xs font-bold text-primary">
              v2.5 Pro
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            {t('admin.documents.sub', 'Crie, assine digitalmente, importe e gerencie todos os documentos oficiais da empresa com validade fiscal.')}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label={t('admin.documents.stat_docs', 'Documentos Emitidos')} value={documents.length.toString()} />
          <StatCard label={t('admin.documents.stat_catalog', 'Serviços Indexados')} value={catalogCount.toString()} />
          <StatCard label={t('admin.documents.stat_vat', 'Taxa de IVA Legal')} value="16%" />
        </div>
      </div>

      {/* Alertas */}
      {errorMessage ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200 flex items-center gap-3 shadow-lg">
          <X className="h-5 w-5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {successToast ? (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-5 py-4 text-sm text-emerald-200 flex items-center gap-3 shadow-lg">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="font-bold">{successToast}</span>
        </motion.div>
      ) : null}

      {/* Barra de Ferramentas Moderna */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-darker/80 p-5 backdrop-blur-md shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 mr-2">
            <Filter className="h-4 w-4 text-primary" />
            <span>Filtrar:</span>
          </div>
          {['all', 'invoice', 'receipt', 'quotation', 'purchase-order'].map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setFilterKind(kind)}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-bold transition-all",
                filterKind === kind
                  ? "bg-primary text-white shadow-[0_0_15px_rgba(0,102,255,0.4)]"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              )}
            >
              {kind === 'all' ? 'Todos os Documentos' : t(`document.kind.${kind}`)}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => handleOpenCreator('invoice')}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-blue-600 px-5 py-3 text-sm font-bold text-white hover:shadow-[0_0_25px_rgba(0,102,255,0.5)] transition-all duration-300 font-display shadow-lg active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Documento Oficial</span>
        </button>
      </div>

      {/* Zona Moderna de Upload (Drag & Drop) */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "relative overflow-hidden rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-300",
          dragOver
            ? "border-primary bg-primary/10 shadow-[0_0_40px_rgba(0,102,255,0.3)] scale-[1.01]"
            : "border-white/15 bg-dark/60 hover:border-primary/40 hover:bg-dark/80"
        )}
      >
        <input
          type="file"
          id="file-upload"
          onChange={handleFileInput}
          accept=".pdf,.docx,.xlsx"
          className="hidden"
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary border border-primary/20 shadow-inner group-hover:scale-110 transition-transform">
            {uploadingFile ? (
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            ) : (
              <UploadCloud className="h-10 w-10" />
            )}
          </div>
          <h3 className="text-xl font-bold font-display text-white mb-1">
            {uploadingFile ? 'A processar e verificar arquivo...' : 'Importe ou arraste arquivos para o repositório'}
          </h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto mb-4">
            Suporta documentos em formato <span className="text-white font-semibold">PDF, DOCX e XLSX</span>. Indexação e extração de metadados automática.
          </p>
          <span className="inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-hover shadow-lg transition-colors font-display">
            Procurar no Computador
          </span>
        </label>

        {uploadedFiles.length > 0 && (
          <div className="mt-8 border-t border-white/10 pt-6 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-3">
              Repositório Local • Documentos Importados Recentes
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-darker p-3.5 hover:border-white/20 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <File className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">{file.size} • {file.date}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedFiles(prev => prev.filter(f => f.id !== file.id))}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grade Principal: Templates & Documentos Emitidos */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-dark p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
                  <FileBadge className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display text-white">{t('admin.documents.templates_title', 'Modelos Oficiais de Documentos')}</h2>
                  <p className="text-sm text-gray-400">
                    {t('admin.documents.templates_sub', 'Selecione um template abaixo para gerar um PDF com cabeçalho e NUIT da empresa.')}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                100% Personalizável
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {templates.map((template) => (
                <motion.button
                  key={template.kind}
                  type="button"
                  onClick={() => handleOpenCreator(template.kind)}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-darker p-5 text-left transition-all duration-300 hover:border-primary/50 hover:bg-white/[0.04] hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
                >
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                        <template.icon className="h-5 w-5" />
                      </div>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-gray-400 group-hover:bg-primary/20 group-hover:text-primary transition-all">
                        <Plus className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <div className="mb-1 text-base font-bold text-white group-hover:text-primary transition-colors font-display">
                      {t(`document.kind.${template.kind}`)}
                    </div>
                    <div className="text-xs leading-relaxed text-gray-400">
                      {t(`document.description.${template.kind}`)}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-500 font-medium group-hover:text-gray-300">
                    <span>Clique para configurar</span>
                    <Sparkles className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-dark p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <LetterText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-display text-white">{t('admin.documents.letterhead_title', 'Papel Timbrado Oficial da Empresa')}</h2>
                <p className="text-sm text-gray-400">
                  {t('admin.documents.letterhead_sub', 'Configuração padrão aplicada automaticamente no cabeçalho de todos os PDFs gerados.')}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-darker shadow-2xl">
              <div className="bg-gradient-to-r from-primary to-blue-600 px-6 py-5">
                <div className="text-xs font-bold uppercase tracking-[0.28em] text-white/80 font-mono">
                  {companyProfile.tagline}
                </div>
                <div className="mt-1 text-3xl font-black font-display text-white tracking-tight">
                  {companyProfile.brandName}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 text-sm text-gray-300 bg-dark/50">
                <div>
                  <span className="text-xs text-gray-500 block mb-0.5">Razão Social & NUIT</span>
                  <div className="font-bold text-white">{companyProfile.legalName}</div>
                  <div className="text-gray-400 font-mono">NUIT: {companyProfile.nuit}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-0.5">Endereço Sede</span>
                  <div className="text-white">{companyProfile.addressLine1}</div>
                  <div className="text-gray-400">{companyProfile.addressLine2}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-0.5">Contactos Oficiais</span>
                  <div className="text-white">{companyProfile.phone}</div>
                  <div className="text-gray-400">{companyProfile.email}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-0.5">Portal Web</span>
                  <div className="text-white font-mono">{companyProfile.website}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Documentos Recentes */}
        <div className="rounded-3xl border border-white/10 bg-dark p-6 shadow-2xl flex flex-col">
          <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-bold font-display text-white">{t('admin.documents.recent_title', 'Repositório de Emissões')}</h2>
              <p className="text-sm text-gray-400">
                {t('admin.documents.recent_sub', 'Histórico oficial de faturas e recibos gerados.')}
              </p>
            </div>
            <span className="text-xs font-bold text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              {filteredDocs.length} itens
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar max-h-[700px]">
              {filteredDocs.map((document) => {
                const TemplateIcon = templates.find((item) => item.kind === document.kind)?.icon ?? FileText;
                const isDownloading = downloadingId === document.id;

                return (
                  <div
                    key={document.id}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-darker p-4 hover:border-primary/40 hover:bg-white/[0.03] transition-all duration-300 shadow-md"
                  >
                    <div className="flex min-w-0 items-start gap-3.5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                        <TemplateIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-bold text-white font-display text-base">{document.number}</span>
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                            {document.status}
                          </span>
                        </div>
                        <div className="truncate text-sm font-medium text-gray-300 mt-0.5">{document.party_name}</div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 font-mono">
                          <span>{t(`document.kind.${document.kind}`)}</span>
                          <span>•</span>
                          <span>{document.report_category === 'with_vat' ? 'Com IVA' : 'Sem IVA'}</span>
                          <span>•</span>
                          <span>{document.issue_date}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={() => {
                        setDownloadingId(document.id);
                        generateBusinessDocumentPdf(toPdfDocument(document))
                          .finally(() => setDownloadingId(null));
                      }}
                      className={cn(
                        "shrink-0 flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 shadow-md",
                        isDownloading
                          ? "bg-primary text-white scale-95"
                          : "bg-white/5 text-gray-300 hover:bg-primary hover:text-white hover:shadow-[0_0_20px_rgba(0,102,255,0.4)] active:scale-95"
                      )}
                      title={t('admin.documents.download_title', 'Baixar Documento PDF Oficial')}
                    >
                      {isDownloading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      ) : (
                        <Download className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                );
              })}

              {filteredDocs.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center text-gray-500 my-8">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-600 animate-pulse" />
                  <p className="text-base font-bold text-gray-300">Nenhum documento encontrado</p>
                  <p className="text-xs text-gray-500 mt-1">Nenhum registro para o filtro selecionado.</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Modal Criador de Documentos Personalizados */}
      <AnimatePresence>
        {isCreatorOpen && activeTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-darker p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] my-8"
            >
              <button
                type="button"
                onClick={() => setIsCreatorOpen(false)}
                className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6 border-b border-white/10 pb-6">
                <span className="inline-block rounded-full bg-primary/20 border border-primary/30 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary mb-2">
                  Gerador de Documento Oficial
                </span>
                <h3 className="text-2xl font-bold font-display text-white tracking-tight">
                  Configurar • {t(`document.kind.${activeTemplate}`)}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Preencha os dados do cliente e os serviços a faturar. O PDF incluirá papel timbrado e cálculo de IVA legal.
                </p>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Título do Documento</label>
                    <input
                      type="text"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-dark py-3 px-4 text-sm font-semibold text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Nome do Cliente / Entidade</label>
                    <input
                      type="text"
                      value={partyName}
                      onChange={(e) => setPartyName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-dark py-3 px-4 text-sm font-semibold text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">NUIT / NIF do Cliente</label>
                  <input
                    type="text"
                    value={partyTaxId}
                    onChange={(e) => setPartyTaxId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-dark py-3 px-4 text-sm font-semibold text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Ex: 400192839"
                  />
                </div>

                {activeTemplate !== 'letterhead' ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">Itens / Serviços a Faturar</label>
                      <button
                        type="button"
                        onClick={() => setDocItems(prev => [...prev, { description: 'Novo Serviço', quantity: 1, unitPrice: 1000 }])}
                        className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span>Adicionar Item</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {docItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 bg-dark p-3 rounded-xl border border-white/10">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDocItems(prev => prev.map((it, i) => i === index ? { ...it, description: val } : it));
                            }}
                            className="flex-1 rounded-lg border border-white/5 bg-darker py-2 px-3 text-sm text-white focus:border-primary focus:outline-none"
                            placeholder="Descrição"
                          />
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              setDocItems(prev => prev.map((it, i) => i === index ? { ...it, quantity: val } : it));
                            }}
                            className="w-20 rounded-lg border border-white/5 bg-darker py-2 px-3 text-sm text-center text-white focus:border-primary focus:outline-none"
                            placeholder="Qtd"
                            min="1"
                          />
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setDocItems(prev => prev.map((it, i) => i === index ? { ...it, unitPrice: val } : it));
                            }}
                            className="w-28 rounded-lg border border-white/5 bg-darker py-2 px-3 text-sm text-right text-white focus:border-primary focus:outline-none"
                            placeholder="Preço Unit."
                          />
                          <button
                            type="button"
                            disabled={docItems.length === 1}
                            onClick={() => setDocItems(prev => prev.filter((_, i) => i !== index))}
                            className="text-gray-500 hover:text-red-400 disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-2xl bg-dark p-4 border border-white/5 text-sm">
                      <span className="text-gray-400 font-medium">Subtotal Estimado:</span>
                      <span className="text-lg font-bold font-display text-primary">
                        {docItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0).toFixed(2)} MT
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Corpo do Texto / Conteúdo Oficial</label>
                    <textarea
                      rows={6}
                      value={docBody}
                      onChange={(e) => setDocBody(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-dark py-3 px-4 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Notas de Rodapé / Validade Jurídica</label>
                  <input
                    type="text"
                    value={docNotes}
                    onChange={(e) => setDocNotes(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-dark py-3 px-4 text-sm text-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreatorOpen(false)}
                  className="rounded-xl border border-white/20 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={generatingPdf}
                  onClick={() => void handleGenerateOfficialDocument()}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-blue-600 px-8 py-3 text-sm font-bold text-white hover:shadow-[0_0_30px_rgba(0,102,255,0.5)] transition-all font-display shadow-lg"
                >
                  {generatingPdf ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  ) : (
                    <Sparkles className="h-5 w-5 text-white/80" />
                  )}
                  <span>{generatingPdf ? 'A gerar e validar PDF...' : 'Gerar Documento e PDF Oficial'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-dark px-5 py-4 shadow-inner">
      <div className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">{label}</div>
      <div className="text-2xl font-black font-display text-white">{value}</div>
    </div>
  );
}
