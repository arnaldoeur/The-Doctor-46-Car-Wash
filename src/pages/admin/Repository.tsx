import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  File,
  Loader2,
  Search,
  FolderOpen,
  Folder,
} from 'lucide-react';
import { fetchBusinessDocuments, type BusinessDocumentRow } from '../../lib/adminData';
import { type BusinessDocument } from '../../lib/documentCenter';
import { generateBusinessDocumentPdf } from '../../lib/pdfMachine';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../providers/LanguageProvider';

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

const formatMoney = (value: number) =>
  `${new Intl.NumberFormat('pt-MZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} MT`;

export default function Repository() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<BusinessDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const folderLabels = useMemo<Record<string, string>>(() => ({
    invoice: t('admin.billing.tab_invoices'),
    receipt: t('admin.billing.tab_receipts'),
    'purchase-order': t('document.kind.purchase-order'),
    quotation: t('document.kind.quotation'),
    letterhead: t('document.kind.letterhead'),
  }), [t]);

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
        console.error('Failed to load repository documents', error);
        if (active) {
          setErrorMessage(t('admin.repository.error_load'));
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

  const folders = useMemo(() => {
    return Object.entries(folderLabels).map(([kind, name]) => ({
      id: kind,
      name,
      count: documents.filter((document) => document.kind === kind).length,
    }));
  }, [documents, folderLabels]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      const kindLabel = t(`document.kind.${document.kind}`);
      const haystack = `${document.number} ${document.title} ${document.party_name} ${kindLabel}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesFolder = !activeFolder || document.kind === activeFolder;
      return matchesSearch && matchesFolder;
    });
  }, [activeFolder, documents, search, t]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold font-display">{t('admin.repository.title')}</h1>
          <p className="text-gray-400">
            {t('admin.repository.sub')}
          </p>
        </div>
        <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
          {documents.length} {t('admin.repository.badge_count')}
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <aside className="space-y-4 lg:col-span-1">
          <h3 className="mb-4 text-lg font-bold font-display text-white">{t('admin.repository.folders_title')}</h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setActiveFolder(null)}
              className={cn(
                'flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                activeFolder === null
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <span className="flex items-center gap-3">
                <FolderOpen className="h-5 w-5" />
                {t('admin.repository.folder_all')}
              </span>
              <span className="rounded-full bg-white/10 px-2 py-1 text-xs">{documents.length}</span>
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => setActiveFolder(folder.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                  activeFolder === folder.id
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <span className="flex items-center gap-3">
                  <Folder className="h-5 w-5" />
                  {folder.name}
                </span>
                <span className="rounded-full bg-white/10 px-2 py-1 text-xs">{folder.count}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-dark lg:col-span-3">
          <div className="border-b border-white/10 bg-darker/50 p-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder={t('admin.repository.search_placeholder')}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-dark py-2 pl-9 pr-4 text-sm text-white transition-colors focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-darker/30">
                    <th className="p-4 text-sm font-medium text-gray-400">{t('admin.repository.th_document')}</th>
                    <th className="p-4 text-sm font-medium text-gray-400">{t('admin.repository.th_type')}</th>
                    <th className="p-4 text-sm font-medium text-gray-400">{t('admin.repository.th_client')}</th>
                    <th className="p-4 text-sm font-medium text-gray-400">{t('admin.repository.th_date')}</th>
                    <th className="p-4 text-right text-sm font-medium text-gray-400">{t('admin.repository.th_total')}</th>
                    <th className="p-4 text-right text-sm font-medium text-gray-400">{t('admin.repository.th_actions')}</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredDocuments.map((document) => (
                    <tr key={document.id} className="border-b border-white/5 transition-colors hover:bg-white/5">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <File className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-medium text-white">{document.number}</div>
                            <div className="text-xs text-gray-500">{document.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-300">{t(`document.kind.${document.kind}`)}</td>
                      <td className="p-4 text-gray-400">{document.party_name}</td>
                      <td className="p-4 text-gray-400">{document.issue_date}</td>
                      <td className="p-4 text-right font-semibold text-white">{formatMoney(document.total)}</td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => void generateBusinessDocumentPdf(toPdfDocument(document))}
                          className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <Download className="h-4 w-4" />
                          {t('admin.repository.th_actions')}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        {t('admin.repository.empty_list')}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-gray-300">
        {t('admin.repository.notice')}
      </div>
    </div>
  );
}
